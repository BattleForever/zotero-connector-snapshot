# SPDX-License-Identifier: AGPL-3.0-or-later
"""Native snapshot validation regression. Loopback only; synthetic test data."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--extension',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        route=urlsplit(self.path).path
        paths={'/':ROOT/'tests/snapshot_rendering.html','/test.js':ROOT/'tests/snapshot_rendering.js',
               '/helper.js':args.extension/'itemSaver.js'}
        if route not in paths:self.send_error(404);return
        data=paths[route].read_bytes()
        self.send_response(200)
        self.send_header('Content-Type','text/html; charset=utf-8' if route=='/' else 'text/javascript; charset=utf-8')
        self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data)
    def do_POST(self):
        if self.path!='/result':self.send_error(404);return
        length=int(self.headers.get('Content-Length','0'))
        if length>65536:self.send_error(413);return
        result=json.loads(self.rfile.read(length));args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps({'pass':result['pass']}),flush=True)
        self.send_response(204);self.end_headers()
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',18769),Handler)
print('http://127.0.0.1:18769/',flush=True)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
