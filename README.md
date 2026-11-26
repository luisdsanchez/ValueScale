# ValueScale

A frameless, always-on-top projection window. It captures a selected application
window and scales the image to fit the projection window as a grayscale, optionally posterized view.
Window and filter controls appear when hovering over the projection.

## Portable Windows app

Download the portable executable from [GitHub Releases](https://github.com/luisdsanchez/ValueScale/releases).

Build the single-file portable Windows x64 executable on a Windows x64 build machine:

    npm install
    npm run dist:portable

The output is `dist\ValueScale_1.2.5.exe`. Copy that file to a Windows 10 or later x64 computer and run it; Node.js, npm, and a separate app installation are not required on the target computer. The portable `.exe` is Windows-only and is not compatible with macOS, Linux, or Windows ARM devices. Windows 7, 8, and 8.1 are not supported by this Electron version.

For development, run `npm start` after installing dependencies.

## Controls

- Left-drag: move the window
- Drag the window edges: resize while preserving the display's aspect ratio
- Hover over the projection to reveal the settings and window controls above a column of posterize, gray-value and warning controls on the right. Use the arrow below the column to collapse or expand it; the column starts open each time the app launches. Scroll the column if the projection is too short to show all controls. The count excludes black and white; **V!** toggles value warnings and **S!** toggles saturation warnings.
- When no capture window is selected, use the centered **Choose a window to capture** button to open the window picker. Selecting a window starts capture immediately. Open the controls panel with the settings icon; it is centered over the projection when screen space permits. Drag the handle at the top to move it. Settings are grouped by function; the scroll hint indicates when more settings are below. **Window options** contains the window picker and capture area controls; the panel closes when you click away or press Esc.
- In the controls panel, choose an application window and select **Select capture area**. On Windows, the projection hides, the selected application window is brought forward, and the actual desktop dims; drag directly over that window to choose an area. On other platforms, the selector uses a live preview of that window. Press Esc to cancel or Reset capture area to restore it. The projection window adjusts to the capture area's aspect ratio to avoid black bars; a maximized window restores to a fitted size. Window capture excludes other floating windows.
- The projection is always grayscale. Toggle Posterize to switch between posterized and plain grayscale; brightness and contrast only affect the posterized image.
- Enable **Show value warnings** to mark dark areas in blue and light areas in orange, with a faint color wash and stronger stripes. The adjustable thresholds default to 2% and 97%; the 1% dark minimum includes pure black, and the 99% light maximum starts at `#FDFDFD` for neutral grays. At 98%, the light warning starts at `#FAFAFA`. They use the original captured values, independent of posterization, brightness, and contrast. Warnings appear only in the projection and do not alter the drawing.
- Use **S!** to show the saturation gradient, based on the captured color independently of the grayscale projection. By default it applies to colors above 10% HSV brightness (the highest RGB channel). Both warning types can be used together and overlap where both apply.
- The captured projection does not include the mouse pointer.

Defaults: 4 gray values (6 total shades including black and white), with brightness
and contrast adjustments both at 0. These neutral adjustments preserve the existing
10% brightness and 1.43x contrast image settings. Settings persist between launches.

## Notes

- Display capture is not available; only application windows can be selected.
- ValueScale's own windows are excluded from the selectable capture sources.
- macOS: grant Screen Recording permission to Electron on first launch, then restart.
- Moving the projection to another monitor does not change the selected capture window.
