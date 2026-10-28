# SPDX-License-Identifier: AGPL-3.0-or-later
"""Serve synthetic CSP regression with actual baseline/candidate policy and parser source."""
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import argparse
import json
import re
from urllib.parse import parse_qs, urlsplit

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base',type=Path,required=True)
parser.add_argument('--extension',type=Path,required=True)
parser.add_argument('--output',type=Path)
args=parser.parse_args()
def policy(root):
    html=(root/'offscreen/offscreenSandbox.html').read_text(encoding='utf-8')
    value=re.search(r'<meta http-equiv="Content-Security-Policy" content="([^"]+)"',html).group(1)
    return value.replace("frame-ancestors 'self';",'').strip()
baseline,fixed=policy(args.base.resolve()),policy(args.extension.resolve())
reports,network_hits={},[]
class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        url=urlsplit(self.path)
        length=int(self.headers.get('Content-Length','0'))
        if length>262144:self.send_error(413);return
        data=json.loads(self.rfile.read(length))
        if url.path=='/report':
            query=parse_qs(url.query);key=(query['run'][0],query['case'][0])
            reports.setdefault(key,[]).append(data['csp-report'])
        elif url.path=='/result':
            if args.output:
                args.output.parent.mkdir(parents=True,exist_ok=True)
                args.output.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
            print(json.dumps({'pass':data.get('pass'),'checks':data.get('checks')},ensure_ascii=False),flush=True)
        else:self.send_error(404);return
        self.send_response(204);self.end_headers()
    def do_GET(self):
        url=urlsplit(self.path);query=parse_qs(url.query);csp=None
        if url.path=='/tests/csp_browser.html':
            data=(ROOT/'tests/csp_browser.html').read_bytes();mime='text/html; charset=utf-8'
            if 'case' in query:
                mode=query['case'][0];run=query['run'][0]
                csp=(baseline if mode=='before' else fixed)+' report-uri /report?case='+mode+'&run='+run
        elif url.path=='/tests/csp_browser.js':
            data=(ROOT/'tests/csp_browser.js').read_bytes();mime='text/javascript; charset=utf-8'
        elif url.path=='/extension/offscreen/offscreenTranslate.js':
            data=(args.extension/'offscreen/offscreenTranslate.js').read_bytes();mime='text/javascript; charset=utf-8'
        elif url.path=='/evidence':
            run=query['run'][0]
            data=json.dumps({'reports':{case:records for (tag,case),records in reports.items() if tag==run},'networkHits':network_hits}).encode();mime='application/json'
        elif url.path.startswith('/network-'):
            network_hits.append(url.path);data=b'network boundary failure';mime='text/plain'
        else:self.send_error(404);return
        self.send_response(200);self.send_header('Content-Type',mime)
        self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store')
        if csp:self.send_header('Content-Security-Policy',csp)
        self.end_headers();self.wfile.write(data)
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',18768),Handler)
print('http://127.0.0.1:18768/tests/csp_browser.html',flush=True)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
