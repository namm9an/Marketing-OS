#!/usr/bin/env python3
"""Repeat the complete offline phase gate, with logs and a machine-readable report.

Usage: .venv/bin/python tools/verify_phase.py F03 --output /tmp/f03-verification
Technical success does not approve a visual design or authorise deployment.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import xml.etree.ElementTree as ET


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('phase')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'(?:F(?:0[1-6]|0[89]|1[0-4])|F07[A-D])', args.phase):
        parser.error('Use an implementation phase ID such as F03 or F07A')
    root = Path(__file__).resolve().parents[1]
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    npm = shutil.which('npm.cmd' if os.name == 'nt' else 'npm')
    if not npm:
        parser.error('npm is required; install the project dependencies first')
    git = lambda *a: subprocess.check_output(['git', *a], cwd=root).decode().strip()
    diff = subprocess.check_output(['git', 'diff', 'HEAD'], cwd=root)
    report = {
        'phase': args.phase, 'started_at': datetime.now(timezone.utc).isoformat(),
        'commit': git('rev-parse', 'HEAD'), 'branch': git('branch', '--show-current'),
        'working_changes': git('status', '--porcelain').splitlines(),
        'tracked_diff_sha256': hashlib.sha256(diff).hexdigest(),
        'technical_status': 'running', 'visual_review': 'requires separate owner evidence',
        'paid_model_calls': 0, 'lanes': [],
        'security_scope': 'Application and pinned HTTP/1 parser; deployed HTTP/2/proxy/TLS checks are separate',
        'dependency_audit': 'Requires separate current scan/disposition; functional success is not advisory clearance',
    }
    changed_files = set(git('diff', '--name-only', 'HEAD').splitlines()) | set(
        git('ls-files', '--others', '--exclude-standard').splitlines())
    report['working_file_sha256'] = {
        name: hashlib.sha256((root/name).read_bytes()).hexdigest() if (root/name).is_file() else None
        for name in sorted(changed_files)
    }
    def save():
        (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    save()
    with tempfile.TemporaryDirectory(prefix='marketing-phase-') as temporary:
        env = {**os.environ, 'DB_PATH': str(Path(temporary)/'gate.db'),
               'ENVIRONMENT': 'test', 'GEMINI_API_KEY': '',
               'ADMIN_USER': 'admin', 'ADMIN_PASSWORD': 'marketing2026',
               'SESSION_COOKIE_SECURE': 'false', 'TRUST_FORWARDED_FOR': 'false'}
        lanes = [
            ('backend', [sys.executable, '-m', 'pytest', '-q', 'tests/unit', 'tests/integration',
                         f'--junitxml={output / "backend.xml"}'], root),
            ('frontend-unit', [npm, 'run', 'test:unit'], root/'frontend'),
            ('lint', [npm, 'run', 'lint'], root/'frontend'),
            ('build', [npm, 'run', 'build'], root/'frontend'),
            ('browser-development', [npm, 'run', 'test:integration'], root/'frontend'),
            ('browser-compiled', [npm, 'run', 'test:integration:built'], root/'frontend'),
        ]
        for name, command, cwd in lanes:
            started = time.monotonic()
            print(f'[{args.phase}] {name}', flush=True)
            with (output/f'{name}.log').open('w') as log:
                child = subprocess.Popen(command, cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT)
                code = child.wait()
            report['lanes'].append({'name': name, 'command': command, 'exit_code': code,
                                    'seconds': round(time.monotonic()-started, 2), 'log': f'{name}.log'})
            save()
            print(f'[{args.phase}] {name}: {"PASS" if code == 0 else "FAIL"} ({report["lanes"][-1]["seconds"]}s)', flush=True)
            if code:
                report['technical_status'] = 'fail'
                save()
                return code
    cases = ET.parse(output/'backend.xml').findall('.//testcase')
    report['api_contract_cases'] = [c.attrib['name'] for c in cases
        if c.attrib.get('name', '').startswith('test_every_api_has_a_healthy_contract')]
    report['security_cases'] = sum('phase_security' in c.attrib.get('classname', '')
        or 'http_framing' in c.attrib.get('classname', '')
        or 'regex_budget' in c.attrib.get('classname', '') for c in cases)
    report['technical_status'] = 'pass'
    report['finished_at'] = datetime.now(timezone.utc).isoformat()
    save()
    print('All technical lanes passed. Visual acceptance and deployment-layer checks remain separate.', flush=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
