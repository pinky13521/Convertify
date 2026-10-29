#!/usr/bin/env python3
"""
Convertify - Jednoduchý HTTP server pro lokální nebo serverový běh.
Nevyžaduje žádné externí knihovny (stačí standardní Python 3).
"""

import os
import sys
import time
import signal
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get('PORT', 8080))
HOST = os.environ.get('HOST', '0.0.0.0')

# Explicitní MIME typy pro bezchybné fungování
mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/wasm', '.wasm')
mimetypes.add_type('application/manifest+json', '.webmanifest')

class ConvertifyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Health check endpoint pro monitoring a Docker
        if self.path in ('/health', '/api/health'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status":"ok","server":"convertify"}')
            return
        return super().do_GET()

    def end_headers(self):
        # Povolit Service Worker a bezpečný CORS
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Přehledný log s časovou značkou
        print(f"[{self.log_date_time_string()}] {self.address_string()} - {format % args}")

class ReusableHTTPServer(HTTPServer):
    # Ochrana: umožňuje okamžité opětovné svázání s portem i po náhlém restartu (SO_REUSEADDR)
    allow_reuse_address = True
    daemon_threads = True

def run():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    server = None
    max_retries = 10

    # Ochrana proti kolizi portu při rychlém restartu: zkusíme až 10× počkat
    for attempt in range(1, max_retries + 1):
        try:
            server = ReusableHTTPServer((HOST, PORT), ConvertifyHandler)
            break
        except OSError as e:
            if attempt < max_retries:
                print(f"[Ochrana restartu] Port {PORT} se ještě uvolňuje po předchozím běhu (pokus {attempt}/{max_retries}). Čekám 1 sekundu...")
                time.sleep(1)
            else:
                print(f"[CHYBA] Nepodařilo se uvolnit port {PORT}: {e}")
                sys.exit(1)

    def graceful_shutdown(signum=None, frame=None):
        print("\n[Ochrana] Přijat signál k vypnutí. Čistě uvolňuji síťový port...")
        try:
            server.server_close()
        except Exception:
            pass
        print("Server byl bezpečně ukončen a port uvolněn.")
        sys.exit(0)

    # Zachycení signálů pro korektní ukončení při vypínání PC
    try:
        signal.signal(signal.SIGINT, graceful_shutdown)
        signal.signal(signal.SIGTERM, graceful_shutdown)
    except (ValueError, AttributeError):
        pass

    print("=" * 60)
    print("  Convertify server spuštěn s ochranou restartů!")
    print(f"  Lokální adresa:    http://localhost:{PORT}")
    print(f"  Síťová adresa:     http://0.0.0.0:{PORT}")
    print(f"  Health check:      http://localhost:{PORT}/health")
    print("  Pro ukončení stiskněte Ctrl+C")
    print("=" * 60)

    try:
        server.serve_forever()
    except (KeyboardInterrupt, SystemExit):
        graceful_shutdown()

if __name__ == '__main__':
    run()
