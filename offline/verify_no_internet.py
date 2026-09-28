"""Jetson only: temporarily remove default routes, test locally, restore in finally.

Run as root while connected over the directly attached LAN, not over a routed SSH link.
"""
import json
from pathlib import Path
import shlex
import signal
import subprocess
import sys

if len(sys.argv) != 2 or sys.argv[1] not in ('3100', '3101'):
    raise SystemExit('Usage: sudo python3 verify_no_internet.py 3101')


def interrupted(signum, frame):
    raise SystemExit('Interrupted; restoring default routes')


for signum in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
    signal.signal(signum, interrupted)

saved = []
removed = []
result = {'test_exit': None, 'routes_restored': False}
for family in ('-4', '-6'):
    routes = subprocess.check_output(['ip', family, 'route', 'show', 'default']).decode().splitlines()
    saved.extend((family, line) for line in routes if line.strip())

try:
    for family, line in saved:
        subprocess.check_call(['ip', family, 'route', 'del'] + shlex.split(line))
        removed.append((family, line))
    result['during_test_default_routes'] = {
        family: subprocess.check_output(['ip', family, 'route', 'show', 'default']).decode().strip()
        for family in ('-4', '-6')
    }
    assert not any(result['during_test_default_routes'].values())
    check = subprocess.run([sys.executable, 'check_runtime.py', '--port', sys.argv[1], '--camera'], timeout=180)
    result['test_exit'] = check.returncode
    result['after_test_default_routes'] = {
        family: subprocess.check_output(['ip', family, 'route', 'show', 'default']).decode().strip()
        for family in ('-4', '-6')
    }
    assert not any(result['after_test_default_routes'].values()), 'Default route reappeared during test'
finally:
    errors = []
    for family, line in removed:
        current = subprocess.check_output(['ip', family, 'route', 'show', 'default']).decode().splitlines()
        if line not in current:
            restored = subprocess.run(['ip', family, 'route', 'add'] + shlex.split(line))
            if restored.returncode:
                errors.append(line)
    result['routes_restored'] = not errors
    result['restore_errors'] = errors
    Path('no-internet-check.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False))

if result['test_exit'] != 0 or not result['routes_restored']:
    raise SystemExit(1)
