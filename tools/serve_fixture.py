# SPDX-License-Identifier: AGPL-3.0-or-later
"""Serve synthetic acceptance and capture-regression files on loopback only; no writes or browsing."""
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import argparse

ROOT = Path(__file__).resolve().parents[1]
FILES = {name: 'text/html; charset=utf-8' if name.endswith('.html') else 'text/javascript; charset=utf-8'
         for name in ('/tests/live_extension.html','/tests/live_extension.js','/tests/browser_capture.html','/tests/browser_capture.js')}
EXTENSION_FILES = {'itemSaver.js','inject/pageSaving.js','singlefile.js','singlefile-config.js',
                   'lib/SingleFile/single-file-bootstrap.js','lib/SingleFile/single-file.js'}
EXTENSION = ROOT / 'build/extension'


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/extension/') and self.path.removeprefix('/extension/') in EXTENSION_FILES:
            file = EXTENSION / self.path.removeprefix('/extension/')
            content_type = 'text/javascript; charset=utf-8'
        elif self.path in FILES:
            file = ROOT / self.path.lstrip('/')
            content_type = FILES[self.path]
        else:
            self.send_error(404)
            return
        if not file.is_file():
            self.send_error(404)
            return
        data = file.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--extension', type=Path, default=EXTENSION)
    args = parser.parse_args()
    EXTENSION = args.extension.resolve()
    server = ThreadingHTTPServer(('127.0.0.1', 18765), Handler)
    print('http://127.0.0.1:18765/tests/live_extension.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
