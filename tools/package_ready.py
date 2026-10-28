# SPDX-License-Identifier: AGPL-3.0-or-later
"""Package the ready folder and complete corresponding sources; no downloads."""
from pathlib import Path
import argparse
import base64
import gzip
import hashlib
import json
import subprocess
import zipfile

from build import ROOT,digest
from build_ready import build_ready,VERSION
from export_source import public_files

UPSTREAM_COMMIT='ce29dfa360d1ce17a3a1f15a9d338d638a073106'
MODULES={
    'src/translate':'485ac36edbd66459e2aa3bad4d4b36921be2c7c2',
    'src/utilities':'cccf1235a318c259345fc623d5e9d6770ba19df7',
    'src/zotero':'01ebeb183439bbd79797bbcd4a41e99aad099ab8',
    'src/zotero-google-docs-integration':'a46413151134ad699c351ac42ecbbe9c76c8e6cc',
    'src/zotero-schema':'b5b3f51217a99b3c41585d468ee1dc0837233d13',
}

def git(path,*args):
    return subprocess.check_output(['git','-C',str(path),*args])

def put(archive,path,data,executable=False):
    parts=Path(path).parts
    if Path(path).is_absolute() or '..' in parts or '\\' in path:
        raise ValueError('Unsafe archive path')
    info=zipfile.ZipInfo(path,date_time=(2026,10,28,0,0,0))
    info.compress_type=zipfile.ZIP_DEFLATED
    info.external_attr=(0o100755 if executable else 0o100644)<<16
    archive.writestr(info,data)

def source_archive(upstream,path,commit):
    actual=git(upstream/path,'rev-parse','HEAD').decode().strip()
    if actual!=commit:raise ValueError('Wrong upstream commit: '+str(path))
    # Export committed blobs, not CRLF checkout files or partially cloned nested modules.
    return gzip.compress(git(upstream/path,'archive','--format=tar',commit),mtime=0)

REBUILD='''# Complete corresponding source — v{version}

This archive accompanies the ready-to-load Chrome extension. End users do not
need it to install. License: AGPL-3.0-or-later, with third-party notices retained.

## Reproduce the exact ready folder offline

Python 3.10+ is the only requirement. From this extracted source directory:

    cd project
    python tools/build_ready.py --base ../upstream-package --output ../rebuilt-ready

`rebuilt-ready/extension` is the loadable extension. The result must match the
SHA-256 file inventory embedded in the ready ZIP. The build reads only the
locked baseline files and does not download anything or access a Zotero library.
Our runtime core is rc.9; rc.10 changes manifest metadata and four icon PNGs only.
The new icon PNGs can be regenerated with tools/make_icons.py (Pillow required
only for regenerating artwork, not for building or installing the extension).

## Preferred upstream source and upstream build machinery

`upstream/` includes the official Connector 5.0.217 Git source and the five direct
submodules at their exact commits, exported with git archive. These archives
include the original JSX/JS, styles, locale assets, licenses, package lock and
build scripts. Unrelated desktop nested submodules are not used by Connector.
To assemble these sources on Linux/macOS/WSL:

    cd upstream
    sh assemble-upstream.sh

Then follow `zotero-connectors/README.md`. Its Node/npm/Bash toolchain can build
the original upstream project (`npm ci`, then `./build.sh -v 5.0.217`). This is a
developer route, requires upstream build dependencies and is not promised to
recreate every byte of the store package. The exact distributed upstream package
inputs are separately included in `upstream-package/`, verified against
`project/baseline.lock.json` for the offline customization route above.

`dependencies/npm/` holds the 11 original npm source distributions matching the
upstream lock, including unminified SingleFile core and vendor code. The adjacent
inventory records registry URLs, integrity values and SHA-256 hashes. Additional
preferred React, Bluebird and DOMPurify source releases and their own build
machinery are in `dependencies/preferred/`. React contains ReactDOM and scheduler.
Simple root-level JS packages are supplied in their original npm source form.
The Zotero-adapted webextension polyfill is in the Connector source archive.

`SOURCE_PROVENANCE.json` identifies exact inputs and archives. No Git credential,
local Git configuration, browser profile, Zotero library or captured article is
part of this release. Public upstream test fixtures remain as upstream source.

Project: https://github.com/BattleForever/zotero-connector-snapshot
'''

def package(base,upstream,dependencies,output):
    base,upstream,dependencies,output=map(lambda p:Path(p).resolve(),(base,upstream,dependencies,output))
    if output.exists():raise ValueError('Output already exists; use a new directory')
    output.mkdir(parents=True)
    result=build_ready(base,output/'ready-folder')
    ready=output/f'zotero-snapshot-v{VERSION}-ready.zip'
    source=output/f'zotero-snapshot-v{VERSION}-corresponding-source.zip'
    provenance={'version':VERSION,'project_commit':git(ROOT,'rev-parse','HEAD').decode().strip(),
        'upstream':{'repository':'https://github.com/zotero/zotero-connectors',
                    'tag':'5.0.217','commit':UPSTREAM_COMMIT,'submodules':MODULES},
        'project_files':{},'upstream_archives':{},'baseline_files':{},'dependencies':[]}
    with zipfile.ZipFile(ready,'x') as archive:
        for file in sorted((output/'ready-folder').rglob('*')):
            if file.is_file():put(archive,'zotero-snapshot/'+file.relative_to(output/'ready-folder').as_posix(),file.read_bytes())
    prefix='zotero-snapshot-source/'
    with zipfile.ZipFile(source,'x') as archive:
        for file in public_files():
            rel=file.relative_to(ROOT).as_posix()
            data=file.read_bytes()
            provenance['project_files'][rel]=hashlib.sha256(data).hexdigest()
            put(archive,prefix+'project/'+rel,data)
        lock=json.loads((ROOT/'baseline.lock.json').read_text(encoding='utf-8'))
        for rel,expected in lock['files'].items():
            if digest(base/rel)!=expected:raise ValueError('Changed baseline: '+rel)
            put(archive,prefix+'upstream-package/'+rel,(base/rel).read_bytes())
            provenance['baseline_files'][rel]=expected
        jobs=[('',UPSTREAM_COMMIT,'zotero-connectors-5.0.217.tar.gz')]
        jobs.extend((path,commit,path.split('/')[-1]+'-'+commit[:12]+'.tar.gz') for path,commit in MODULES.items())
        assembly=['#!/bin/sh','set -eu','cd "$(dirname "$0")"','mkdir -p zotero-connectors']
        for path,commit,name in jobs:
            print('Exporting upstream '+(path or 'Connector'),flush=True)
            data=source_archive(upstream,Path(path),commit)
            put(archive,prefix+'upstream/'+name,data)
            provenance['upstream_archives'][name]=hashlib.sha256(data).hexdigest()
            dest='zotero-connectors'+('/'+path if path else '')
            assembly.extend([f'mkdir -p "{dest}"',f'tar -xzf "{name}" -C "{dest}"'])
        put(archive,prefix+'upstream/assemble-upstream.sh',('\n'.join(assembly)+'\n').encode(),True)
        for index,folder,dest in [('npm-sources.json','npm-sources','npm'),('preferred-sources.json','preferred-sources','preferred')]:
            records=json.loads((dependencies/index).read_text(encoding='utf-8'))
            for record in records:
                data=(dependencies/folder/record['filename']).read_bytes()
                if hashlib.sha256(data).hexdigest()!=record['sha256']:raise ValueError('Dependency hash mismatch')
                if 'integrity' in record:
                    algo,expected=record['integrity'].split('-',1)
                    if base64.b64encode(hashlib.new(algo,data).digest()).decode()!=expected:raise ValueError('Dependency integrity mismatch')
                put(archive,prefix+'dependencies/'+dest+'/'+record['filename'],data)
                provenance['dependencies'].append(record)
            put(archive,prefix+'dependencies/'+index,(dependencies/index).read_bytes())
        put(archive,prefix+'REBUILD.md',REBUILD.format(version=VERSION).encode())
        put(archive,prefix+'SOURCE_PROVENANCE.json',(json.dumps(provenance,indent=2)+'\n').encode())
    sums=''.join(digest(path)+'  '+path.name+'\n' for path in (ready,source))
    (output/'SHA256SUMS.txt').write_text(sums,encoding='utf-8',newline='\n')
    receipt={'version':VERSION,'ready':{'name':ready.name,'sha256':digest(ready),'bytes':ready.stat().st_size},
             'source':{'name':source.name,'sha256':digest(source),'bytes':source.stat().st_size},
             'project_files':len(provenance['project_files']),'baseline_files':len(lock['files']),
             'upstream_source_archives':len(jobs),'dependency_archives':len(provenance['dependencies']),
             'runtime_logic_unchanged':result['runtime_code_unchanged']}
    (output/'packaging-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
    return receipt

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('base','upstream','dependencies','output'):parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    print(json.dumps(package(args.base,args.upstream,args.dependencies,args.output),indent=2))

if __name__=='__main__':main()
