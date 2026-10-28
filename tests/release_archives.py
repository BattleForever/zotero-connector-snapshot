# SPDX-License-Identifier: AGPL-3.0-or-later
"""Check shipped ZIPs and reproduce the ready folder from shipped source only."""
from pathlib import Path,PurePosixPath
import argparse
import hashlib
import io
import json
import subprocess
import sys
import tarfile
import uuid
import zipfile

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ready',type=Path,required=True)
parser.add_argument('--source',type=Path,required=True)
args=parser.parse_args()
area=ROOT/'build'/('发布包 中文路径 '+uuid.uuid4().hex)
area.mkdir(parents=True)
def sha(data):return hashlib.sha256(data).hexdigest()
def safe(name):
    path=PurePosixPath(name)
    assert not path.is_absolute() and '..' not in path.parts and '\\' not in name,name
    assert '.git' not in path.parts and '_metadata' not in path.parts,name
    assert 'wenxian_bridge' not in name,name
    return path

with zipfile.ZipFile(args.ready) as ready,zipfile.ZipFile(args.source) as source:
    assert len(ready.namelist())==len(set(ready.namelist()))
    assert len(source.namelist())==len(set(source.namelist()))
    for name in ready.namelist()+source.namelist():safe(name)
    prefix='zotero-snapshot/'
    inventory=json.loads(ready.read(prefix+'文件校验.json'))
    actual={name.removeprefix(prefix):sha(ready.read(name)) for name in ready.namelist() if name!=prefix+'文件校验.json'}
    assert actual==inventory['files']
    root='zotero-snapshot-source/'
    provenance=json.loads(source.read(root+'SOURCE_PROVENANCE.json'))
    for kind in ('project','upstream-package'):
        expected=provenance['project_files' if kind=='project' else 'baseline_files']
        names={n.removeprefix(root+kind+'/') for n in source.namelist() if n.startswith(root+kind+'/')}
        assert names==set(expected)
        for rel,expected_hash in expected.items():
            data=source.read(root+kind+'/'+rel)
            assert sha(data)==expected_hash
            target=area/kind/rel
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(data)
    for name,expected in provenance['upstream_archives'].items():
        data=source.read(root+'upstream/'+name)
        assert sha(data)==expected
        with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as archive:
            members=archive.getmembers()
            for member in members:safe(member.name)
            assert any(m.name.endswith(('.js','.jsx','.json')) for m in members)
    for record in provenance['dependencies']:
        kind='npm' if 'integrity' in record else 'preferred'
        assert sha(source.read(root+'dependencies/'+kind+'/'+record['filename']))==record['sha256']
    subprocess.run([sys.executable,str(area/'project/tools/build_ready.py'),'--base',str(area/'upstream-package'),
                    '--output',str(area/'rebuilt')],check=True,stdout=subprocess.PIPE)
    rebuilt={p.relative_to(area/'rebuilt').as_posix():sha(p.read_bytes()) for p in (area/'rebuilt').rglob('*') if p.is_file()}
    shipped={n.removeprefix(prefix):sha(ready.read(n)) for n in ready.namelist()}
    assert rebuilt==shipped,'Source-only reconstruction differs from the ready ZIP'
print(json.dumps({'pass':True,'source_only_offline_rebuild_matches_every_shipped_file':True,
                  'unicode_space_path':True,'ready_files':len(shipped),
                  'fixed_upstream_sources':len(provenance['upstream_archives']),
                  'dependency_sources':len(provenance['dependencies']),
                  'no_git_or_browser_metadata':True},indent=2))
