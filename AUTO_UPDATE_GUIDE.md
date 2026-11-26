# ValueScale Auto-Update Feature

## Overview

ValueScale now includes an automatic update feature that checks for new releases every time the user opens the application. This feature:

- **Checks for updates on startup** - Automatically checks GitHub for the latest release
- **Runs periodic checks** - Checks for updates every 1 hour while the app is running
- **Non-blocking notifications** - Shows an unobtrusive notification when an update is available
- **Background downloads** - Downloads the update silently in the background
- **Easy installation** - Users can install updates with a single click

## How It Works

### Auto-Update Flow

1. **On App Startup**
   - When ValueScale opens, the auto-updater immediately checks the GitHub API for the latest release
   - The check compares the current version (`package.json`) with the latest release version

2. **Periodic Checks**
   - After the initial check, the app checks for updates every 1 hour (configurable)
   - This continues while the app is running in the background

3. **Update Available**
   - If a newer version is found, a notification appears showing the new version number
   - The notification provides two options: "Install Now" or "Later"

4. **Background Download**
   - The update starts downloading automatically in the background
   - Users can continue using the app while the download completes

5. **Installation**
   - Once downloaded, clicking "Install Now" launches the installer
   - The app automatically restarts with the new version

### File Structure

```
ValueScale-github/
├── auto-updater.js          # Main auto-updater module
├── main.js                  # Modified to integrate auto-updater
├── preload.js               # Modified to expose update APIs
├── index.html               # Modified with update notification UI
└── package.json             # Added semver dependency
```

## Implementation Details

### Auto-Updater Module (`auto-updater.js`)

The `auto-updater.js` module provides the following key functions:

#### Core Functions

- **`getLatestReleaseFromGitHub()`** - Fetches the latest release from GitHub API
  - Uses the official GitHub API: `https://api.github.com/repos/luisdsanchez/ValueScale/releases/latest`
  - Extracts version, download URL, and release notes

- **`compareVersions(latestVersion, currentVersion)`** - Uses semver to safely compare versions
  - Returns `true` if an update is available

- **`downloadUpdate(downloadUrl)`** - Downloads the installer to temp directory
  - Handles HTTP redirects
  - Saves to `%TEMP%/ValueScale-update.exe`

- **`checkForUpdates()`** - Main check function
  - Fetches latest release
  - Compares versions
  - Downloads update if available
  - Sends notifications to renderer process

- **`installUpdate()`** - Launches the installer
  - Quits the app to allow installation to proceed
  - The installer handles the rest

#### IPC Handlers

The module exposes the following IPC handlers to the renderer process:

- `check-for-updates` - Manually trigger an update check
- `install-update` - Install the downloaded update
- `update-status-request` - Query current update status

#### Events (sent to renderer)

- `update-available` - New update found
  - Payload: `{ version, releaseUrl, releaseNotes }`
- `update-downloaded` - Update download complete
  - Updates button text to "Install & Restart"

### Integration Points

#### Main Process (`main.js`)

```javascript
// Import the auto-updater
const autoUpdater = require('./auto-updater');

// In app.whenReady().then():
autoUpdater.setupIpcHandlers();
autoUpdater.startPeriodicCheck(win);

// On app shutdown:
app.on('window-all-closed', () => {
  autoUpdater.stopPeriodicCheck();
  app.quit();
});
```

#### Renderer Process (`preload.js`)

New APIs exposed to the renderer:

- `window.api.onUpdateAvailable(callback)` - Listen for update notifications
- `window.api.onUpdateDownloaded(callback)` - Listen for download completion
- `window.api.checkForUpdates()` - Manually check for updates
- `window.api.installUpdate()` - Install downloaded update

#### UI (`index.html`)

- Added `#update-notification` element for displaying update notifications
- Added CSS styling for the notification popup with slide-in animation
- Added JavaScript handlers for update events

## Configuration

### Check Interval

The check interval is set to 1 hour (3,600,000 milliseconds). To change this:

```javascript
// In auto-updater.js
const CHECK_INTERVAL = 1000 * 60 * 60; // Change this value
```

For example:
- 10 minutes: `1000 * 60 * 10`
- 30 minutes: `1000 * 60 * 30`
- Every time the app opens: Set to `null` and only call `checkForUpdates()` once

### GitHub Repository

The auto-updater is configured for:
- Owner: `luisdsanchez`
- Repository: `ValueScale`

To change this, update the constants in `auto-updater.js`:

```javascript
const OWNER = 'your-username';
const REPO = 'your-repo-name';
```

### Download Location

Updates are downloaded to:
- `%TEMP%/ValueScale-update.exe`

This path is automatically cleaned up when the update is installed.

## Versioning

The auto-updater uses semantic versioning (semver) to compare versions. This requires:

1. **GitHub Releases** - Use semantic version tags (e.g., `v1.2.3`, `1.2.3`)
2. **package.json** - Keep the version field updated to match releases
3. **Semver Package** - Already included in `package.json`

### Creating a Release

1. Update `package.json` version:
   ```json
   "version": "1.2.3"
   ```

2. Build the executable:
   ```bash
   npm run dist:portable
   ```

3. Create a GitHub release with:
   - Tag: `v1.2.3` (matches package.json version)
   - Attach the built executable file
   - Add release notes in the description

The auto-updater will automatically detect and prompt users to install the new version.

## Error Handling

The auto-updater handles errors gracefully:

- **Network errors** - Logged to console, doesn't crash the app
- **API errors** - Silently fails and retries on next scheduled check
- **Invalid version formats** - Falls back to comparing against current version
- **Missing downloads** - Shows error dialog if installation is attempted without downloaded file

## Security Considerations

1. **HTTPS Only** - Updates are downloaded over HTTPS from GitHub
2. **Version Verification** - Uses semver to verify version legitimacy
3. **User Confirmation** - Updates require user action to install
4. **No auto-install** - Updates won't install without explicit user confirmation
5. **GitHub API** - Leverages GitHub's security infrastructure

## User Experience

### Notification Appearance

When an update is available, users see a centered overlay with:
- "Update Available" title
- Version number and message
- Two buttons: "Install Now" and "Later"

### User Actions

1. **Install Now** - Downloads (if not done) and installs immediately
2. **Later** - Dismisses notification, can check again from GitHub releases page
3. **Background** - Continues using the app while update downloads

## Troubleshooting

### Updates Not Detecting

1. Check GitHub releases are tagged with semantic versions (v1.2.3)
2. Verify package.json version matches the latest release
3. Check browser console for errors (Ctrl+Shift+I in development mode)
4. Ensure GitHub API is accessible (no corporate firewall blocking)

### Installation Not Working

1. Ensure temp directory has write permissions
2. Check that executor has permissions to run `.exe` files
3. Verify the downloaded file exists in `%TEMP%`

### Version Comparison Issues

1. Use semantic versioning strictly (major.minor.patch)
2. Avoid pre-release versions like `1.2.3-alpha` for general users
3. Keep package.json version in sync with GitHub release tags

## Future Enhancements

Possible improvements for future versions:

- [ ] Delta updates (download only changed files)
- [ ] Scheduled updates (set specific times for checking)
- [ ] Staged rollouts (gradually roll out updates)
- [ ] Update history tracking
- [ ] Skip version option (don't ask about this version again)
- [ ] Offline update detection
- [ ] Auto-update on quit
- [ ] Update channels (alpha, beta, stable)

## Dependencies

- `semver@^7.6.0` - Version comparison
- Node built-in modules: `https`, `fs`, `path`, `child_process`

No additional npm packages beyond what's already in the project.

## License

This auto-update implementation is part of ValueScale and follows the same license as the main project.
