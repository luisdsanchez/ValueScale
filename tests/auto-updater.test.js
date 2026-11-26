const test = require('node:test');
const assert = require('node:assert/strict');
const EventEmitter = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const vm = require('node:vm');

async function loadUpdater() {
  const state = {
    quitCount: 0,
    errors: [],
    spawnPath: null,
    spawnArgs: null,
    spawnOptions: null,
    unrefCalled: false,
  };
  const child = new EventEmitter();
  child.unref = () => { state.unrefCalled = true; };
  const module = { exports: {} };
  const fakeFs = {
    existsSync: () => true,
    createWriteStream: () => {
      const stream = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
      stream.close = () => {};
      return stream;
    },
    unlink: (_path, callback) => callback(),
  };
  const releaseUrl = 'https://api.github.com/repos/luisdsanchez/ValueScale/releases/latest';
  const assetUrl = 'https://example.test/ValueScale_1.2.4.exe';
  const https = {
    get(url, options, callback) {
      const onResponse = typeof options === 'function' ? options : callback;
      const request = new EventEmitter();
      if (url === releaseUrl) {
        setImmediate(() => {
          const response = new EventEmitter();
          response.statusCode = 200;
          onResponse(response);
          response.emit('data', JSON.stringify({
            tag_name: 'v1.2.4',
            assets: [{ browser_download_url: assetUrl }],
            html_url: 'https://github.com/luisdsanchez/ValueScale/releases/tag/v1.2.4',
            prerelease: false,
            body: '',
          }));
          response.emit('end');
        });
      } else if (url === assetUrl) {
        setImmediate(() => onResponse({
          statusCode: 302,
          headers: { location: 'https://assets.example.test/ValueScale_1.2.4.exe' },
        }));
      } else {
        setImmediate(() => {
          const response = Readable.from([Buffer.from('portable executable')]);
          response.statusCode = 200;
          onResponse(response);
        });
      }
      return request;
    },
  };
  const electron = {
    app: {
      getVersion: () => '1.2.3',
      getPath: () => 'temp',
      quit: () => { state.quitCount += 1; },
    },
    ipcMain: { handle() {} },
    dialog: { showErrorBox: (...args) => state.errors.push(args) },
  };
  const source = fs.readFileSync(require.resolve('../auto-updater'), 'utf8');
  vm.runInNewContext(source, {
    require: (name) => {
      if (name === 'electron') return electron;
      if (name === 'https') return https;
      if (name === 'fs') return fakeFs;
      if (name === 'child_process') {
        return {
          spawn: (file, args, options) => {
            state.spawnPath = file;
            state.spawnArgs = args;
            state.spawnOptions = options;
            return child;
          },
        };
      }
      return require(name);
    },
    module,
    console: { error() {}, log() {} },
  });
  await module.exports.checkForUpdates();
  return { updater: module.exports, child, state };
}

test('install waits for the updater process to spawn before quitting', async () => {
  const { updater, child, state } = await loadUpdater();

  updater.installUpdate();

  assert.equal(state.spawnPath, path.join('temp', 'ValueScale-update.exe'));
  assert.equal(state.spawnArgs.length, 1);
  assert.equal(state.spawnArgs[0], '--updated');
  assert.equal(state.spawnOptions.detached, true);
  assert.equal(state.spawnOptions.stdio, 'ignore');
  assert.equal(state.quitCount, 0);
  child.emit('spawn');
  assert.equal(state.unrefCalled, true);
  assert.equal(state.quitCount, 1);
});

test('failed updater launch keeps the app open and reports the error', async () => {
  const { updater, child, state } = await loadUpdater();

  updater.installUpdate();
  child.emit('error', new Error('spawn denied'));

  assert.equal(state.quitCount, 0);
  assert.equal(state.errors.length, 1);
  assert.equal(state.errors[0][1], 'Failed to launch update installer: spawn denied');
});
