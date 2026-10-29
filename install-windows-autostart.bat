@echo off
title Nastaveni automatickeho spusteni Convertify po zapnuti Windows
cd /d "%~dp0"

echo ============================================================
echo   Nastaveni automatickeho spusteni po zapnuti Lenovo PC
echo ============================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\ConvertifyServer.lnk"
set "TARGET_SCRIPT=%~dp0run_silent.vbs"

echo Vytvarim zastupce v automatickem spousteni (Startup)...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%TARGET_SCRIPT%\"'; $s.WorkingDirectory = '%~dp0'; $s.Save()"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo HOTOVO! 
    echo Convertify se nyni automaticky spusti pri kazdem zapnuti Windows.
    echo Bude bezet neviditelne na pozadi na portu 8080.
) else (
    echo.
    echo Nastala chyba pri vytvareni zastupce.
)

echo.
pause
