@echo off
setlocal enabledelayedexpansion
rem 云澜 · 白雾 — DSH 主题安装脚本
rem 用法: install.bat ["<DeepSeek Harness.exe 的完整路径>"]

set "PKG=%~dp0"
if "%PKG:~-1%"=="\" set "PKG=%PKG:~0,-1%"

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
  echo     Run: install.bat "D:\path\to\DeepSeek Harness.exe"
  exit /b 1
)
if not exist "%EXE%" (
  echo [x] Not found: %EXE%
  exit /b 1
)

for %%D in ("%EXE%") do set "DIR=%%~dpD"
set "CLI=%DIR%resources\runtime\cli\bin\dsh.cmd"
if not exist "%CLI%" (
  echo [x] Cannot find the bundled dsh CLI at:
  echo     %CLI%
  exit /b 1
)

echo [*] Harness : %EXE%
echo [*] Package : %PKG%
echo [*] Installing into profile "desktop" ...
call "%CLI%" plugin --profile desktop add "file:%PKG%"
if errorlevel 1 (
  echo [x] Install failed.
  exit /b 1
)

echo.
echo [+] Done. Fully quit DeepSeek Harness and start it again.
endlocal
