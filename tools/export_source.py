# SPDX-License-Identifier: AGPL-3.0-or-later
"""Export only reviewed source paths, never a local build or user evidence."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = {'README.md', 'LICENSE', 'NOTICE', '.gitignore', '.gitattributes',
              'baseline.lock.json', 'CHANGELOG.md', 'CONTRIBUTING.md', 'PRIVACY.md', 'SECURITY.md'}
SOURCE_DIRS = {'src': {'.js'}, 'tools': {'.py'}, 'tests': {'.py', '.cjs'},
               'docs': {'.md'}, 'config': {'.txt'}, 'assets': {'.png','.svg','.html'},
               'licenses': {'.txt','.json'}}
FIXTURES = ('tests/live_extension.html', 'tests/live_extension.js', 'tests/browser_capture.html', 'tests/browser_capture.js', 'tests/csp_browser.html', 'tests/csp_browser.js', 'tests/snapshot_rendering.html', 'tests/snapshot_rendering.js', 'tests/singlefile_base_browser.html', 'tests/singlefile_base_browser.js')


def public_files():
    files = [ROOT / name for name in sorted(ROOT_FILES)]
    files.extend(ROOT / name for name in FIXTURES)
    for directory, extensions in SOURCE_DIRS.items():
        # Deliberately only direct children: no nested caches or test output.
        files.extend(p for p in sorted((ROOT / directory).iterdir())
                     if p.is_file() and not p.is_symlink() and p.suffix in extensions)
    return sorted(files)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist/zotero-connector-snapshot-0.2.0-rc.12-project-source.zip')
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    hashes = {}
    # Reproducible metadata, no local source path or machine timestamps.
    with zipfile.ZipFile(args.output, 'x', zipfile.ZIP_DEFLATED) as archive:
        for file in public_files():
            data = file.read_bytes()
            rel = file.relative_to(ROOT).as_posix()
            hashes[rel] = hashlib.sha256(data).hexdigest()
            info = zipfile.ZipInfo('zotero-connector-snapshot/' + rel, date_time=(2026, 10, 26, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, data)
    args.output.with_suffix('.sha256.json').write_text(json.dumps({
        'archive_sha256': hashlib.sha256(args.output.read_bytes()).hexdigest(),
        'files': hashes}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'files':len(hashes),'sha256':hashlib.sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
