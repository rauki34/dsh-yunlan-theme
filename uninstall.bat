@echo off
setlocal enabledelayedexpansion
rem 云澜 · 白雾 — DSH 主题卸载脚本
rem 用法: uninstall.bat ["<DeepSeek Harness.exe 的完整路径>"]

set "EXE=%~1"
if not "%EXE%"=="" goto :found

for %%P in (
  "%LOCALAPPDATA%\Programs\DeepSeek Harness\DeepSeek Harness.exe"
  "D:\DSH\DeepSeek Harness.exe"
  "C:\Program Files\DeepSeek Harness\DeepSeek Harness.exe"
  "C:\Program Files (x86)\DeepSeek Harness\DeepSeek Harness.exe"
) do (
  if exist "%%~P" if "!EXE!"=="" set "EXE=%%~P"
)

:found
if "%EXE%"=="" (
  echo [x] Cannot locate DeepSeek Harness.exe
  exit /b 1
)

for %%D in ("%EXE%") do set "DIR=%%~dpD"
set "CLI=%DIR%resources\runtime\cli\bin\dsh.cmd"
if not exist "%CLI%" (
  echo [x] Cannot find the bundled dsh CLI at:
  echo     %CLI%
  exit /b 1
)

echo [*] Removing dsh-yunlan-theme from profile "desktop" ...
call "%CLI%" plugin --profile desktop remove dsh-yunlan-theme
if errorlevel 1 (
  echo [!] Remove reported an error; the plugin may not have been installed here.
)

echo.
echo [+] Done. Restart DeepSeek Harness to get the stock look back.
endlocal
