# SPDX-License-Identifier: AGPL-3.0-or-later
"""Validate the complete folder layout and that packaging changes no runtime logic."""
from pathlib import Path
import argparse
import json
import struct
import sys
import uuid

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from build_ready import build_ready,VERSION,NUMERIC_VERSION
from build import digest

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base',type=Path,required=True)
args=parser.parse_args()
output=ROOT/'build'/('ready-test-'+uuid.uuid4().hex)
result=build_ready(args.base,output)
manifest=json.loads((output/'extension/manifest.json').read_text(encoding='utf-8'))
assert manifest['version']==NUMERIC_VERSION
assert '适用于 Zotero Connector' in manifest['name']
assert '非官方' in manifest['description']
assert result['runtime_code_unchanged']
assert set(result['changed_extension_files'])=={'manifest.json','Icon-16.png','Icon-32.png','Icon-64.png','Icon-128.png'}
for size in (16,32,64,128):
    data=(output/'extension'/f'Icon-{size}.png').read_bytes()
    assert data[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',data[16:24])==(size,size)
html=(output/'先看这里.html').read_text(encoding='utf-8')
assert '@@VERSION@@' not in html and '@@SOURCE_URL@@' not in html
assert VERSION in html and 'chrome://extensions' in html
assert '<script src=' not in html and 'https://fonts.' not in html
assert (output/'LICENSES/AGPL-3.0.txt').is_file()
assert (output/'LICENSES/MPL-2.0.txt').is_file()
assert (output/'LICENSES/THIRD_PARTY.json').is_file()
inventory=json.loads((output/'LICENSES/THIRD_PARTY.json').read_text(encoding='utf-8'))
for component in inventory:
    assert component['license_files'],component['name']
    for name in component['license_files']:assert (output/'LICENSES'/name).is_file()
assert (output/'快速上手.txt').is_file()
for rel,sha in result['files'].items():assert digest(output/rel)==sha
try:build_ready(args.base,output)
except ValueError:pass
else:raise AssertionError('Existing output was overwritten')
print(json.dumps({'pass':True,'runtime_logic_unchanged':True,'beginner_folder_ready':True,
                  'original_icons_replaced':True,'permissions_unchanged':True,'complete_license_notices':True},indent=2))
