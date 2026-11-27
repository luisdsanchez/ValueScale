const test = require('node:test');
const assert = require('node:assert/strict');
const EventEmitter = require('node:events');
const fs = require('node:fs');
const vm = require('node:vm');

function loadUpdater(options = {}) {
  const state = { events: [], requests: [], handlers: {}, opened: [], errors: [], deferred: null };
  const electron = {
    app: { getVersion: () => options.currentVersion || '1.2.8' },
    ipcMain: { handle: (name, handler) => { state.handlers[name] = handler; } },
    shell: {
      openExternal: async (url) => {
        state.opened.push(url);
        if (options.openError) throw options.openError;
      },
    },
  };
  const https = {
    get(url, _options, callback) {
      state.requests.push(url);
      const request = new EventEmitter();
      const respond = () => {
        const response = new EventEmitter();
        response.statusCode = options.status || 200;
        callback(response);
        response.emit('data', JSON.stringify({
          tag_name: options.latestVersion || 'v1.2.9',
          html_url: 'https://untrusted.example/test',
          assets: [{ name: 'ValueScale.exe', browser_download_url: 'https://untrusted.example/update.exe' }],
        }));
        response.emit('end');
      };
      if (options.deferred) state.deferred = respond;
      else setImmediate(respond);
      return request;
    },
  };
  const module = { exports: {} };
  const source = fs.readFileSync(require.resolve('../auto-updater'), 'utf8');
  vm.runInNewContext(source, {
    require: (name) => {
      if (name === 'electron') return electron;
      if (name === 'https') return https;
      return require(name);
    },
    module,
    console: { log() {}, error: (...args) => state.errors.push(args) },
    setInterval: () => 1,
    clearInterval() {},
  });
  module.exports.setupIpcHandlers();
  return { updater: module.exports, state };
}

test('new releases notify immediately without downloading the executable', async () => {
  const { updater, state } = loadUpdater({ deferred: true });
  updater.startPeriodicCheck({
    isDestroyed: () => false,
    webContents: { send: (...args) => state.events.push(args) },
  });
  const check = updater.checkForUpdates();
  const status = state.handlers['check-for-updates']();
  assert.equal(state.requests.length, 1);
  state.deferred();
  await check;
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0][0], 'update-available');
  assert.equal(state.events[0][1].version, '1.2.9');
  assert.equal(state.requests[0], 'https://api.github.com/repos/luisdsanchez/ValueScale/releases/latest');
  assert.equal(await status, true);
});

test('up-to-date installations do not show an update notification', async () => {
  const { updater, state } = loadUpdater({ latestVersion: 'v1.2.8' });
  updater.startPeriodicCheck({
    isDestroyed: () => false,
    webContents: { send: (...args) => state.events.push(args) },
  });
  await updater.checkForUpdates();
  assert.equal(state.events.length, 0);
});

test('release check failures are logged without showing an update', async () => {
  const { updater, state } = loadUpdater({ status: 403 });
  updater.startPeriodicCheck({
    isDestroyed: () => false,
    webContents: { send: (...args) => state.events.push(args) },
  });
  await updater.checkForUpdates();
  assert.equal(state.events.length, 0);
  assert.match(state.errors[0][1].message, /status 403/);
});

test('the update action opens the official release page and propagates errors', async () => {
  const { state } = loadUpdater({ openError: new Error('browser unavailable') });
  await assert.rejects(state.handlers['open-update-page'](), /browser unavailable/);
  assert.deepEqual(state.opened, ['https://github.com/luisdsanchez/ValueScale/releases/latest']);
});

test('the update notice opens GitHub, reports errors, and restores the capture prompt when dismissed', async () => {
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  const source = html.slice(html.indexOf('// Setup update notification handlers'), html.indexOf('gl.clearColor('));
  const elements = new Map();
  class Element {
    constructor() { this.children = []; this.listeners = {}; }
    set id(value) { this._id = value; elements.set(value, this); }
    set textContent(value) { this.text = value; this.children = []; }
    get textContent() { return this.text; }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); }
    addEventListener(name, callback) { this.listeners[name] = callback; }
  }
  const notification = new Element();
  notification.id = 'update-notification';
  let handler;
  let opens = 0;
  let fail = true;
  let prompts = 0;
  let projectionSource = null;
  const api = {
    onUpdateAvailable: (callback) => { handler = callback; },
    openUpdatePage: async () => { opens += 1; if (fail) throw new Error('browser unavailable'); },
  };
  vm.runInNewContext(source, {
    window: { api },
    document: { createElement: () => new Element(), getElementById: (id) => elements.get(id) },
    windowSelectionPrompt: { hidden: false },
    getProjectionSource: () => projectionSource,
    showWindowSelectionPrompt: () => { prompts += 1; },
    updateAvailable: false,
    console: { error() {} },
  });
  handler({ version: '1.2.9' });
  const button = elements.get('install-update-btn');
  const status = elements.get('update-notification-status');
  assert.equal(button.textContent, 'Open GitHub');
  assert.match(status.textContent, /1\.2\.9/);
  await button.listeners.click();
  assert.match(status.textContent, /Could not open GitHub/);
  assert.equal(button.disabled, false);
  fail = false;
  await button.listeners.click();
  assert.equal(opens, 2);
  elements.get('dismiss-update-btn').listeners.click();
  assert.equal(notification.hidden, true);
  assert.equal(prompts, 1);
  projectionSource = { element: {} };
  handler({ version: '1.2.9' });
  elements.get('dismiss-update-btn').listeners.click();
  assert.equal(prompts, 1);
});
