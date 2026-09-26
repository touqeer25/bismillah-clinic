@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  set "PY=py -3"
) else (
  set "PY=python"
)
%PY% -m pip install --user pyinstaller
if errorlevel 1 exit /b 1
%PY% -m PyInstaller --noconfirm --clean --onefile --noconsole --name BismillahScreenParser --paths . --add-data "remedy_names.json;." --collect-all mss --collect-all pytesseract --collect-all pymupdf tools\screen_parser\win_launcher.py
if errorlevel 1 (
  echo Build failed. Build this EXE ON WINDOWS, not Linux.
  pause
  exit /b 1
)
echo EXE is at dist\BismillahScreenParser.exe
 echo Note: Tesseract OCR engine must still be installed on the Windows computer.
pause
