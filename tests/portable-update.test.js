const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const windowsOnly = { skip: process.platform !== 'win32' };

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ValueScale update test '));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 30, retryDelay: 100 }));
  const target = path.join(dir, "Artist's ValueScale & old.exe");
  const source = path.join(dir, 'downloaded update.exe');
  fs.writeFileSync(target, 'original');
  fs.writeFileSync(source, 'updated');
  return { dir, target, source };
}

function runHelper(files, script) {
  const command = `
    . $env:UPDATE_SCRIPT
    ${script}
  `;
  execFileSync(path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'), [
    '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64'),
  ], {
    env: { ...process.env, UPDATE_SCRIPT: path.resolve(__dirname, '..', 'portable-update.ps1'), TARGET: files.target, SOURCE: files.source },
    stdio: 'pipe',
  });
}

test('portable installation replaces the original and launches from its existing path', windowsOnly, (t) => {
  const files = fixture(t);
  runHelper(files, `
    function Start-Process {
      [CmdletBinding()] param([string]$FilePath, [string]$ArgumentList, [string]$WorkingDirectory)
      if ($FilePath -ne $env:TARGET -or $ArgumentList -ne '--updated') { throw 'Incorrect restart arguments' }
    }
    Install-PortableUpdate 2147483647 $env:SOURCE $env:TARGET
  `);
  assert.equal(fs.readFileSync(files.target, 'utf8'), 'updated');
  assert.equal(fs.existsSync(files.source), false);
  assert.deepEqual(fs.readdirSync(files.dir), [path.basename(files.target)]);
});

test('portable installation restores the original if restart fails', windowsOnly, (t) => {
  const files = fixture(t);
  runHelper(files, `
    function Start-Process {
      [CmdletBinding()] param([string]$FilePath, [string]$ArgumentList, [string]$WorkingDirectory)
      throw 'Simulated launch failure'
    }
    try {
      Install-PortableUpdate 2147483647 $env:SOURCE $env:TARGET
      throw 'Expected launch failure'
    } catch {
      if ($_.Exception.Message -notlike '*Simulated launch failure*') { throw }
    }
    exit 0
  `);
  assert.equal(fs.readFileSync(files.target, 'utf8'), 'original');
  assert.equal(fs.readFileSync(files.source, 'utf8'), 'updated');
  assert.deepEqual(fs.readdirSync(files.dir).sort(), [path.basename(files.source), path.basename(files.target)].sort());
});

test('the copied helper removes itself after a successful installation', windowsOnly, (t) => {
  const files = fixture(t);
  const helperDir = path.join(files.dir, 'helper files');
  fs.mkdirSync(helperDir);
  const helper = path.join(helperDir, 'portable-update.ps1');
  fs.copyFileSync(path.resolve(__dirname, '..', 'portable-update.ps1'), helper);
  fs.copyFileSync(path.join(process.env.SystemRoot, 'System32', 'where.exe'), files.source);
  execFileSync(path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'), [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', helper,
    '-ParentProcessId', '2147483647', '-SourcePath', files.source, '-TargetPath', files.target, '-CleanupHelper',
  ], { stdio: 'pipe' });
  assert.equal(fs.existsSync(helperDir), false);
  assert.equal(fs.existsSync(files.source), false);
  assert.equal(fs.readFileSync(files.target).compare(fs.readFileSync(path.join(process.env.SystemRoot, 'System32', 'where.exe'))), 0);
});
