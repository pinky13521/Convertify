@echo off
title Convertify Server
cd /d "%~dp0"

echo ===============================================
echo    Spoustim Convertify Server...
echo ===============================================

where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Detekovan Docker. Spoustim pres docker-compose...
    docker compose up -d
    echo Aplikace bezi na http://localhost:8080
    pause
    exit /b
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Spoustim pres Python...
    python server.py
    pause
    exit /b
)

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Spoustim pres Node.js...
    node server.js
    pause
    exit /b
)

echo CHYBA: Na tomto PC neni nalezen Docker, Python ani Node.js.
echo Oteviram index.html primo v prohlizeci...
start index.html
pause
