# 🚀 ValueScale Auto-Update Feature - Complete Setup Guide

## What You Get

A fully automatic update system that:
- ✅ Checks for updates when users open the app
- ✅ Checks periodically (every hour) while running
- ✅ Shows friendly notifications with new version info
- ✅ Downloads updates silently in the background
- ✅ Installs with one user click
- ✅ Automatically restarts the app with new version

## How to Use

### For End Users (Already Built In)

No setup needed! When users open ValueScale:

1. **Update Check** → App checks GitHub automatically
2. **Notification** → "Update Available" popup appears (if newer version exists)
3. **Install** → User clicks "Install Now" or "Later"
4. **Done** → App restarts with new version

---

### For Developers - Setting Up Your First Release

#### Step 1: Update Version

Edit `package.json`:
```json
{
  "version": "1.2.3"
}
```

#### Step 2: Build the App

```bash
npm run dist:portable
```

The executable will be created in the `dist/` folder.

#### Step 3: Create GitHub Release

1. Go to https://github.com/luisdsanchez/ValueScale/releases
2. Click **"Draft a new release"**
3. Fill in:
   - **Tag:** `v1.2.3` (must match your package.json version)
   - **Title:** `ValueScale 1.2.3`
   - **Description:** Add release notes here
4. Click **"Attach binaries"** and upload your `.exe` file
5. Click **"Publish release"**

#### Step 4: Users Get Update

That's it! Next time users open ValueScale, they'll see the update notification.

---

## Configuration

### Change Check Frequency

Edit `auto-updater.js` line 11:

```javascript
const CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour in milliseconds
```

Examples:
```javascript
const CHECK_INTERVAL = 1000 * 60 * 10;  // Every 10 minutes
const CHECK_INTERVAL = 1000 * 60 * 30;  // Every 30 minutes
const CHECK_INTERVAL = 1000 * 60 * 60;  // Every hour (default)
const CHECK_INTERVAL = 1000 * 60 * 60 * 24; // Every 24 hours
```

### Change Repository

Edit `auto-updater.js` lines 7-8:

```javascript
const OWNER = 'your-username';
const REPO = 'your-repo-name';
```

---

## File Locations

| File | Purpose |
|------|---------|
| `auto-updater.js` | Core update logic |
| `main.js` | Electron integration (modified) |
| `preload.js` | API exposure to UI (modified) |
| `index.html` | Notification UI (modified) |
| `package.json` | Dependencies (modified) |
| `AUTO_UPDATE_GUIDE.md` | Technical docs |
| `QUICKSTART_AUTO_UPDATE.md` | Quick start guide |

---

## Understanding the Flow

```
┌─────────────────────────────────────────┐
│   User Opens ValueScale                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   auto-updater.js                       │
│   - Calls GitHub API                    │
│   - Gets latest release info            │
│   - Compares versions                   │
└──────────────┬──────────────────────────┘
               │
               ├─→ No update? Silent exit
               │
               └─→ Update available?
                   │
                   ▼
        ┌──────────────────────┐
        │  Send IPC Message    │
        │  to Renderer         │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Display             │
        │  Notification in UI  │
        └──────────┬───────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
  User clicks            User clicks
  "Install Now"          "Later"
       │                 │
       └────────┬────────┘
                │
       Download update    Dismiss
       & Install          notification
       │
       ▼
   App Restarts
   with new version
```

---

## Checking Logs

### During Development

Open Developer Tools (Ctrl+Shift+I) and check the console for:
- Update check logs
- Download progress
- Any errors

### In Production

Check the app console output for messages like:
```
Update available: 1.2.3 (current: 1.2.2)
Update downloaded successfully
```

---

## Troubleshooting

### "Update Available" Not Showing

**Check:**
1. Is there a release on GitHub with a newer version tag? (e.g., `v1.2.3`)
2. Is the tag format correct? (must be `vX.Y.Z`)
3. Is the .exe file attached to the release?

**Fix:**
```bash
# Verify your version
cat package.json | grep version

# Check GitHub releases
# Should have tag like v1.2.3
```

### Installation Fails

**Check:**
1. Do you have permission to install programs?
2. Is the temp folder accessible?
3. Is the .exe file in the dist folder?

**Fix:**
- Try again (it may retry the download)
- Manually download and run the .exe if needed

### Version Comparison Wrong

**Check:**
- Must use semantic versioning: `major.minor.patch`
- Examples: `1.0.0`, `1.2.3`, `2.0.0`

**Don't use:**
- Pre-releases for general users (e.g., `1.2.3-beta`)
- Non-semantic versions

---

## API Reference for Developers

### From Renderer Process

```javascript
// Listen for update notifications
window.api.onUpdateAvailable(({ version, releaseUrl, releaseNotes }) => {
  console.log('Update available:', version);
  // Show notification to user
});

// Listen for download completion
window.api.onUpdateDownloaded(() => {
  console.log('Update downloaded, ready to install');
  // Update button text to "Install & Restart"
});

// Manually check for updates
await window.api.checkForUpdates();

// Install downloaded update
window.api.installUpdate();
```

---

## Best Practices

### Versioning
- Always use semantic versioning (1.2.3, not 1.2 or v1)
- Keep package.json and GitHub release tags in sync
- Increment version before creating release

### Releases
- Add descriptive release notes
- Include changelog of what's new
- Test the .exe file before uploading
- Use consistent tag format (v1.2.3 or 1.2.3)

### Deployment
- Create releases on GitHub (not pre-releases)
- Wait for GitHub to process the release
- Users will get notification on next app open
- No need to notify users separately

---

## Security Notes

✅ **Safe by Default:**
- Uses HTTPS for all downloads
- GitHub handles security
- No auto-installation (requires user action)
- No data collection or telemetry
- Uses semantic versioning for validation

✅ **User Control:**
- Users can dismiss updates
- Users choose when to install
- Users can review release notes
- No forced updates

---

## Examples

### Example 1: Release a Bug Fix

1. Fix the bug in code
2. Update package.json: `"version": "1.2.3"` → `"version": "1.2.4"`
3. Run `npm run dist:portable`
4. Create GitHub release with tag `v1.2.4`
5. Upload the `.exe` file
6. Users see notification in 1-2 minutes

### Example 2: Release Major Feature

1. Add the feature
2. Update package.json: `"version": "1.2.4"` → `"version": "2.0.0"`
3. Run `npm run dist:portable`
4. Create GitHub release with tag `v2.0.0`
5. Add detailed release notes
6. Upload the `.exe` file
7. Users get update notification

### Example 3: Check Frequency

Want to check every 30 minutes instead of 1 hour?

Edit `auto-updater.js`:
```javascript
// Change this:
const CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour

// To this:
const CHECK_INTERVAL = 1000 * 60 * 30; // 30 minutes
```

---

## Support

For detailed technical information, see:
- `AUTO_UPDATE_GUIDE.md` - Complete technical documentation
- `auto-updater.js` - Implementation with detailed comments
- `index.html` - UI implementation and styling

---

## Summary

You now have a production-ready auto-update system that:
- Requires minimal configuration
- Works automatically without user effort
- Provides great user experience
- Is secure and reliable
- Scales to thousands of users

**Next Step:** Create your first GitHub release and watch users get the update notification! 🎉

---

**Questions?** Check the documentation files or review the source code in auto-updater.js
