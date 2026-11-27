@echo off
rem Creates Chrome.zip and Firefox.zip for store submission in the repository root.
rem Each zip contains the folder's contents at its top level (manifest.json at the root).
rem Uses the tar.exe bundled with Windows 10 1803 or later (bsdtar). It writes zip entries
rem with "/" separators, which AMO requires (PowerShell 5.1 Compress-Archive writes "\").
setlocal
set "ROOT=%~dp0"
set "TAR=%SystemRoot%\System32\tar.exe"

if not exist "%TAR%" (
  echo [ERROR] %TAR% not found. Windows 10 version 1803 or later is required.
  exit /b 1
)

call :build Chrome || exit /b 1
call :build Firefox || exit /b 1
echo Done.
exit /b 0

rem ---- :build <folder> ---------------------------------------------------------
:build
set "SRC=%ROOT%%~1"
set "OUT=%ROOT%%~1.zip"
if not exist "%SRC%\manifest.json" (
  echo [ERROR] %SRC%\manifest.json not found.
  exit /b 1
)
if exist "%OUT%" del /q "%OUT%" || (
  echo [ERROR] Could not delete %OUT%. Close any program that is using it.
  exit /b 1
)
rem Run tar inside the folder so that "*" makes the entries relative to it.
rem -a selects the zip format from the .zip extension.
pushd "%SRC%"
"%TAR%" -a -c -f "%OUT%" *
set "ERR=%ERRORLEVEL%"
popd
if not "%ERR%"=="0" (
  echo [ERROR] Failed to create %OUT%.
  exit /b 1
)
echo Created %~1.zip
exit /b 0
