const { app, ipcMain, dialog } = require('electron');
const https = require('https');
const semver = require('semver');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const OWNER = 'luisdsanchez';
const REPO = 'ValueScale';
const RELEASES_URL = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
const CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour

let updateCheckTimer = null;
let mainWindow = null;
let updateAvailable = false;
let downloadedUpdatePath = null;
let updateCheckPromise = null;
let downloadSequence = 0;
let installingUpdate = false;

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
      res.on('error', reject);
      res.on('aborted', () => reject(new Error('GitHub release request was interrupted.')));

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const release = JSON.parse(data);
            const asset = release.assets?.find((item) => item.name?.toLowerCase().endsWith('.exe'));
            resolve({
              version: release.tag_name.replace(/^v/, ''),
              downloadUrl: asset?.browser_download_url,
              downloadSize: asset?.size,
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

function downloadUpdate(downloadUrl, expectedSize) {
  return new Promise((resolve, reject) => {
    const downloadPath = path.join(app.getPath('temp'), `ValueScale-update-${process.pid}-${++downloadSequence}.exe`);
    let file = null;
    let activeRequest = null;
    let activeResponse = null;
    let settled = false;
    let bytes = 0;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      if (activeResponse && typeof activeResponse.destroy === 'function') activeResponse.destroy();
      if (activeRequest && typeof activeRequest.destroy === 'function') activeRequest.destroy();
      if (file) {
        const removeIncomplete = () => fs.unlink(downloadPath, (unlinkError) => {
          if (unlinkError && unlinkError.code !== 'ENOENT') console.error('Failed to remove incomplete update:', unlinkError);
        });
        if (file.closed) removeIncomplete();
        else file.once('close', removeIncomplete);
        file.destroy();
      }
      reject(error);
    };
    const requestUrl = (url, redirects) => {
      let parsed;
      try {
        parsed = new URL(url);
        if (parsed.protocol !== 'https:') throw new Error('Update download must use HTTPS.');
      } catch (error) {
        fail(error);
        return;
      }
      let request;
      try {
        request = https.get(parsed.toString(), (response) => {
          if (settled) {
            response.resume();
            return;
          }
          activeResponse = response;
          if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
            response.resume();
            if (!response.headers.location || redirects >= 5) {
              fail(new Error('Invalid or excessive update download redirects.'));
              return;
            }
            try {
              requestUrl(new URL(response.headers.location, parsed).toString(), redirects + 1);
            } catch (error) {
              fail(error);
            }
            return;
          }
          if (response.statusCode !== 200) {
            response.resume();
            fail(new Error(`Update download returned HTTP ${response.statusCode}.`));
            return;
          }
          try {
            file = fs.createWriteStream(downloadPath);
          } catch (error) {
            fail(error);
            return;
          }
          response.on('aborted', () => fail(new Error('Update download was interrupted.')));
          response.on('error', fail);
          response.on('data', (chunk) => { bytes += chunk.length; });
          file.on('error', fail);
          file.on('finish', () => {
            file.close((error) => {
              if (settled) return;
              if (error) {
                fail(error);
                return;
              }
              if (!bytes || (Number.isSafeInteger(expectedSize) && expectedSize > 0 && bytes !== expectedSize)) {
                fail(new Error('Update download is incomplete.'));
                return;
              }
              settled = true;
              downloadedUpdatePath = downloadPath;
              resolve(downloadPath);
            });
          });
          response.pipe(file);
        });
      } catch (error) {
        fail(error);
        return;
      }
      activeRequest = request;
      request.on('error', fail);
    };
    requestUrl(downloadUrl, 0);
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

async function performUpdateCheck() {
  try {
    const currentVersion = getCurrentVersion();
    const releaseInfo = await getLatestReleaseFromGitHub();

    if (compareVersions(releaseInfo.version, currentVersion)) {
      console.log(`Update available: ${releaseInfo.version} (current: ${currentVersion})`);
      notifyUpdateAvailable(releaseInfo.version, releaseInfo);
      downloadedUpdatePath = null;

      try {
        if (!releaseInfo.downloadUrl) throw new Error('No Windows executable was found in the release.');
        await downloadUpdate(releaseInfo.downloadUrl, releaseInfo.downloadSize);
        console.log('Update downloaded successfully');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-downloaded');
        }
      } catch (error) {
        console.error('Failed to download update:', error);
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-download-failed');
      }
    } else {
      console.log(`ValueScale is up to date (${currentVersion})`);
      updateAvailable = false;
      downloadedUpdatePath = null;
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
    if (updateAvailable && mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-download-failed');
  }
}

function checkForUpdates() {
  if (!updateCheckPromise) {
    updateCheckPromise = performUpdateCheck().finally(() => { updateCheckPromise = null; });
  }
  return updateCheckPromise;
}

function installUpdate() {
  if (installingUpdate) return;
  if (!downloadedUpdatePath || !fs.existsSync(downloadedUpdatePath)) {
    dialog.showErrorBox('Update Error', 'No update available to install.');
    return;
  }

  let helperDir = null;
  const cleanupHelper = () => {
    if (!helperDir) return;
    try {
      const helperPath = path.join(helperDir, 'portable-update.ps1');
      if (fs.existsSync(helperPath)) fs.unlinkSync(helperPath);
      fs.rmdirSync(helperDir);
    } catch (error) {
      console.error('Failed to remove update helper:', error);
    }
  };
  try {
    const portablePath = process.env.PORTABLE_EXECUTABLE_FILE;
    if (process.platform !== 'win32' || !app.isPackaged || !portablePath
      || !path.isAbsolute(portablePath) || path.extname(portablePath).toLowerCase() !== '.exe'
      || !fs.existsSync(portablePath) || !process.env.SystemRoot) {
      throw new Error('The original Windows portable executable could not be located. Download the update from GitHub Releases and replace your existing file manually.');
    }
    const target = fs.realpathSync(portablePath);
    if (target.toLowerCase() === path.resolve(downloadedUpdatePath).toLowerCase()) {
      throw new Error('The update and original executable must be different files.');
    }
    helperDir = fs.mkdtempSync(path.join(app.getPath('temp'), 'ValueScale-updater-'));
    const helperPath = path.join(helperDir, 'portable-update.ps1');
    fs.copyFileSync(path.join(__dirname, 'portable-update.ps1'), helperPath, fs.constants.COPYFILE_EXCL);
    const powershell = path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    installingUpdate = true;
    const installer = spawn(powershell, [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-WindowStyle', 'Hidden', '-File', helperPath,
      '-ParentProcessId', String(process.pid), '-SourcePath', downloadedUpdatePath, '-TargetPath', target, '-CleanupHelper',
    ], {
      detached: true,
      stdio: 'ignore',
    });

    installer.once('error', (error) => {
      installingUpdate = false;
      console.error('Failed to launch update installer:', error);
      cleanupHelper();
      dialog.showErrorBox('Update Error', `Failed to launch update installer: ${error.message}`);
    });
    installer.once('spawn', () => {
      installer.unref();
      app.quit();
    });
  } catch (error) {
    installingUpdate = false;
    console.error('Failed to launch update installer:', error);
    cleanupHelper();
    dialog.showErrorBox('Update Error', `Failed to launch update installer: ${error.message}`);
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
