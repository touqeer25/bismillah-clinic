@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "PYTHONUTF8=1"
rem Prefer Python 3.12. Microsoft Store Python may have python3.12 but NO py/python.
set "PY="
py -3.12 -c "import sys; assert sys.version_info[0] == 3 and sys.version_info[1] in [11,12,13]" >nul 2>&1
if not errorlevel 1 set "PY=py -3.12"
if not defined PY (
  python3.12 -c "import sys; assert sys.version_info[0] == 3 and sys.version_info[1] in [11,12,13]" >nul 2>&1
  if not errorlevel 1 set "PY=python3.12"
)
if not defined PY (
  py -3 -c "import sys; assert sys.version_info[0] == 3 and sys.version_info[1] in [11,12,13]" >nul 2>&1
  if not errorlevel 1 set "PY=py -3"
)
if not defined PY (
  python -c "import sys; assert sys.version_info[0] == 3 and sys.version_info[1] in [11,12,13]" >nul 2>&1
  if not errorlevel 1 set "PY=python"
)
if not defined PY (
  echo Python 3.11, 3.12 or 3.13 not found. Microsoft Store users: enable the
  echo python3.12 App Execution Alias, then open a NEW Command Prompt.
  echo Check: python3.12 --version
  pause
  exit /b 1
)
if not exist "remedy_names.json" (
  echo Build from the COMPLETE repo folder.
  pause
  exit /b 1
)
%PY% -m pip install --user pyinstaller
if errorlevel 1 (
  pause
  exit /b 1
)
%PY% -m PyInstaller --noconfirm --clean --onefile --noconsole --name BismillahScreenParser --paths . --add-data "remedy_names.json;." --collect-all mss --collect-all pytesseract --collect-all pymupdf tools\screen_parser\win_launcher.py
if errorlevel 1 (
  echo EXE build failed. Build on Windows, not Linux. This build is optional.
  pause
  exit /b 1
)
echo EXE saved at dist\BismillahScreenParser.exe
echo Local Tesseract English OCR is still required.
pause
