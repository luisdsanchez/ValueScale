# Auto-Update Quick Start Guide

## What's New

ValueScale checks for updates when the app starts and periodically while it's running. A notification appears when a new version is available.

## For End Users

### How to Get Updates

1. **Open ValueScale** - Updates are checked automatically
2. **See the notification** - If a new version is available, you'll see a notification
3. **Choose your action**:
   - Wait for the download to finish, then click **"Install & Restart"**
   - If the download fails, click **"Retry download"**
   - Click **"Later"** to dismiss the notification

### That's It!

The app closes, replaces its portable executable, and restarts from the same location. If replacement fails, an error identifies the downloaded file for manual installation.

## For Developers

### Setting Up a New Release

1. **Update the version** in `package.json`:
   ```json
   "version": "1.2.3"
   ```

2. **Build the executable**:
   ```bash
   npm run dist:portable
   ```

3. **Create a GitHub Release**:
   - Go to https://github.com/luisdsanchez/ValueScale/releases
   - Click "Create a new release"
   - Tag: `v1.2.3` (matches your package.json version)
   - Title: `ValueScale 1.2.3`
   - Upload the built `.exe` file from `dist/`
   - Add release notes
   - Click "Publish release"

That's it! Users will automatically see the update notification next time they open the app.

## How It Works

- **Startup Check** - Checks GitHub when app opens
- **Hourly Check** - Checks every 60 minutes while app is running
- **Background Download** - Silently downloads while you work
- **User Prompt** - Shows friendly notification with version info
- **Easy Install** - One-click installation, then automatic restart

## Configuration

To adjust how often updates are checked, edit `auto-updater.js`:

```javascript
const CHECK_INTERVAL = 1000 * 60 * 60; // Change to any value (milliseconds)
```

Examples:
- Every 10 minutes: `1000 * 60 * 10`
- Every 30 minutes: `1000 * 60 * 30`
- Every 2 hours: `1000 * 60 * 120`

## Troubleshooting

### "Update available" notification doesn't appear

1. Check GitHub releases page - is there a newer version tagged?
2. Verify the tag format: should be `v1.2.3` with semantic versioning
3. Open Developer Tools (Ctrl+Shift+I) and check console for errors
4. Try manually checking: Look for a "Check Updates" button in settings panel (if implemented)

### Installation fails

1. Close any file explorer windows showing the temp folder
2. Ensure you have admin rights to install
3. Retry the download or download the portable executable from GitHub Releases

### I want to skip a version

1. Click "Later" to dismiss the notification
2. The check will appear again next time the app starts

## Technical Details

See [AUTO_UPDATE_GUIDE.md](./AUTO_UPDATE_GUIDE.md) for complete technical documentation.

Key files:
- `auto-updater.js` - Core update checking logic
- `main.js` - Integration with Electron app
- `preload.js` - APIs exposed to UI
- `index.html` - Update notification UI

## Questions?

Check the full documentation in `AUTO_UPDATE_GUIDE.md` or review the implementation in:
- `auto-updater.js` - Main logic
- `index.html` - Notification UI and handlers

---

**Version:** 1.2.2+  
**Last Updated:** November 25, 2026
