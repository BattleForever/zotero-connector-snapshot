# SPDX-License-Identifier: AGPL-3.0-or-later
"""Offline build and original-save regression; needs the locked official package."""
from pathlib import Path
import argparse
import json
import shutil
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from build import build, digest


def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', type=Path, required=True)
    args = parser.parse_args()
    base = args.base.resolve()
    test_root = ROOT / 'build' / ('checks-' + uuid.uuid4().hex)
    test_root.mkdir(parents=True)
    first = build(base, test_root / 'first')
    second = build(base, test_root / 'second')
    assert first['files'] == second['files'], 'Two builds must have identical files'
    for file in ['ui/ProgressWindow.js', 'progressWindow/progressWindow.js',
                 'inject/progressWindow_inject.js', 'ui/tree/tree.js']:
        assert digest(base / file) == digest(test_root / 'first' / file)
    try:
        build(base, test_root / 'first')
    except ValueError as error:
        assert 'already exists' in str(error)
    else:
        raise AssertionError('Existing output was overwritten')
    wrong = test_root / 'wrong-version'
    wrong.mkdir()
    (wrong / 'manifest.json').write_text('{"version":"0.0.0"}', encoding='utf-8')
    try:
        build(wrong, test_root / 'should-not-exist')
    except ValueError as error:
        assert 'Unsupported Connector version' in str(error)
    else:
        raise AssertionError('Unsupported version accepted')
    assert not (test_root / 'should-not-exist').exists()
    # Clone into the retained test area; never modify the supplied base.
    altered = test_root / 'extra-input'
    shutil.copytree(base, altered, ignore=shutil.ignore_patterns('_metadata'))
    (altered / 'unexpected-local-bridge.js').write_text('private fixture; must not be copied', encoding='utf-8')
    build(altered, test_root / 'filtered')
    assert not (test_root / 'filtered/unexpected-local-bridge.js').exists()
    (altered / 'itemSaver.js').write_text('// changed package', encoding='utf-8')
    try:
        build(altered, test_root / 'changed-should-not-exist')
    except ValueError as error:
        assert 'Base file differs' in str(error)
    else:
        raise AssertionError('Changed input accepted')
    assert not (test_root / 'changed-should-not-exist').exists()
    run('node', 'tests/naming.cjs')
    run('node', 'tests/save_boundary.cjs', str(test_root / 'first'))
    run('node', 'tests/feature_parity.cjs', str(test_root / 'first'), str(base))
    run('node', 'tests/injection_guard.cjs', str(test_root / 'first'))
    for file in ('itemSaver.js', 'singlefile.js', 'background.js', 'background-worker.js',
                 'inject/inject.js', 'inject/pageSaving.js', 'local-startup-probe.js'):
        run('node', '--check', str(test_root / 'first' / file))
    result = {'pass': True, 'deterministic_build': True, 'source_unchanged': True,
              'permissions_expanded': False, 'original_picker_unchanged': True,
              'extra_input_excluded': True, 'wrong_version_rejected': True,
              'changed_base_rejected': True, 'existing_output_protected': True,
              'live_browser_acceptance': 'PENDING_USER_REVIEW'}
    (test_root / 'checks_results.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
