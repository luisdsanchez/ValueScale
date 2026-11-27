const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function loadMain(savedSettings = null) {
  const handlers = {};
  const listeners = {};
  const writes = [];
  const windows = [];
  let writeError = null;
  const display = { id: 1, bounds: { width: 1920, height: 1080 }, workArea: { x: 0, y: 0, width: 1920, height: 1080 } };
  const screen = { getPrimaryDisplay: () => display, getDisplayMatching: () => display };
  class BrowserWindow {
    constructor(options) {
      this.bounds = { x: 0, y: 0, width: options.width, height: options.height, ...options };
      this.messages = [];
      this.webContents = { on() {}, once() {}, send: (...args) => { this.messages.push(args); } };
      windows.push(this);
    }
    setAspectRatio() {}
    setAlwaysOnTop() {}
    setVisibleOnAllWorkspaces() {}
    setContentProtection() {}
    loadFile() {}
    on() {}
    focus() {}
    getBounds() { return this.bounds; }
    setBounds(bounds) { this.bounds = bounds; }
    isDestroyed() { return false; }
  }
  const electron = {
    app: { setName() {}, getPath: () => 'test', getVersion: () => '9.8.7', whenReady: () => Promise.resolve(), on() {} },
    BrowserWindow,
    ipcMain: { handle: (name, fn) => { handlers[name] = fn; }, on: (name, fn) => { listeners[name] = fn; } },
    screen,
    desktopCapturer: {},
    session: { defaultSession: { setDisplayMediaRequestHandler() {} } },
  };
  const fakeFs = {
    readFileSync() {
      if (!savedSettings) throw new Error('No saved settings');
      return JSON.stringify(savedSettings);
    },
    writeFileSync(_path, content) {
      if (writeError) throw writeError;
      writes.push(JSON.parse(content));
    },
  };
  const source = fs.readFileSync(require.resolve('../main'), 'utf8');
  vm.runInNewContext(source, {
    require: (name) => {
      if (name === 'electron') return electron;
      if (name === 'fs') return fakeFs;
      if (name === './auto-updater') return { setupIpcHandlers() {}, startPeriodicCheck() {}, stopPeriodicCheck() {} };
      return require(name);
    },
    __dirname: 'test',
    console,
    process,
    setTimeout,
    clearTimeout,
  });
  await Promise.resolve();
  return { handlers, listeners, writes, windows, screen, failWrites: (error) => { writeError = error; } };
}

test('settings panel centers initially, preserves its position on resize, and stays onscreen', async () => {
  const { listeners, windows } = await loadMain();
  windows[0].setBounds({ x: 500, y: 300, width: 640, height: 360 });
  listeners['open-panel'](null, false);
  const panel = windows[1];
  assert.equal(panel.getBounds().x, 660);
  assert.equal(panel.getBounds().y, 255);
  listeners['resize-panel'](null, true);
  assert.equal(panel.getBounds().x, 660);
  assert.equal(panel.getBounds().y, 255);
  assert.equal(panel.getBounds().height, 450);
  panel.setBounds({ x: 1850, y: 1000, width: 320, height: 1080 });
  listeners['resize-panel'](null, false);
  assert.equal(panel.getBounds().x, 1600);
  assert.equal(panel.getBounds().y, 630);
  windows[0].setBounds({ x: 0, y: 0, width: 120, height: 68 });
  listeners['open-panel'](null, false);
  assert.equal(panel.getBounds().x, 1600);
  assert.equal(panel.getBounds().y, 630);
});

test('resizing a moved panel uses its current monitor', async () => {
  const { listeners, windows, screen } = await loadMain();
  listeners['open-panel'](null, false);
  const panel = windows[1];
  panel.setBounds({ x: 3700, y: 900, width: 320, height: 450 });
  screen.getDisplayMatching = (bounds) => ({
    workArea: bounds.x >= 1920
      ? { x: 1920, y: 0, width: 1920, height: 1080 }
      : { x: 0, y: 0, width: 1920, height: 1080 },
  });
  listeners['resize-panel'](null, true);
  assert.equal(panel.getBounds().x, 3520);
  assert.equal(panel.getBounds().y, 630);
  assert.equal(panel.getBounds().height, 450);
});

test('settings panel receives the running app version', async () => {
  const { handlers } = await loadMain();
  assert.equal(handlers['get-app-version'](), '9.8.7');
});

test('filter buttons toggle posterize and bound gray-value levels', async () => {
  const { handlers, listeners } = await loadMain();
  listeners['set-settings'](null, { levels: 10, brightness: 50, contrast: 2 });
  handlers['adjust-filter'](null, 'more');
  assert.equal(handlers['get-settings']().levels, 10);
  handlers['adjust-filter'](null, 'posterize');
  const settings = handlers['get-settings']();
  assert.equal(settings.posterize, false);
  assert.equal(settings.levels, 10);
  assert.equal(settings.brightness, 50);
  assert.equal(settings.contrast, 2);
  handlers['adjust-filter'](null, 'fewer');
  assert.equal(handlers['get-settings']().levels, 9);
  listeners['set-settings'](null, { levels: 2 });
  handlers['adjust-filter'](null, 'fewer');
  assert.equal(handlers['get-settings']().levels, 2);
});

test('gray-value controls reflect posterize visibility and retain level limits', () => {
  const source = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  const applySettings = source.match(/function applySettings\(s\) \{[\s\S]*?\n\}(?=\nwindow\.api\.onSettings)/)[0];
  const element = () => ({
    attributes: {},
    dataset: {},
    classList: { toggle(name, enabled) { this[name] = enabled; } },
    setAttribute(name, value) { this.attributes[name] = value; },
  });
  const context = { settings: { showQuickFilterButtons: true } };
  for (const name of ['quickAccess', 'quickFilterControls', 'quickAccessToggle', 'posterizeToggle',
    'valueWarningsToggle', 'saturationWarningsToggle', 'edgeDetectionToggle', 'warmCoolToggle',
    'saturationLegend', 'warmCoolLegend', 'valueCount', 'fewerValues', 'moreValues']) {
    context[name] = element();
  }
  vm.runInNewContext(applySettings, context);
  const settings = { showQuickFilterButtons: true, posterize: false, levels: 6 };
  context.applySettings(settings);
  assert.equal(context.fewerValues.disabled, true);
  assert.equal(context.moreValues.disabled, true);
  assert.equal(context.valueCount.classList.disabled, true);
  assert.equal(context.valueCount.textContent, '4');
  assert.match(context.valueCount.attributes['aria-label'], /posterize off/);
  context.applySettings({ ...settings, posterize: true });
  assert.equal(context.fewerValues.disabled, false);
  assert.equal(context.moreValues.disabled, false);
  assert.equal(context.valueCount.classList.disabled, false);
  context.applySettings({ ...settings, posterize: true, levels: 2 });
  assert.equal(context.fewerValues.disabled, true);
  assert.equal(context.moreValues.disabled, false);
  context.applySettings({ ...settings, posterize: true, levels: 10 });
  assert.equal(context.fewerValues.disabled, false);
  assert.equal(context.moreValues.disabled, true);
});

test('edge view defaults off and persists with its sensitivity', async () => {
  const { handlers, writes } = await loadMain({ version: 6, brightness: 25, contrast: 2 });
  assert.equal(handlers['get-settings']().edgeDetection, false);
  assert.equal(handlers['get-settings']().edgeSensitivity, 55);
  handlers['adjust-filter'](null, 'edgeDetection');
  handlers['set-edge-settings'](null, { edgeSensitivity: 72 });
  const reopened = await loadMain(writes.at(-1));
  assert.equal(reopened.handlers['get-settings']().edgeDetection, true);
  assert.equal(reopened.handlers['get-settings']().edgeSensitivity, 72);
  assert.equal(reopened.handlers['get-settings']().brightness, 25);
  assert.equal(reopened.handlers['get-settings']().contrast, 2);
});

test('warm/cool map replaces other checks and failed writes leave them unchanged', async () => {
  const { handlers, writes, failWrites } = await loadMain({ version: 7, edgeDetection: true, saturationWarnings: true });
  assert.equal(handlers['get-settings']().warmCool, false);
  assert.equal(handlers['get-settings']().edgeDetection, true);
  assert.equal(handlers['get-settings']().saturationWarnings, false);
  failWrites(new Error('disk full'));
  assert.throws(() => handlers['adjust-filter'](null, 'warmCool'), /disk full/);
  assert.equal(handlers['get-settings']().warmCool, false);
  assert.equal(handlers['get-settings']().edgeDetection, true);
  failWrites(null);
  handlers['adjust-filter'](null, 'warmCool');
  const reopened = await loadMain(writes.at(-1));
  assert.equal(reopened.handlers['get-settings']().warmCool, true);
  assert.equal(reopened.handlers['get-settings']().edgeDetection, false);
  assert.equal(reopened.handlers['get-settings']().saturationWarnings, false);
  reopened.handlers['adjust-filter'](null, 'warmCool');
  assert.equal(reopened.handlers['get-settings']().warmCool, false);
});

test('all checks replace one another and toggling the active check restores grayscale', async () => {
  const { handlers, writes } = await loadMain();
  const checks = ['posterize', 'edgeDetection', 'valueWarnings', 'saturationWarnings', 'warmCool'];
  handlers['adjust-filter'](null, 'posterize');
  for (const first of checks) {
    for (const second of checks) {
      if (first === second) continue;
      handlers['adjust-filter'](null, first);
      handlers['adjust-filter'](null, second);
      for (const key of checks) assert.equal(handlers['get-settings']()[key], key === second);
      handlers['adjust-filter'](null, second);
      for (const key of checks) assert.equal(handlers['get-settings']()[key], false);
    }
  }
  const reopened = await loadMain(writes.at(-1));
  for (const key of checks) assert.equal(reopened.handlers['get-settings']()[key], false);
});

test('panel check updates are exclusive without changing thresholds or disabling another check when set false', async () => {
  const { handlers, listeners, failWrites, windows } = await loadMain();
  listeners['open-panel'](null, false);
  handlers['set-warning-settings'](null, { darkThreshold: 10 });
  handlers['adjust-filter'](null, 'warmCool');
  handlers['set-warning-settings'](null, { valueWarnings: true });
  assert.equal(handlers['get-settings']().warmCool, false);
  assert.equal(handlers['get-settings']().valueWarnings, true);
  handlers['set-edge-settings'](null, { edgeDetection: true });
  assert.equal(handlers['get-settings']().valueWarnings, false);
  handlers['set-warning-settings'](null, { saturationWarnings: false });
  assert.equal(handlers['get-settings']().edgeDetection, true);
  failWrites(new Error('disk full'));
  assert.throws(() => handlers['set-warning-settings'](null, { saturationWarnings: true }), /disk full/);
  assert.equal(handlers['get-settings']().edgeDetection, true);
  assert.equal(handlers['get-settings']().saturationWarnings, false);
  failWrites(null);
  listeners['set-settings'](null, { saturationWarnings: true });
  assert.equal(handlers['get-settings']().saturationWarnings, true);
  assert.equal(handlers['get-settings']().edgeDetection, false);
  assert.equal(handlers['get-settings']().darkThreshold, 10);
  listeners['set-settings'](null, { posterize: true });
  assert.equal(handlers['get-settings']().posterize, true);
  assert.equal(handlers['get-settings']().saturationWarnings, false);
  assert.equal(windows[1].messages.at(-1)[1].posterize, true);
  assert.equal(windows[1].messages.at(-1)[1].saturationWarnings, false);
});

test('legacy simultaneous checks migrate to the previously visible view', async () => {
  for (const [saved, expected] of [
    [{ edgeDetection: true, warmCool: true, saturationWarnings: true, valueWarnings: true }, 'edgeDetection'],
    [{ warmCool: true, saturationWarnings: true, valueWarnings: true }, 'warmCool'],
    [{ saturationWarnings: true, valueWarnings: true }, 'saturationWarnings'],
  ]) {
    const { handlers, writes } = await loadMain({ version: 8, posterize: true, ...saved });
    for (const key of ['edgeDetection', 'warmCool', 'saturationWarnings', 'valueWarnings', 'posterize']) {
      assert.equal(handlers['get-settings']()[key], key === expected);
    }
    const reopened = await loadMain(writes.at(-1));
    assert.equal(reopened.handlers['get-settings']()[expected], true);
  }
});

test('edge settings reject invalid values without changing saved settings', async () => {
  const { handlers, failWrites } = await loadMain();
  const update = handlers['set-edge-settings'];
  assert.throws(() => update(null, { edgeDetection: 1 }), /boolean/);
  assert.throws(() => update(null, { edgeSensitivity: 0 }), /out of range/);
  assert.throws(() => update(null, { edgeSensitivity: 101 }), /out of range/);
  assert.throws(() => update(null, { edgeSensitivity: 1.5 }), /out of range/);
  assert.throws(() => update(null, { edgeSensitivity: 40, edgeDetection: true }), /one edge setting/);
  update(null, { edgeSensitivity: 1 });
  update(null, { edgeSensitivity: 100 });
  failWrites(new Error('disk full'));
  assert.throws(() => update(null, { edgeDetection: true }), /disk full/);
  assert.throws(() => handlers['adjust-filter'](null, 'edgeDetection'), /disk full/);
  assert.equal(handlers['get-settings']().edgeDetection, false);
  assert.equal(handlers['get-settings']().edgeSensitivity, 100);
});

test('capture pause handlers are no longer available', async () => {
  const { handlers } = await loadMain();
  assert.equal(handlers['toggle-freeze'], undefined);
  assert.equal(handlers['set-freeze-state'], undefined);
});

test('filter button failures do not update settings', async () => {
  const { handlers, failWrites } = await loadMain();
  assert.throws(() => handlers['adjust-filter'](null, 'unknown'), /Unknown filter action/);
  failWrites(new Error('disk full'));
  assert.throws(() => handlers['adjust-filter'](null, 'posterize'), /disk full/);
  assert.equal(handlers['get-settings']().posterize, true);
});

test('older shortcut settings are ignored without changing image adjustments', async () => {
  const { handlers } = await loadMain({ version: 6, shortcuts: { posterize: 'KeyP' }, levels: 4, brightness: 25 });
  const settings = handlers['get-settings']();
  assert.equal('shortcuts' in settings, false);
  assert.equal(settings.levels, 4);
  assert.equal(settings.brightness, 25);
});

test('out-of-range brightness from repeated legacy migrations is recovered and persisted', async () => {
  for (const [saved, expected] of [[1000000000, 10], [-250000, -25], [1234, 10]]) {
    const { handlers, writes } = await loadMain({ version: 9, brightness: saved, levels: 8, contrast: 1.43 });
    const settings = handlers['get-settings']();
    assert.equal(settings.brightness, expected);
    assert.equal(settings.levels, 8);
    assert.equal(settings.contrast, 1.43);
    assert.equal(writes.at(-1).brightness, expected);
    const reopened = await loadMain(writes.at(-1));
    assert.equal(reopened.handlers['get-settings']().brightness, expected);
  }
});

test('newer settings versions do not receive the legacy brightness conversion', async () => {
  const { handlers, writes } = await loadMain({ version: 10, brightness: 25 });
  assert.equal(handlers['get-settings']().brightness, 25);
  assert.equal(writes.length, 0);
});

test('unversioned legacy brightness is still converted to percent', async () => {
  const { handlers, writes } = await loadMain({ brightness: 0.25 });
  assert.equal(handlers['get-settings']().brightness, 25);
  assert.equal(writes.at(-1).brightness, 25);
});

test('quick filter buttons start visible even after they were hidden', async () => {
  const { handlers, writes } = await loadMain({ version: 6, levels: 4, showQuickFilterButtons: false });
  assert.equal(handlers['get-settings']().showQuickFilterButtons, true);
  handlers['set-quick-filter-buttons'](null, false);
  assert.equal(handlers['get-settings']().showQuickFilterButtons, false);
  handlers['set-warning-settings'](null, { darkThreshold: 10 });
  assert.equal('showQuickFilterButtons' in writes.at(-1), false);
  const reopened = await loadMain(writes.at(-1));
  assert.equal(reopened.handlers['get-settings']().showQuickFilterButtons, true);
  assert.equal(reopened.handlers['get-settings']().darkThreshold, 10);
  handlers['set-quick-filter-buttons'](null, true);
  assert.equal(handlers['get-settings']().showQuickFilterButtons, true);
});

test('invalid visibility updates leave the setting unchanged', async () => {
  const { handlers } = await loadMain();
  assert.throws(() => handlers['set-quick-filter-buttons'](null, 'false'), /boolean/);
  assert.equal(handlers['get-settings']().showQuickFilterButtons, true);
});

test('value warnings default off and persist independent thresholds', async () => {
  const { handlers, writes } = await loadMain({ version: 6, levels: 4 });
  assert.equal(handlers['get-settings']().valueWarnings, false);
  assert.equal(handlers['get-settings']().darkThreshold, 2);
  assert.equal(handlers['get-settings']().lightThreshold, 97);
  handlers['set-warning-settings'](null, { valueWarnings: true });
  handlers['set-warning-settings'](null, { darkThreshold: 10 });
  handlers['set-warning-settings'](null, { lightThreshold: 90 });
  const reopened = await loadMain(writes.at(-1));
  const settings = reopened.handlers['get-settings']();
  assert.equal(settings.valueWarnings, true);
  assert.equal(settings.darkThreshold, 10);
  assert.equal(settings.lightThreshold, 90);
});

test('invalid or failed warning updates do not change settings', async () => {
  const { handlers, failWrites } = await loadMain();
  const update = handlers['set-warning-settings'];
  assert.throws(() => update(null, { valueWarnings: 1 }), /boolean/);
  assert.throws(() => update(null, { darkThreshold: 50 }), /out of range/);
  assert.throws(() => update(null, { darkThreshold: 0 }), /out of range/);
  assert.throws(() => update(null, { lightThreshold: 50 }), /out of range/);
  assert.throws(() => update(null, { lightThreshold: 100 }), /out of range/);
  assert.throws(() => update(null, { darkThreshold: 1.5 }), /out of range/);
  assert.throws(() => update(null, { levels: 3 }), /Unknown/);
  assert.throws(() => update(null, { darkThreshold: 0, lightThreshold: 100 }), /one/);
  failWrites(new Error('disk full'));
  assert.throws(() => update(null, { valueWarnings: true }), /disk full/);
  assert.equal(handlers['get-settings']().valueWarnings, false);
  assert.equal(handlers['get-settings']().darkThreshold, 2);
  assert.equal(handlers['get-settings']().lightThreshold, 97);
});

test('warning endpoints migrate to the supported range and persist', async () => {
  const { handlers, writes } = await loadMain({ version: 6, darkThreshold: 0, lightThreshold: 100 });
  assert.equal(handlers['get-settings']().darkThreshold, 1);
  assert.equal(handlers['get-settings']().lightThreshold, 99);
  handlers['set-warning-settings'](null, { darkThreshold: 1 });
  const reopened = await loadMain(writes.at(-1));
  assert.equal(reopened.handlers['get-settings']().darkThreshold, 1);
  assert.equal(reopened.handlers['get-settings']().lightThreshold, 99);
});

test('grayscale stays enabled while saturation warnings and adjustments persist', async () => {
  const { handlers, listeners, writes } = await loadMain({ version: 6, grayscale: false, levels: 4, brightness: 25, contrast: 2 });
  let settings = handlers['get-settings']();
  assert.equal('grayscale' in settings, false);
  assert.equal(settings.saturationWarnings, false);
  assert.equal(settings.saturationThreshold, 85);
  assert.equal(settings.saturationBrightnessThreshold, 10);
  assert.throws(() => handlers['adjust-filter'](null, 'grayscale'), /Unknown filter action/);
  listeners['set-settings'](null, { grayscale: false });
  assert.equal('grayscale' in handlers['get-settings'](), false);
  handlers['adjust-filter'](null, 'valueWarnings');
  handlers['adjust-filter'](null, 'saturationWarnings');
  handlers['set-warning-settings'](null, { saturationThreshold: 65 });
  handlers['set-warning-settings'](null, { saturationBrightnessThreshold: 45 });
  const reopened = await loadMain(writes.at(-1));
  settings = reopened.handlers['get-settings']();
  assert.equal('grayscale' in settings, false);
  assert.equal(settings.valueWarnings, false);
  assert.equal(settings.saturationWarnings, true);
  assert.equal(settings.saturationThreshold, 65);
  assert.equal(settings.saturationBrightnessThreshold, 45);
  assert.equal(settings.levels, 4);
  assert.equal(settings.brightness, 25);
  assert.equal(settings.contrast, 2);
  assert.throws(() => reopened.handlers['adjust-filter'](null, 'grayscale'), /Unknown filter action/);
});

test('saved warning thresholds are preserved when defaults change', async () => {
  const { handlers } = await loadMain({ version: 6, darkThreshold: 5, lightThreshold: 95, saturationThreshold: 90, saturationBrightnessThreshold: 20 });
  assert.equal(handlers['get-settings']().darkThreshold, 5);
  assert.equal(handlers['get-settings']().lightThreshold, 95);
  assert.equal(handlers['get-settings']().saturationThreshold, 90);
  assert.equal(handlers['get-settings']().saturationBrightnessThreshold, 20);
});

test('saturation warning settings reject invalid values and failed writes', async () => {
  const { handlers, failWrites } = await loadMain();
  const update = handlers['set-warning-settings'];
  assert.throws(() => update(null, { saturationWarnings: 'true' }), /boolean/);
  assert.throws(() => update(null, { saturationThreshold: -1 }), /out of range/);
  assert.throws(() => update(null, { saturationThreshold: 101 }), /out of range/);
  assert.throws(() => update(null, { saturationThreshold: 1.5 }), /out of range/);
  assert.throws(() => update(null, { saturationBrightnessThreshold: -1 }), /out of range/);
  assert.throws(() => update(null, { saturationBrightnessThreshold: 101 }), /out of range/);
  assert.throws(() => update(null, { saturationBrightnessThreshold: 1.5 }), /out of range/);
  update(null, { saturationThreshold: 0 });
  update(null, { saturationThreshold: 100 });
  update(null, { saturationBrightnessThreshold: 0 });
  update(null, { saturationBrightnessThreshold: 100 });
  failWrites(new Error('disk full'));
  assert.throws(() => update(null, { saturationWarnings: true }), /disk full/);
  assert.equal(handlers['get-settings']().saturationWarnings, false);
  assert.equal('grayscale' in handlers['get-settings'](), false);
  assert.equal(handlers['get-settings']().saturationThreshold, 100);
  assert.equal(handlers['get-settings']().saturationBrightnessThreshold, 100);
});
