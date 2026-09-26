@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  set "PY=py -3"
) else (
  set "PY=python"
)
%PY% --version
if errorlevel 1 (
  echo Please install Python 3.11+ from python.org first, checking "Add Python to PATH".
  pause
  exit /b 1
)
%PY% -m pip install --user -r "tools\screen_parser\requirements.txt"
if errorlevel 1 (
  echo Python package installation failed. Check connectivity / Python version.
  pause
  exit /b 1
)
echo.
echo Python packages installed. Install Tesseract OCR for Windows with English data separately.
echo Its usual C:\Program Files\Tesseract-OCR\tesseract.exe path is auto-detected.
echo Or set TESSERACT_CMD to the full tesseract.exe path.
echo Then run START_SCREEN_PARSER_WINDOWS.bat.
pause
