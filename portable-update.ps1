param(
  [int]$ParentProcessId,
  [string]$SourcePath,
  [string]$TargetPath,
  [switch]$CleanupHelper
)

$ErrorActionPreference = 'Stop'

function Show-UpdateMessage([string]$Message, [string]$Title, [string]$Icon) {
  Add-Type -AssemblyName System.Windows.Forms
  [void][System.Windows.Forms.MessageBox]::Show($Message, $Title, 'OK', $Icon)
}

function Install-PortableUpdate([int]$ParentId, [string]$Source, [string]$Target) {
  if (-not [System.IO.File]::Exists($Source) -or -not [System.IO.File]::Exists($Target)) {
    throw 'The downloaded update or original executable could not be found.'
  }
  if ([System.StringComparer]::OrdinalIgnoreCase.Equals(
      [System.IO.Path]::GetFullPath($Source), [System.IO.Path]::GetFullPath($Target))) {
    throw 'The update and original executable must be different files.'
  }

  $parent = Get-Process -Id $ParentId -ErrorAction SilentlyContinue
  if ($parent -and -not $parent.WaitForExit(60000)) {
    throw 'ValueScale did not close in time. The original executable was not changed.'
  }

  $directory = [System.IO.Path]::GetDirectoryName($Target)
  $id = [Guid]::NewGuid().ToString('N')
  $staged = [System.IO.Path]::Combine($directory, ".ValueScale-update-$id.tmp")
  $backup = [System.IO.Path]::Combine($directory, ".ValueScale-backup-$id.bak")
  $failedUpdate = [System.IO.Path]::Combine($directory, ".ValueScale-failed-$id.tmp")
  $replaced = $false
  $started = $false
  try {
    [System.IO.File]::Copy($Source, $staged, $false)
    $lastError = $null
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
      try {
        [System.IO.File]::Replace($staged, $Target, $backup)
        $replaced = $true
        break
      } catch [System.IO.IOException] {
        $lastError = $_
        Start-Sleep -Milliseconds 500
      }
    }
    if (-not $replaced) { throw "Could not replace the original executable: $lastError" }

    Start-Process -FilePath $Target -ArgumentList '--updated' -WorkingDirectory $directory -ErrorAction Stop
    $started = $true
  } catch {
    $failure = $_
    if ($replaced -and -not $started) {
      try {
        [System.IO.File]::Replace($backup, $Target, $failedUpdate)
      } catch {
        throw "The updated executable could not be started and the original could not be restored. The original is saved at: $backup. Error: $_"
      }
    }
    throw $failure
  } finally {
    foreach ($file in @($staged, $failedUpdate)) {
      if ([System.IO.File]::Exists($file)) {
        try { [System.IO.File]::Delete($file) }
        catch { Show-UpdateMessage "Could not remove temporary update file: $file`n$_" 'ValueScale Update' 'Warning' }
      }
    }
  }

  foreach ($file in @($backup, $Source)) {
    try { [System.IO.File]::Delete($file) }
    catch { Show-UpdateMessage "The update started, but this temporary file could not be removed: $file`n$_" 'ValueScale Update' 'Warning' }
  }
}

if ($MyInvocation.InvocationName -ne '.') {
  try {
    Install-PortableUpdate $ParentProcessId $SourcePath $TargetPath
  } catch {
    Show-UpdateMessage "The update could not be installed: $_`n`nThe downloaded file is available at: $SourcePath" 'ValueScale Update Error' 'Error'
    exit 1
  } finally {
    if ($CleanupHelper) {
      try {
        [System.IO.File]::Delete($PSCommandPath)
        [System.IO.Directory]::Delete([System.IO.Path]::GetDirectoryName($PSCommandPath))
      } catch {
        Show-UpdateMessage "Could not remove the temporary update helper: $PSCommandPath`n$_" 'ValueScale Update' 'Warning'
      }
    }
  }
}
