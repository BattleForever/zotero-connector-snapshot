# SPDX-License-Identifier: AGPL-3.0-or-later
"""Serve two synthetic acceptance files on loopback only; no writes or browsing."""
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parents[1]
FILES = {'/tests/live_extension.html': 'text/html; charset=utf-8',
         '/tests/live_extension.js': 'text/javascript; charset=utf-8'}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path not in FILES:
            self.send_error(404)
            return
        data = (ROOT / self.path.lstrip('/')).read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', FILES[self.path])
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 18765), Handler)
    print('http://127.0.0.1:18765/tests/live_extension.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
