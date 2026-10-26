# SPDX-License-Identifier: AGPL-3.0-or-later
"""Build an offline customization from an explicitly supplied official package."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import uuid

from patch_connector import apply

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_output(output, original_manifest):
    manifest = json.loads((output / 'manifest.json').read_text(encoding='utf-8'))
    for field in ('permissions', 'host_permissions', 'optional_permissions', 'content_security_policy', 'sandbox'):
        if manifest.get(field) != original_manifest.get(field):
            raise ValueError('Unexpected change to ' + field)
    paths = [manifest['background']['service_worker'], manifest['options_ui']['page']]
    for entry in manifest['content_scripts']:
        paths.extend(entry.get('js', []))
        paths.extend(entry.get('css', []))
    for entry in manifest['web_accessible_resources']:
        paths.extend(p for p in entry['resources'] if '*' not in p)
    paths.extend(manifest['icons'].values())
    paths.extend(manifest['action']['default_icon'].values())
    paths.extend(entry['path'] for entry in manifest['declarative_net_request']['rule_resources'])
    for rel in paths:
        # This unused developer fixture is absent in the original store package.
        if rel == 'test/data/journalArticle-single.html':
            continue
        if not (output / rel).is_file():
            raise ValueError('Missing manifest resource: ' + rel)
    if 'key' in manifest or 'update_url' in manifest:
        raise ValueError('Store identity must not be inherited')
    return manifest


def build(base, output):
    base, output = Path(base).resolve(), Path(output).resolve()
    if not base.is_dir():
        raise ValueError('Base must be an extracted official Connector directory')
    if output.exists():
        raise ValueError('Output already exists; use a new directory')
    if base == output or base in output.parents or output in base.parents:
        raise ValueError('Base and output must not contain one another')
    manifest = json.loads((base / 'manifest.json').read_text(encoding='utf-8'))
    lock = json.loads((ROOT / 'baseline.lock.json').read_text(encoding='utf-8'))
    if manifest['version'] != lock['version']:
        raise ValueError('Unsupported Connector version; expected ' + lock['version'])
    # Validate every allowlisted input before creating output. Ignore unlisted files.
    for rel, expected in lock['files'].items():
        path = base / rel
        if path.is_symlink() or not path.is_file() or digest(path) != expected:
            raise ValueError('Base file differs from supported package: ' + rel)
        if '..' in Path(rel).parts or Path(rel).is_absolute():
            raise ValueError('Unsafe lock path')
    output.parent.mkdir(parents=True, exist_ok=True)
    # Preserve failed staging directories for diagnosis; inherit normal Windows ACLs.
    staging = output.parent / ('.connector-build-' + uuid.uuid4().hex)
    if staging.resolve().parent != output.parent:
        raise ValueError('Unexpected staging location')
    staging.mkdir()
    try:
        for rel in lock['files']:
            target = staging / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(base / rel, target)
        apply(base, staging, manifest)
        custom = verify_output(staging, manifest)
        hashes = {p.relative_to(staging).as_posix(): digest(p)
                  for p in sorted(staging.rglob('*')) if p.is_file()}
        # Re-check after patching to catch any source change during the build.
        if any(digest(base / rel) != expected for rel, expected in lock['files'].items()):
            raise ValueError('Base changed during build')
        # Both absolute locations are checked above; rename stays within output.parent.
        staging.rename(output)
    except Exception as error:
        raise ValueError('Build failed; staging retained at ' + staging.name + ': ' + str(error)) from error
    return {'project': 'Zotero Connector Snapshot', 'version': custom['version_name'],
            'manifest_version': custom['version'], 'base_version': lock['version'],
            'permissions_expanded': False, 'files': hashes}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True, type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'build/extension')
    args = parser.parse_args()
    try:
        result = build(args.base, args.output)
    except (ValueError, OSError, KeyError) as error:
        parser.exit(1, str(error) + '\n')
    receipt = args.output.resolve().parent / (args.output.name + '_receipt.json')
    receipt.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in result.items() if key != 'files'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
