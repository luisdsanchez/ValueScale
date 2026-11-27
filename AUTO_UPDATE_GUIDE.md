# Update Notifications

ValueScale checks GitHub Releases on startup and once per hour. If a newer version is available, the notification offers **Open GitHub** and **Later**.

**Open GitHub** opens the latest release page in the default browser. Download the Windows portable executable, close ValueScale, and replace the old executable manually. ValueScale does not download, install, or replace updates automatically.

## Implementation

- `auto-updater.js` requests the latest GitHub release and compares its tag with the current app version using `semver`.
- The `update-available` event supplies the version to the notification in `index.html`.
- The `open-update-page` IPC handler opens the fixed GitHub Releases URL using Electron's `shell.openExternal`.
- Failed checks are logged and retried at the next scheduled check. If the browser cannot be opened, the notification reports the error and allows another attempt.

## Publishing

Keep the versions in `package.json` and `package-lock.json` in sync. Build with `npm run dist:portable`, then create a GitHub release with a matching semantic-version tag and attach the executable before publishing it.
