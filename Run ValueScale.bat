@echo off
setlocal
set "APP="
for /f "delims=" %%F in ('dir /b /a-d /o:-d "%~dp0dist\ValueScale_*.exe" 2^>nul') do if not defined APP set "APP=%~dp0dist\%%F"
if not defined APP (
  echo ValueScale has not been built yet.
  echo On a Windows x64 build machine, run: npm install
  echo Then run: npm run dist:portable
  pause
  exit /b 1
)
start "" "%APP%"
