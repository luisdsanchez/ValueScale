const { app, ipcMain, shell } = require('electron');
const https = require('https');
const semver = require('semver');

const OWNER = 'luisdsanchez';
const REPO = 'ValueScale';
const RELEASES_URL = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
const RELEASES_PAGE = `https://github.com/${OWNER}/${REPO}/releases/latest`;
const CHECK_INTERVAL = 1000 * 60 * 60;

let updateCheckTimer = null;
let mainWindow = null;
let updateAvailable = false;
let updateCheckPromise = null;

function getLatestReleaseFromGitHub() {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'ValueScale-AutoUpdater',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    https.get(RELEASES_URL, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('error', reject);
      res.on('aborted', () => reject(new Error('GitHub release request was interrupted.')));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`GitHub API returned status ${res.statusCode}`));
          return;
        }
        try {
          const release = JSON.parse(data);
          if (typeof release.tag_name !== 'string') throw new Error('Release tag is missing.');
          resolve(release.tag_name.replace(/^v/, ''));
        } catch (error) {
          reject(new Error(`Failed to parse release data: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function performUpdateCheck() {
  try {
    const currentVersion = app.getVersion();
    const latestVersion = await getLatestReleaseFromGitHub();
    updateAvailable = semver.gt(latestVersion, currentVersion);
    if (updateAvailable) {
      console.log(`Update available: ${latestVersion} (current: ${currentVersion})`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-available', { version: latestVersion });
      }
    } else {
      console.log(`ValueScale is up to date (${currentVersion})`);
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

function checkForUpdates() {
  if (!updateCheckPromise) {
    updateCheckPromise = performUpdateCheck().finally(() => { updateCheckPromise = null; });
  }
  return updateCheckPromise;
}

function startPeriodicCheck(window) {
  mainWindow = window;
  checkForUpdates();
  updateCheckTimer = setInterval(checkForUpdates, CHECK_INTERVAL);
}

function stopPeriodicCheck() {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
    updateCheckTimer = null;
  }
}

function setupIpcHandlers() {
  ipcMain.handle('check-for-updates', async () => {
    await checkForUpdates();
    return updateAvailable;
  });
  ipcMain.handle('open-update-page', () => shell.openExternal(RELEASES_PAGE));
}

module.exports = {
  startPeriodicCheck,
  stopPeriodicCheck,
  setupIpcHandlers,
  checkForUpdates,
};
