const { app, BrowserWindow, ipcMain, screen, desktopCapturer, session } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const autoUpdater = require('./auto-updater');

const FULL_CROP = { x: 0, y: 0, w: 1, h: 1 };
const PANEL_WIDTH = 320;
const PANEL_COLLAPSED_HEIGHT = 450;
const PANEL_EXPANDED_HEIGHT = 450;
const FILTER_DEFAULTS = { levels: 6, brightness: 10, contrast: 1.43, posterize: true };
const CHECKS = ['edgeDetection', 'warmCool', 'saturationWarnings', 'valueWarnings', 'posterize'];
function withExclusiveChecks(current, patch) {
  const next = { ...current, ...patch };
  const selected = CHECKS.find((key) => patch[key] === true);
  if (selected) {
    for (const key of CHECKS) next[key] = key === selected;
  }
  return next;
}
app.setName('ValueScale');
const DEFAULTS = {
  ...FILTER_DEFAULTS,
  captureType: 'window',
  captureWindowName: '',
  crop: FULL_CROP,
  showQuickFilterButtons: true,
  valueWarnings: false,
  darkThreshold: 2,
  lightThreshold: 97,
  edgeDetection: false,
  edgeSensitivity: 55,
  warmCool: false,
  saturationWarnings: false,
  saturationThreshold: 85,
  saturationBrightnessThreshold: 10,
};
const SETTINGS_VERSION = 9;
let settings = { ...DEFAULTS };
let windowState = null;
let windowStateSaveTimer = null;

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const iconFile = path.join(__dirname, 'assets', 'valuescale-icon.ico');
function validateWindowState(value) {
  const bounds = value && value.bounds;
  if (!bounds || ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)
    || bounds.width < 120 || bounds.height < 1 || typeof value.maximized !== 'boolean') return null;
  return {
    bounds: {
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
    },
    maximized: value.maximized,
  };
}

function loadSettings() {
  try {
    const saved = JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
    const { version, windowState: savedWindowState, ...savedSettings } = saved;
    delete savedSettings.shortcuts;
    delete savedSettings.grayscale;
    delete savedSettings.showQuickFilterButtons;
    Object.assign(savedSettings, withExclusiveChecks({}, savedSettings));
    if (savedSettings.darkThreshold === 0) savedSettings.darkThreshold = 1;
    if (savedSettings.lightThreshold === 100) savedSettings.lightThreshold = 99;
    windowState = validateWindowState(savedWindowState);
    if (version === SETTINGS_VERSION) {
      settings = { ...DEFAULTS, ...savedSettings };
      return;
    }

    if (version === 8 || version === 7 || version === 6 || version === 5 || version === 4) {
      settings = { ...DEFAULTS, ...savedSettings };
      saveSettings();
      return;
    }

    if (version === 3) {
      settings = { ...DEFAULTS, ...savedSettings };
      saveSettings();
      return;
    }

    if (version === 2) {
      const oldDefault = savedSettings.levels === 4
        && savedSettings.brightness === 10
        && savedSettings.contrast === 1;
      settings = oldDefault
        ? { ...DEFAULTS }
        : { ...DEFAULTS, ...savedSettings };
      saveSettings();
      return;
    }

    const oldDefault = savedSettings.levels === 4
      && savedSettings.brightness === 0
      && savedSettings.contrast === 1;
    settings = {
      ...DEFAULTS,
      ...savedSettings,
      brightness: oldDefault
        ? DEFAULTS.brightness
        : Number.isFinite(savedSettings.brightness)
          ? Math.round(savedSettings.brightness * 100)
          : DEFAULTS.brightness,
    };
    saveSettings();
  } catch {}
}
function writeSettings(nextSettings) {
  const persistentSettings = { ...nextSettings };
  delete persistentSettings.showQuickFilterButtons;
  fs.writeFileSync(settingsFile(), JSON.stringify({
    ...persistentSettings,
    windowState,
    version: SETTINGS_VERSION,
  }));
}
function saveSettings() {
  try { writeSettings(settings); } catch {}
}

let win = null;
let panel = null;
let cropSelector = null;
let cropSelectionBounds = null;
let drag = null;
let windowDisplayId = null;
let captureWindowId = null;
let projectionAspectRatio = null;

function getInitialWindowBounds() {
  const savedBounds = windowState && windowState.bounds;
  const display = savedBounds ? screen.getDisplayMatching(savedBounds) : screen.getPrimaryDisplay();
  const area = display.workArea;
  const aspectRatio = display.bounds.width / display.bounds.height;
  let width = savedBounds ? Math.min(Math.max(savedBounds.width, 120), area.width) : Math.min(480, area.width);
  let height = Math.round(width / aspectRatio);
  if (height > area.height) {
    height = area.height;
    width = Math.round(height * aspectRatio);
  }
  const x = savedBounds
    ? Math.min(Math.max(savedBounds.x, area.x), area.x + area.width - width)
    : undefined;
  const y = savedBounds
    ? Math.min(Math.max(savedBounds.y, area.y), area.y + area.height - height)
    : undefined;
  return { x, y, width, height, aspectRatio, display };
}

function captureWindowState() {
  if (!win || win.isDestroyed()) return;
  const maximized = win.isMaximized();
  const bounds = maximized ? win.getNormalBounds() : win.getBounds();
  windowState = {
    bounds: {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    },
    maximized,
  };
}

function scheduleWindowStateSave() {
  if (!win || win.isDestroyed()) return;
  captureWindowState();
  if (windowStateSaveTimer) clearTimeout(windowStateSaveTimer);
  windowStateSaveTimer = setTimeout(() => {
    windowStateSaveTimer = null;
    saveSettings();
  }, 250);
}

function flushWindowStateSave() {
  if (windowStateSaveTimer) {
    clearTimeout(windowStateSaveTimer);
    windowStateSaveTimer = null;
  }
  captureWindowState();
  saveSettings();
}

async function getWindowSources() {
  const sources = await desktopCapturer.getSources({
    types: ['window'],
    thumbnailSize: { width: 0, height: 0 },
  });
  return sources.filter((source) => source.name && !source.id.endsWith(':1'));
}

function getNativeWindowBounds(sourceId) {
  const match = /^window:(0x[0-9a-f]+|\d+):/i.exec(sourceId);
  if (!match) return Promise.reject(new Error('Could not identify the selected application window.'));

  const handle = Number(match[1]);
  const script = `
$source = @'
using System;
using System.Runtime.InteropServices;
public static class CaptureWindowBounds {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
  [DllImport("user32.dll")]
  public static extern bool IsIconic(IntPtr hwnd);
  [DllImport("user32.dll")]
  public static extern bool IsWindowVisible(IntPtr hwnd);
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hwnd, int command);
  [DllImport("user32.dll")]
  public static extern bool BringWindowToTop(IntPtr hwnd);
  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hwnd);
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("dwmapi.dll", PreserveSig = true)]
  public static extern int DwmGetWindowAttribute(IntPtr hwnd, int attribute, out RECT rect, int size);
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
}
'@
Add-Type -TypeDefinition $source
$target = [IntPtr]${handle}
if ([CaptureWindowBounds]::IsIconic($target)) {
  [CaptureWindowBounds]::ShowWindow($target, 9) | Out-Null
} elseif (-not [CaptureWindowBounds]::IsWindowVisible($target)) {
  [CaptureWindowBounds]::ShowWindow($target, 5) | Out-Null
}
[CaptureWindowBounds]::BringWindowToTop($target) | Out-Null
[CaptureWindowBounds]::SetForegroundWindow($target) | Out-Null
Start-Sleep -Milliseconds 100
$foreground = [CaptureWindowBounds]::GetForegroundWindow()
if ($foreground.ToInt64() -ne $target.ToInt64()) { exit 2 }
$rect = New-Object CaptureWindowBounds+RECT
$result = [CaptureWindowBounds]::DwmGetWindowAttribute($target, 9, [ref]$rect, 16)
if ($result -ne 0) {
  $success = [CaptureWindowBounds]::GetWindowRect($target, [ref]$rect)
  if (-not $success) { exit 1 }
}
if ($rect.Right -le $rect.Left -or $rect.Bottom -le $rect.Top) { exit 1 }
Write-Output "$($rect.Left),$($rect.Top),$($rect.Right),$($rect.Bottom)"
`;

  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
      windowsHide: true,
      timeout: 5000,
      encoding: 'utf8',
    }, (error, stdout, stderr) => {
      if (error) {
        if (error.code === 2) {
          reject(new Error('Could not bring the selected window to the foreground. Restore it and try again.'));
          return;
        }
        reject(new Error(`Could not read the selected window bounds: ${stderr.trim() || error.message}`));
        return;
      }
      const bounds = stdout.trim().split(',').map(Number);
      if (bounds.length !== 4 || !bounds.every(Number.isFinite)
        || bounds[2] <= bounds[0] || bounds[3] <= bounds[1]) {
        reject(new Error('The selected application window has invalid bounds.'));
        return;
      }
      resolve({
        x: bounds[0],
        y: bounds[1],
        width: bounds[2] - bounds[0],
        height: bounds[3] - bounds[1],
      });
    });
  });
}

function sendSettings() {
  if (win && !win.isDestroyed()) win.webContents.send('settings', settings);
  if (panel && !panel.isDestroyed()) panel.webContents.send('settings', settings);
}

function fitWindowToAspectRatio(ratio, display, bounds = win.getBounds()) {
  const area = display.workArea;
  const minWidth = Math.max(1, Math.min(120, area.width, Math.floor(area.height * ratio)));
  win.setAspectRatio(ratio);
  win.setMinimumSize(minWidth, Math.max(1, Math.floor(minWidth / ratio)));
  if (win.isMaximized()) {
    if (Math.abs(bounds.width / bounds.height - ratio) < 0.001) return;
    win.unmaximize();
  }

  let width = Math.min(bounds.width, area.width);
  let height = Math.round(width / ratio);
  if (height > area.height) {
    height = area.height;
    width = Math.round(height * ratio);
  }
  const x = Math.min(
    Math.max(Math.round(bounds.x + (bounds.width - width) / 2), area.x),
    area.x + area.width - width
  );
  const y = Math.min(
    Math.max(Math.round(bounds.y + (bounds.height - height) / 2), area.y),
    area.y + area.height - height
  );
  if (width !== bounds.width || height !== bounds.height || x !== bounds.x || y !== bounds.y) {
    win.setBounds({ x, y, width, height });
  }
}

function sendBounds() {
  if (!win || win.isDestroyed()) return;
  let b = win.getBounds();
  const d = screen.getDisplayMatching(b);
  if (d.id !== windowDisplayId) {
    windowDisplayId = d.id;
    const ratio = projectionAspectRatio || d.bounds.width / d.bounds.height;
    fitWindowToAspectRatio(ratio, d, b);
    b = win.getBounds();
  }
  scheduleWindowStateSave();
}

function pinOnTop(w, protectFromCapture) {
  w.setAlwaysOnTop(true, 'screen-saver');
  w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  w.setContentProtection(protectFromCapture);
}

function createMain() {
  const initialBounds = getInitialWindowBounds();
  const { display, aspectRatio, x, y, width, height } = initialBounds;
  windowDisplayId = display.id;
  win = new BrowserWindow({
    x,
    y,
    width,
    height,
    icon: iconFile,
    minWidth: 120,
    minHeight: Math.max(1, Math.round(120 / aspectRatio)),
    frame: false,
    hasShadow: false,
    backgroundColor: '#000000',
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  win.setAspectRatio(aspectRatio);
  pinOnTop(win, false);
  win.loadFile(path.join(__dirname, 'index.html'));
  win.webContents.on('did-finish-load', sendBounds);
  win.on('move', sendBounds);
  win.on('resize', sendBounds);
  win.on('maximize', scheduleWindowStateSave);
  win.on('unmaximize', scheduleWindowStateSave);
  win.on('close', flushWindowStateSave);
  win.on('closed', () => { win = null; app.quit(); });
  if (windowState && windowState.maximized) win.maximize();
}

function getPanelBounds(requestedHeight, currentBounds = null) {
  const projection = win.getBounds();
  const area = screen.getDisplayMatching(currentBounds || projection).workArea;
  const width = Math.min(PANEL_WIDTH, area.width);
  const height = Math.min(requestedHeight, area.height);
  const desiredX = currentBounds ? currentBounds.x : Math.round(projection.x + (projection.width - width) / 2);
  const desiredY = currentBounds ? currentBounds.y : Math.round(projection.y + (projection.height - height) / 2);
  const x = Math.min(Math.max(desiredX, area.x), area.x + area.width - width);
  const y = Math.min(Math.max(desiredY, area.y), area.y + area.height - height);
  return { x, y, width, height };
}

function openPanel(expandWindowOptions = false) {
  if (!win || win.isDestroyed()) {
    console.error('Cannot open settings: the projection window is unavailable.');
    return;
  }
  if (panel && !panel.isDestroyed()) {
    const bounds = panel.getBounds();
    panel.setBounds(getPanelBounds(bounds.height, bounds));
    if (expandWindowOptions) panel.webContents.send('open-window-options');
    panel.focus();
    return;
  }
  panel = new BrowserWindow({
    ...getPanelBounds(PANEL_COLLAPSED_HEIGHT),
    icon: iconFile,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  pinOnTop(panel, true);
  panel.loadFile(path.join(__dirname, 'panel.html'));
  if (expandWindowOptions) {
    panel.webContents.once('did-finish-load', () => {
      if (panel && !panel.isDestroyed()) panel.webContents.send('open-window-options');
    });
  }
  panel.on('blur', () => { if (panel && !panel.isDestroyed()) panel.close(); });
  panel.on('closed', () => { panel = null; });
}

app.whenReady().then(() => {
  loadSettings();
  if (settings.captureType !== 'window') {
    settings = { ...settings, captureType: 'window' };
    saveSettings();
  }

  session.defaultSession.setDisplayMediaRequestHandler(async (_req, callback) => {
    try {
      const sources = await getWindowSources();
      const source = sources.find((s) => s.id === captureWindowId)
        || sources.find((s) => s.name === settings.captureWindowName);
      if (!source) {
        console.error(`Capture source not found: ${settings.captureWindowName}`);
        callback({});
        return;
      }
      captureWindowId = source.id;
      callback({ video: source });
    } catch (error) {
      console.error('Failed to find a capture source:', error);
      callback({});
    }
  }, { useSystemPicker: false });

  createMain();

  // Setup auto-updater
  autoUpdater.setupIpcHandlers();
  autoUpdater.startPeriodicCheck(win);

  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('get-settings', () => settings);
  ipcMain.handle('set-warning-settings', (_e, patch) => {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new Error('Invalid warning settings.');
    }
    const keys = Object.keys(patch);
    if (keys.length !== 1) throw new Error('Update one warning setting at a time.');
    const key = keys[0];
    const value = patch[key];
    if (key === 'valueWarnings' || key === 'saturationWarnings') {
      if (typeof value !== 'boolean') throw new Error('Warning visibility must be a boolean.');
    } else if (key === 'darkThreshold' || key === 'lightThreshold'
      || key === 'saturationThreshold' || key === 'saturationBrightnessThreshold') {
      const min = key === 'lightThreshold' ? 51 : key === 'darkThreshold' ? 1 : 0;
      const max = key === 'darkThreshold' ? 49 : key === 'lightThreshold' ? 99 : 100;
      if (!Number.isInteger(value) || value < min || value > max) {
        throw new Error('Warning threshold is out of range.');
      }
    } else {
      throw new Error('Unknown warning setting.');
    }
    const nextSettings = withExclusiveChecks(settings, { [key]: value });
    writeSettings(nextSettings);
    settings = nextSettings;
    sendSettings();
    return settings;
  });
  ipcMain.handle('set-edge-settings', (_e, patch) => {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new Error('Invalid edge settings.');
    }
    const keys = Object.keys(patch);
    if (keys.length !== 1) throw new Error('Update one edge setting at a time.');
    const key = keys[0];
    const value = patch[key];
    if (key === 'edgeDetection') {
      if (typeof value !== 'boolean') throw new Error('Edge detection visibility must be a boolean.');
    } else if (key === 'edgeSensitivity') {
      if (!Number.isInteger(value) || value < 1 || value > 100) {
        throw new Error('Edge sensitivity is out of range.');
      }
    } else {
      throw new Error('Unknown edge setting.');
    }
    const nextSettings = withExclusiveChecks(settings, { [key]: value });
    writeSettings(nextSettings);
    settings = nextSettings;
    sendSettings();
    return settings;
  });
  ipcMain.handle('set-quick-filter-buttons', (_e, visible) => {
    if (typeof visible !== 'boolean') throw new Error('Quick filter button visibility must be a boolean.');
    settings = { ...settings, showQuickFilterButtons: visible };
    sendSettings();
    return visible;
  });
  ipcMain.handle('adjust-filter', (_e, action) => {
    const patch = {
      posterize: () => ({ posterize: !settings.posterize }),
      valueWarnings: () => ({ valueWarnings: !settings.valueWarnings }),
      saturationWarnings: () => ({ saturationWarnings: !settings.saturationWarnings }),
      edgeDetection: () => ({ edgeDetection: !settings.edgeDetection }),
      warmCool: () => ({ warmCool: !settings.warmCool }),
      fewer: () => ({ levels: Math.max(2, settings.levels - 1) }),
      more: () => ({ levels: Math.min(10, settings.levels + 1) }),
    }[action];
    if (!patch) throw new Error('Unknown filter action.');
    const nextSettings = withExclusiveChecks(settings, patch());
    writeSettings(nextSettings);
    settings = nextSettings;
    sendSettings();
  });
  ipcMain.handle('list-capture-windows', async () => {
    const sources = await getWindowSources();
    return sources.map(({ id, name }) => ({ id, name }));
  });
  ipcMain.handle('select-capture-target', async (_e, target) => {
    if (!target || target.type !== 'window' || typeof target.id !== 'string') {
      throw new Error('Choose an available application window.');
    }
    const source = (await getWindowSources()).find((item) => item.id === target.id);
    if (!source) throw new Error('That window is no longer available. Refresh the list and try again.');
    captureWindowId = source.id;
    settings = {
      ...settings,
      captureType: 'window',
      captureWindowName: source.name,
      crop: { ...FULL_CROP },
    };
    saveSettings();
    sendSettings();
    if (win && !win.isDestroyed()) win.webContents.send('capture-target-changed');
    return settings;
  });
  ipcMain.handle('set-crop', (_e, crop) => {
    const values = crop && [crop.x, crop.y, crop.w, crop.h];
    if (!values || !values.every(Number.isFinite)
      || crop.x < 0 || crop.y < 0 || crop.x >= 1 || crop.y >= 1
      || crop.w <= 0 || crop.h <= 0
      || crop.x + crop.w > 1 + 1e-6 || crop.y + crop.h > 1 + 1e-6) {
      throw new Error('The selected area is invalid.');
    }
    settings = {
      ...settings,
      crop: {
        x: crop.x,
        y: crop.y,
        w: Math.min(crop.w, 1 - crop.x),
        h: Math.min(crop.h, 1 - crop.y),
      },
    };
    saveSettings();
    sendSettings();
    return settings;
  });
  ipcMain.handle('set-projection-aspect-ratio', (_e, ratio) => {
    if (!Number.isFinite(ratio) || ratio <= 0) {
      throw new Error('The cropped source aspect ratio is invalid.');
    }
    if (!win || win.isDestroyed()) throw new Error('The projection window is unavailable.');
    projectionAspectRatio = ratio;
    fitWindowToAspectRatio(ratio, screen.getDisplayMatching(win.getBounds()));
    return ratio;
  });
  ipcMain.handle('start-crop-selection', async () => {
    if (!win || win.isDestroyed()) throw new Error('The projection window is unavailable.');
    if (!settings.captureWindowName) throw new Error('Choose an application window before selecting a capture area.');
    if (cropSelector && !cropSelector.isDestroyed()) {
      cropSelector.focus();
      return;
    }

    const display = screen.getDisplayMatching(win.getBounds());
    cropSelectionBounds = null;
    if (process.platform === 'win32') {
      const sources = await getWindowSources();
      const source = sources.find((item) => item.id === captureWindowId)
        || sources.find((item) => item.name === settings.captureWindowName);
      if (!source) throw new Error('The selected application window is no longer available.');
      captureWindowId = source.id;
      const nativeBounds = await getNativeWindowBounds(source.id);
      const bounds = screen.screenToDipRect(null, nativeBounds);
      const targetDisplay = screen.getDisplayMatching(bounds);
      cropSelectionBounds = {
        ...bounds,
        x: bounds.x - targetDisplay.bounds.x,
        y: bounds.y - targetDisplay.bounds.y,
      };
      openCropSelector(targetDisplay);
      return;
    }

    openCropSelector(display);
  });
  function openCropSelector(display) {
    win.hide();
    cropSelector = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      fullscreen: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
      },
    });
    const selector = cropSelector;
    pinOnTop(selector, true);
    selector.webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown' || input.key !== 'Escape') return;
      event.preventDefault();
      selector.close();
    });
    selector.loadFile(path.join(__dirname, 'crop-selection.html'));
    selector.once('ready-to-show', () => {
      if (cropSelector === selector && !selector.isDestroyed()) {
        selector.show();
        selector.focus();
      }
    });
    selector.on('closed', () => {
      if (cropSelector !== selector) return;
      cropSelector = null;
      cropSelectionBounds = null;
      if (win && !win.isDestroyed()) {
        win.show();
        win.focus();
      }
    });
  }
  ipcMain.handle('get-crop-selection-bounds', () => cropSelectionBounds);
  ipcMain.handle('finish-crop-selection', () => {
    if (cropSelector && !cropSelector.isDestroyed()) cropSelector.close();
  });
  ipcMain.on('set-settings', (_e, patch) => {
    settings = withExclusiveChecks(settings, patch);
    delete settings.grayscale;
    saveSettings();
    sendSettings();
  });
  ipcMain.on('drag-start', (_e, p) => { drag = { sx: p.x, sy: p.y, b: win.getBounds() }; });
  ipcMain.on('drag-move', (_e, p) => {
    if (!drag || !win) return;
    win.setBounds({
      x: Math.round(drag.b.x + p.x - drag.sx),
      y: Math.round(drag.b.y + p.y - drag.sy),
      width: drag.b.width,
      height: drag.b.height,
    });
  });
  ipcMain.on('drag-end', () => { drag = null; });

  ipcMain.on('open-panel', (_e, expandWindowOptions) => openPanel(Boolean(expandWindowOptions)));
  ipcMain.on('resize-panel', (_e, expanded) => {
    if (!panel || panel.isDestroyed() || !win || win.isDestroyed()) return;
    const requestedHeight = expanded ? PANEL_EXPANDED_HEIGHT : PANEL_COLLAPSED_HEIGHT;
    panel.setBounds(getPanelBounds(requestedHeight, panel.getBounds()));
  });
  ipcMain.on('window-minimize', () => {
    if (win && !win.isDestroyed()) win.minimize();
  });
  ipcMain.on('window-toggle-maximize', () => {
    if (!win || win.isDestroyed()) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on('quit', () => app.quit());
});

app.on('window-all-closed', () => {
  autoUpdater.stopPeriodicCheck();
  app.quit();
});
