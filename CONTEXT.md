# ValueScale: Working Context

## App shape

Small Electron app with no frontend framework. `index.html` is the renderer and contains its CSS, WebGL shaders, and rendering/interaction code.

- `main.js`: creates the frameless always-on-top window, selects application-window capture sources, persists settings, constrains the window to the selected crop's aspect ratio, and handles window actions.
- `preload.js`: exposes the narrow `window.api` IPC bridge used by renderer pages.
- `index.html`: displays the captured source, applies crop and grayscale/posterization, and handles move, resize, hover controls, and crop selection.
- `panel.html`: settings panel for gray values, brightness, contrast, and the posterize toggle; source selection and crop controls live under a closed-by-default “Window options” disclosure.
- `Run ValueScale.bat`: launches the most recently built `dist\ValueScale_<version>.exe`; building the standalone Windows x64 executable requires `npm run dist:portable`.
- `README.md`: user-facing run instructions and controls.
- App version is `1.2.2` in `package.json` and `package-lock.json`; portable artifacts are named `ValueScale_${version}.exe`. For each subsequent code change, increment the patch version with `npm version patch --no-git-tag-version` and keep the README example current.

## Renderer behavior and invariants

- Capture is window-only. `captureWindowName` is persisted; window IDs are session-specific and are resolved again by name after restart. Legacy display-mode settings are normalized to window mode on startup.
- Window capture includes only the selected app window; displays and separate floating windows are not part of the image.
- `desktopCapturer` window-source IDs ending in `:1` belong to this Electron process and are excluded from the selectable list to prevent self-capture.
- The source crop is normalized (`x`, `y`, `w`, `h`) and persisted in `settings.crop`. On Windows, selecting a crop hides the projection and dims the actual display; drag selection is limited to the captured window's visible bounds and normalized to that window. Other platforms use a live preview fallback.
- `fitViewport()` preserves the cropped source aspect ratio. The renderer reports that ratio to the main process, which fits the native projection window to it and keeps the window within the active display's work area.
- `main.js` uses `BrowserWindow.setAspectRatio()` and adjusts bounds when moving to another display. Keep renderer scaling and native window ratio consistent.
- The renderer gets settings through `window.api.getSettings()` and `onSettings()`. Changes go through `setSettings()`; filter reset values come from `FILTER_DEFAULTS` in `main.js` and preserve the selected source/crop. Source selection also emits `capture-target-changed` so even same-titled windows restart capture.
- If no application window is selected or the saved source cannot be found, the renderer displays a centered button labeled “Choose a window to capture”; it opens the window options expanded.
- Current image defaults: `levels: 6`, `brightness: 10`, `contrast: 1.43`, `posterize: true`. The panel displays brightness and contrast as centered adjustments from those neutral defaults, both initially `0`. `levels` is total output shades (black and white included); `panel.html` displays `levels - 2` intermediate gray values.
- The shader computes raw grayscale separately from adjusted grayscale. Brightness/contrast affect only the posterized path; when posterization is off, output raw grayscale.
- `getDisplayMedia()` sets `video.cursor` to `never`, so window capture excludes the pointer.
- Main-window controls call minimize, toggle-maximize, and quit through `window.api`. Preserve the existing manual drag behavior and right-click settings-panel shortcut.
- The controls panel starts compact and resizes via `resize-panel` IPC when “Window options” expands/collapses.
- Settings are persisted in Electron user data with `SETTINGS_VERSION` (currently 6) in `main.js`; bump/migrate it when changing stored setting formats.

## Useful checks

- Development launch: `npm start`
- Build Windows portable executable: `npm run dist:portable`
- Launch packaged app: run the current `dist\ValueScale_<version>.exe` or double-click `Run ValueScale.bat`.
- Syntax: `node --check main.js` and `node --check preload.js`.
- Renderer scripts are inline in the HTML, so extract them for JavaScript syntax checks; they require browser globals and `window.api` to run.
- No test script or frontend framework is configured in `package.json`.
- Display capture is intentionally unavailable; `getWindowSources()` excludes this Electron process's own window from selectable sources.
