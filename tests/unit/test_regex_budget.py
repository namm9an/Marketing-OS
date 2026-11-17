"""Probe bounded near-matches in an isolated process with a hard time budget."""
import subprocess
import sys


def test_near_match_prompt_patterns_complete_within_a_bounded_process():
    code = '''
from app.core.security import detect_prompt_injection
seeds = ['ignore ' + ' ' * 3980 + 'x', 'reveal ' + 'private ' * 498,
         'bypass ' + 'safety ' * 560, 'а' * 3999]
for _ in range(10):
    for value in seeds:
        detect_prompt_injection(value[:4000])
'''
    result = subprocess.run([sys.executable, '-c', code], capture_output=True, timeout=8)
    assert result.returncode == 0, result.stderr.decode(errors='replace')
