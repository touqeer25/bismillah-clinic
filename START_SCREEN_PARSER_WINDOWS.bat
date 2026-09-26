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
  echo Open this file in the COMPLETE Bismillah Clinic repo folder.
  pause
  exit /b 1
)
%PY% -c "import PIL,mss,pytesseract,pymupdf" >nul 2>&1
if errorlevel 1 (
  echo Python OCR/PDF libraries are missing. Run INSTALL_SCREEN_PARSER_WINDOWS.bat first.
  pause
  exit /b 1
)
%PY% -m tools.screen_parser
if errorlevel 1 (
  echo Screen Parser stopped with an error. Share the error above, NOT book scans.
  pause
  exit /b 1
)
