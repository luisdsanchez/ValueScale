const test = require('node:test');
const assert = require('node:assert/strict');
const EventEmitter = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PassThrough, Readable, Writable } = require('node:stream');
const vm = require('node:vm');

async function loadUpdater(options = {}) {
  const payload = Buffer.from('portable executable');
  const state = {
    quitCount: 0,
    errors: [],
    spawnPath: null,
    spawnCount: 0,
    spawnArgs: null,
    spawnOptions: null,
    unrefCalled: false,
    events: [],
    removed: [],
    helperRemoved: [],
    copied: null,
    responses: new EventEmitter(),
    releaseRequests: 0,
    status: options.status || 200,
    expectedSize: options.expectedSize === undefined ? payload.length : options.expectedSize,
    deferred: Boolean(options.deferred),
    redirectLocation: options.redirectLocation || 'https://assets.example.test/ValueScale_1.2.4.exe',
  };
  const child = new EventEmitter();
  child.unref = () => { state.unrefCalled = true; };
  const module = { exports: {} };
  const fakeFs = {
    existsSync: () => true,
    realpathSync: (file) => file,
    mkdtempSync: (prefix) => `${prefix}test`,
    copyFileSync: (...args) => { state.copied = args; },
    unlinkSync: (file) => state.helperRemoved.push(file),
    rmdirSync: (dir) => state.helperRemoved.push(dir),
    constants: fs.constants,
    createWriteStream: () => {
      const stream = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
      stream.close = (callback) => setImmediate(callback);
      return stream;
    },
    unlink: (file, callback) => { state.removed.push(file); callback(); },
  };
  const releaseUrl = 'https://api.github.com/repos/luisdsanchez/ValueScale/releases/latest';
  const assetUrl = 'https://example.test/ValueScale_1.2.4.exe';
  const https = {
    get(url, options, callback) {
      const onResponse = typeof options === 'function' ? options : callback;
      const request = new EventEmitter();
      if (url === releaseUrl) {
        state.releaseRequests += 1;
        setImmediate(() => {
          const response = new EventEmitter();
          response.statusCode = 200;
          onResponse(response);
          response.emit('data', JSON.stringify({
            tag_name: 'v1.2.4',
            assets: [
              { name: 'source.zip', browser_download_url: 'https://example.test/source.zip' },
              { name: 'ValueScale_1.2.4.exe', browser_download_url: assetUrl, size: state.expectedSize },
            ],
            html_url: 'https://github.com/luisdsanchez/ValueScale/releases/tag/v1.2.4',
            prerelease: false,
            body: '',
          }));
          response.emit('end');
        });
      } else if (url === assetUrl) {
        setImmediate(() => {
          const response = Readable.from([]);
          response.statusCode = 302;
          response.headers = { location: state.redirectLocation };
          onResponse(response);
        });
      } else {
        setImmediate(() => {
          const response = state.deferred ? new PassThrough() : Readable.from([payload]);
          response.statusCode = state.status;
          response.headers = {};
          onResponse(response);
          state.response = response;
          state.responses.emit('ready');
        });
      }
      return request;
    },
  };
  const electron = {
    app: {
      getVersion: () => '1.2.3',
      getPath: () => options.tempDir || 'temp',
      isPackaged: true,
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
      if (name === 'fs') return options.realFs ? fs : fakeFs;
      if (name === 'child_process') {
        return {
          spawn: (file, args, options) => {
            state.spawnCount += 1;
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
    process: {
      pid: 4321,
      platform: 'win32',
      env: {
        PORTABLE_EXECUTABLE_FILE: options.noPortablePath ? undefined : path.resolve('ValueScale original.exe'),
        SystemRoot: 'C:\\Windows',
      },
    },
    __dirname: path.resolve('.'),
    URL,
    setInterval: () => 1,
    clearInterval() {},
  });
  if (options.autoCheck !== false) await module.exports.checkForUpdates();
  return { updater: module.exports, child, state };
}

test('install waits for the updater process to spawn before quitting', async () => {
  const { updater, child, state } = await loadUpdater();

  updater.installUpdate();

  assert.equal(state.spawnPath, path.join('C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'));
  assert.equal(state.spawnArgs[state.spawnArgs.indexOf('-SourcePath') + 1], path.join('temp', 'ValueScale-update-4321-1.exe'));
  assert.equal(state.spawnArgs[state.spawnArgs.indexOf('-TargetPath') + 1], path.resolve('ValueScale original.exe'));
  assert.equal(state.spawnArgs[state.spawnArgs.indexOf('-ParentProcessId') + 1], '4321');
  assert.ok(state.spawnArgs.includes('-CleanupHelper'));
  assert.equal(state.copied[0], path.join(path.resolve('.'), 'portable-update.ps1'));
  assert.equal(state.spawnOptions.detached, true);
  assert.equal(state.spawnOptions.stdio, 'ignore');
  assert.equal(state.quitCount, 0);
  updater.installUpdate();
  assert.equal(state.spawnCount, 1);
  child.emit('spawn');
  assert.equal(state.unrefCalled, true);
  assert.equal(state.quitCount, 1);
});

test('completed update is closed and available on disk before installation', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'valuescale-update-test-'));
  t.after(() => {
    for (const name of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, name));
    fs.rmdirSync(dir);
  });
  await loadUpdater({ realFs: true, tempDir: dir });
  assert.equal(fs.readFileSync(path.join(dir, 'ValueScale-update-4321-1.exe'), 'utf8'), 'portable executable');
});

test('failed updater launch keeps the app open and reports the error', async () => {
  const { updater, child, state } = await loadUpdater();

  updater.installUpdate();
  child.emit('error', new Error('spawn denied'));

  assert.equal(state.quitCount, 0);
  assert.equal(state.errors.length, 1);
  assert.equal(state.errors[0][1], 'Failed to launch update installer: spawn denied');
  assert.equal(state.helperRemoved.length, 2);
  updater.installUpdate();
  assert.equal(state.spawnCount, 2);
});

test('missing portable executable reports an error without quitting', async () => {
  const { updater, state } = await loadUpdater({ noPortablePath: true });
  updater.installUpdate();
  assert.equal(state.spawnPath, null);
  assert.equal(state.quitCount, 0);
  assert.match(state.errors[0][1], /original Windows portable executable could not be located/);
});

test('update is not ready until the complete download has finished', async () => {
  const { updater, state } = await loadUpdater({ autoCheck: false, deferred: true });
  updater.startPeriodicCheck({
    isDestroyed: () => false,
    webContents: { send: (event) => state.events.push(event) },
  });
  const check = updater.checkForUpdates();
  await new Promise((resolve) => state.responses.once('ready', resolve));
  assert.equal(state.releaseRequests, 1);
  assert.deepEqual(state.events, ['update-available']);
  updater.installUpdate();
  assert.equal(state.spawnPath, null);
  assert.equal(state.errors[0][1], 'No update available to install.');
  state.response.end(Buffer.from('portable executable'));
  await check;
  assert.deepEqual(state.events, ['update-available', 'update-downloaded']);
  updater.installUpdate();
  assert.equal(state.spawnArgs[state.spawnArgs.indexOf('-SourcePath') + 1], path.join('temp', 'ValueScale-update-4321-1.exe'));
});

test('HTTP errors report download failure and a retry can succeed', async () => {
  const { updater, state } = await loadUpdater({ autoCheck: false, status: 403 });
  updater.startPeriodicCheck({
    isDestroyed: () => false,
    webContents: { send: (event) => state.events.push(event) },
  });
  await updater.checkForUpdates();
  assert.deepEqual(state.events, ['update-available', 'update-download-failed']);
  updater.installUpdate();
  assert.equal(state.spawnPath, null);
  state.status = 200;
  await updater.checkForUpdates();
  assert.deepEqual(state.events, ['update-available', 'update-download-failed', 'update-available', 'update-downloaded']);
});

test('incomplete downloads are rejected and removed', async () => {
  const { updater, state } = await loadUpdater({ autoCheck: false, expectedSize: 100 });
  updater.startPeriodicCheck({
    isDestroyed: () => false,
    webContents: { send: (event) => state.events.push(event) },
  });
  await updater.checkForUpdates();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(state.events, ['update-available', 'update-download-failed']);
  assert.deepEqual(state.removed, [path.join('temp', 'ValueScale-update-4321-1.exe')]);
  updater.installUpdate();
  assert.equal(state.spawnPath, null);
});

test('interrupted downloads are rejected and removed', async () => {
  const { updater, state } = await loadUpdater({ autoCheck: false, deferred: true });
  updater.startPeriodicCheck({
    isDestroyed: () => false,
    webContents: { send: (event) => state.events.push(event) },
  });
  const check = updater.checkForUpdates();
  await new Promise((resolve) => state.responses.once('ready', resolve));
  state.response.write('partial');
  state.response.emit('aborted');
  await check;
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(state.events, ['update-available', 'update-download-failed']);
  assert.deepEqual(state.removed, [path.join('temp', 'ValueScale-update-4321-1.exe')]);
});

test('update downloads reject insecure redirects', async () => {
  const { updater, state } = await loadUpdater({ autoCheck: false, redirectLocation: 'http://example.test/update.exe' });
  updater.startPeriodicCheck({
    isDestroyed: () => false,
    webContents: { send: (event) => state.events.push(event) },
  });
  await updater.checkForUpdates();
  assert.deepEqual(state.events, ['update-available', 'update-download-failed']);
  updater.installUpdate();
  assert.equal(state.spawnPath, null);
});

test('update notification disables opening until download completes and offers retry on failure', async () => {
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  const source = html.slice(html.indexOf('// Setup update notification handlers'), html.indexOf('gl.clearColor('));
  const elements = new Map();
  class Element {
    constructor() { this.children = []; this.dataset = {}; this.listeners = {}; }
    set id(value) { this._id = value; elements.set(value, this); }
    set textContent(value) { this.text = value; this.children = []; }
    get textContent() { return this.text; }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); }
    addEventListener(name, callback) { this.listeners[name] = callback; }
  }
  const notification = new Element();
  notification.id = 'update-notification';
  const handlers = {};
  let retries = 0;
  let opens = 0;
  const api = {
    onUpdateAvailable: (handler) => { handlers.available = handler; },
    onUpdateDownloaded: (handler) => { handlers.downloaded = handler; },
    onUpdateDownloadFailed: (handler) => { handlers.failed = handler; },
    checkForUpdates: async () => { retries += 1; return true; },
    installUpdate: async () => { opens += 1; },
  };
  vm.runInNewContext(source, {
    window: { api },
    document: { createElement: () => new Element(), getElementById: (id) => elements.get(id) },
    windowSelectionPrompt: { hidden: false },
    updateAvailable: false,
    console,
  });
  handlers.available({ version: '1.2.6' });
  const button = elements.get('install-update-btn');
  const status = elements.get('update-notification-status');
  assert.equal(button.disabled, true);
  assert.match(status.textContent, /Downloading/);
  handlers.failed();
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, 'Retry download');
  await button.listeners.click();
  assert.equal(retries, 1);
  assert.equal(button.disabled, true);
  handlers.downloaded();
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, 'Install & Restart');
  assert.match(status.textContent, /ready to install/);
  await button.listeners.click();
  assert.equal(opens, 1);
});
