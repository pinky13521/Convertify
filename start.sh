#!/bin/bash
# Spouštěcí skript pro Convertify na Linuxu / macOS
cd "$(dirname "$0")"

echo "==============================================="
echo "   Spouštím Convertify..."
echo "==============================================="

if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "Detekován Docker. Spouštím kontejner..."
    docker-compose up -d
    echo "Aplikace běží na http://localhost:8080"
elif command -v python3 &> /dev/null; then
    echo "Spouštím pomocí Python 3..."
    python3 server.py
elif command -v node &> /dev/null; then
    echo "Spouštím pomocí Node.js..."
    node server.js
else
    echo "CHYBA: Není nainstalován Docker, Python 3 ani Node.js."
    echo "Prosím nainstalujte Python 3 (sudo apt install python3) nebo Docker."
    exit 1
fi
