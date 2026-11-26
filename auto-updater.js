const { app, ipcMain, dialog } = require('electron');
const https = require('https');
const semver = require('semver');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const OWNER = 'luisdsanchez';
const REPO = 'ValueScale';
const RELEASES_URL = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
const CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour

let updateCheckTimer = null;
let mainWindow = null;
let updateAvailable = false;
let downloadedUpdatePath = null;

function getCurrentVersion() {
  return app.getVersion();
}

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

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const release = JSON.parse(data);
            resolve({
              version: release.tag_name.replace(/^v/, ''),
              downloadUrl: release.assets?.[0]?.browser_download_url,
              releaseUrl: release.html_url,
              prerelease: release.prerelease,
              body: release.body,
            });
          } catch (error) {
            reject(new Error(`Failed to parse release data: ${error.message}`));
          }
        } else {
          reject(new Error(`GitHub API returned status ${res.statusCode}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function compareVersions(latestVersion, currentVersion) {
  try {
    return semver.gt(latestVersion, currentVersion);
  } catch (error) {
    console.error('Version comparison failed:', error);
    return false;
  }
}

function downloadUpdate(downloadUrl) {
  return new Promise((resolve, reject) => {
    const tempDir = app.getPath('temp');
    const downloadPath = path.join(tempDir, 'ValueScale-update.exe');

    const file = fs.createWriteStream(downloadPath);
    const request = https.get(downloadUrl, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            downloadedUpdatePath = downloadPath;
            resolve(downloadPath);
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          downloadedUpdatePath = downloadPath;
          resolve(downloadPath);
        });
      }
    });

    request.on('error', (error) => {
      fs.unlink(downloadPath, () => {});
      reject(error);
    });

    file.on('error', (error) => {
      fs.unlink(downloadPath, () => {});
      reject(error);
    });
  });
}

function notifyUpdateAvailable(latestVersion, releaseInfo) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  updateAvailable = true;
  mainWindow.webContents.send('update-available', {
    version: latestVersion,
    releaseUrl: releaseInfo.releaseUrl,
    releaseNotes: releaseInfo.body,
  });
}

async function checkForUpdates() {
  try {
    const currentVersion = getCurrentVersion();
    const releaseInfo = await getLatestReleaseFromGitHub();

    if (compareVersions(releaseInfo.version, currentVersion)) {
      console.log(`Update available: ${releaseInfo.version} (current: ${currentVersion})`);
      notifyUpdateAvailable(releaseInfo.version, releaseInfo);

      // Start downloading in background
      try {
        await downloadUpdate(releaseInfo.downloadUrl);
        console.log('Update downloaded successfully');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-downloaded');
        }
      } catch (error) {
        console.error('Failed to download update:', error);
      }
    } else {
      console.log(`ValueScale is up to date (${currentVersion})`);
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

function installUpdate() {
  if (!downloadedUpdatePath || !fs.existsSync(downloadedUpdatePath)) {
    dialog.showErrorBox('Update Error', 'No update available to install.');
    return;
  }

  try {
    // Execute the installer
    execFile(downloadedUpdatePath, ['--updated'], {
      detached: true,
    });

    // Quit and let the installer run
    app.quit();
  } catch (error) {
    dialog.showErrorBox('Update Error', `Failed to install update: ${error.message}`);
  }
}

function startPeriodicCheck(window) {
  mainWindow = window;

  // Check immediately on startup
  checkForUpdates();

  // Then check periodically
  updateCheckTimer = setInterval(() => {
    checkForUpdates();
  }, CHECK_INTERVAL);
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

  ipcMain.handle('install-update', () => {
    installUpdate();
  });

  ipcMain.on('update-status-request', (event) => {
    event.reply('update-status', {
      available: updateAvailable,
      downloaded: downloadedUpdatePath && fs.existsSync(downloadedUpdatePath),
    });
  });
}

module.exports = {
  startPeriodicCheck,
  stopPeriodicCheck,
  setupIpcHandlers,
  checkForUpdates,
  installUpdate,
};
