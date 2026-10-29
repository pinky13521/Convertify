#!/usr/bin/env node
/**
 * Convertify - Jednoduchý Node.js HTTP server (žádné npm dependencies).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    // Odstranění query stringu
    const cleanUrl = req.url.split('?')[0];
    let filePath = path.join(ROOT_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);

    // Ochrana proti directory traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('403 Přístup odepřen');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Pokud požadovaná cesta neexistuje, zkusíme index.html nebo vrátíme 404
            filePath = path.join(ROOT_DIR, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
                res.end('500 Chyba serveru');
                return;
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content);
        });
    });
});

server.listen(PORT, HOST, () => {
    console.log('='.repeat(60));
    console.log('  Convertify Node.js server úspěšně spuštěn!');
    console.log(`  Lokální přístup:   http://localhost:${PORT}`);
    console.log(`  Síťový přístup:    http://${HOST}:${PORT}`);
    console.log('  Pro ukončení stiskněte Ctrl+C');
    console.log('='.repeat(60));
});
