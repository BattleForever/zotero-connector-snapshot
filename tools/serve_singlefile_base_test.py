# SPDX-License-Identifier: AGPL-3.0-or-later
"""Native regression for the actual bundled SingleFile parser under inherited base CSP."""
from pathlib import Path
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import argparse
import json

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--extension',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
source=(args.extension/'lib/SingleFile/single-file.js').read_text(encoding='utf-8')
start=source.index('function _h(n,e){')
end=source.index('var Ph=',start)
actual_parser='const ih=DOMParser;window.parseSingleFileHTML='+source[start:end].strip().rstrip(';')+';'
reports=[]
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path=='/':data=(ROOT/'tests/singlefile_base_browser.html').read_bytes();mime='text/html; charset=utf-8'
        elif self.path=='/parser.js':data=actual_parser.encode();mime='text/javascript; charset=utf-8'
        elif self.path=='/test.js':data=(ROOT/'tests/singlefile_base_browser.js').read_bytes();mime='text/javascript; charset=utf-8'
        elif self.path=='/reports':data=json.dumps(reports).encode();mime='application/json'
        else:self.send_error(404);return
        self.send_response(200);self.send_header('Content-Type',mime);self.send_header('Cache-Control','no-store')
        if self.path=='/':self.send_header('Content-Security-Policy',"base-uri 'none'; report-uri /csp-report")
        self.end_headers();self.wfile.write(data)
    def do_POST(self):
        length=int(self.headers.get('Content-Length','0'))
        if length>65536:self.send_error(413);return
        data=json.loads(self.rfile.read(length))
        if self.path=='/csp-report':reports.append(data['csp-report'])
        elif self.path=='/result':
            args.output.parent.mkdir(parents=True,exist_ok=True)
            args.output.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
            print(json.dumps({'pass':data['pass'],'native_CSP_reports':len(data['nativeCSPReports'])}),flush=True)
        else:self.send_error(404);return
        self.send_response(204);self.end_headers()
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',18770),Handler)
print('http://127.0.0.1:18770/',flush=True)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
