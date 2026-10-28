# SPDX-License-Identifier: AGPL-3.0-or-later
"""Build the beginner ready-to-load folder. Runtime logic is identical to tested rc.9."""
from pathlib import Path
import argparse
import json
import shutil

from build import ROOT,build,digest,verify_output

VERSION='0.2.0-rc.10'
NUMERIC_VERSION='5.0.217.12'
SOURCE_URL='https://github.com/BattleForever/zotero-connector-snapshot/releases/download/v'+VERSION+'/zotero-snapshot-v'+VERSION+'-corresponding-source.zip'

def build_ready(base,output):
    output=Path(output).resolve()
    if output.exists():raise ValueError('Output already exists; use a new directory')
    if Path(base).resolve() in output.parents:raise ValueError('Output must not be inside the baseline')
    output.mkdir(parents=True)
    core=build(base,output/'extension')
    path=output/'extension/manifest.json'
    manifest=json.loads(path.read_text(encoding='utf-8'))
    original=json.loads((Path(base)/'manifest.json').read_text(encoding='utf-8'))
    manifest.update(name='网页快照助手 · 适用于 Zotero Connector',short_name='网页快照助手',version=NUMERIC_VERSION,
        version_name=VERSION+' (Connector 5.0.217)',
        description='适用于 Zotero Connector 的非官方助手：保存 PDF 和当前网页快照，保留文库、分类及标签功能。')
    manifest['action']['default_title']=manifest['name']
    path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    for size in (16,32,64,128):shutil.copy2(ROOT/'assets'/f'snapshot-{size}.png',output/'extension'/f'Icon-{size}.png')
    verify_output(output/'extension',original)
    html=(ROOT/'assets/quickstart.html').read_text(encoding='utf-8').replace('@@VERSION@@',VERSION).replace('@@SOURCE_URL@@',SOURCE_URL)
    (output/'先看这里.html').write_text(html,encoding='utf-8',newline='\n')
    shutil.copy2(ROOT/'docs/QUICK_START.md',output/'快速上手.txt')
    licenses=output/'LICENSES';licenses.mkdir()
    shutil.copy2(ROOT/'LICENSE',licenses/'AGPL-3.0.txt')
    shutil.copy2(ROOT/'NOTICE',licenses/'PROJECT-NOTICE.txt')
    for source in sorted((ROOT/'licenses').glob('*')):
        if source.is_file():shutil.copy2(source,licenses/source.name)
    (licenses/'SOURCE-OFFER.txt').write_text('Complete corresponding source for this exact package is available at no charge:\n'+SOURCE_URL+'\n\nThe package and source archives are published together.\n',encoding='utf-8')
    allowed_changes={'manifest.json',*(f'Icon-{size}.png' for size in (16,32,64,128))}
    changed={rel for rel,sha in core['files'].items() if digest(output/'extension'/rel)!=sha}
    if changed!=allowed_changes:raise ValueError('Unexpected runtime logic change: '+repr(changed))
    receipt={'version':VERSION,'numeric_version':NUMERIC_VERSION,'runtime_core':'0.2.0-rc.9',
        'runtime_code_unchanged':True,'changed_extension_files':sorted(changed),'source_url':SOURCE_URL,
        'files':{p.relative_to(output).as_posix():digest(p) for p in sorted(output.rglob('*')) if p.is_file()}}
    (output/'文件校验.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return receipt

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    try:result=build_ready(args.base,args.output)
    except (ValueError,OSError) as error:parser.exit(1,str(error)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='files'},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
