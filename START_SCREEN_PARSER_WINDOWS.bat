@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
where py >nul 2>&1
if %errorlevel%==0 (
  set "PY=py -3"
) else (
  set "PY=python"
)
%PY% -c "import PIL,mss,pytesseract,pymupdf" >nul 2>&1
if errorlevel 1 (
  echo Python OCR/PDF dependencies are missing. First run INSTALL_SCREEN_PARSER_WINDOWS.bat.
  pause
  exit /b 1
)
if not exist "remedy_names.json" (
  echo Run this launcher from the FULL Bismillah Clinic repo (remedy_names.json missing).
  pause
  exit /b 1
)
%PY% -m tools.screen_parser
if errorlevel 1 (
  echo Screen Parser stopped with an error. Please share the error above (no patient/book screenshots).
  pause
)
