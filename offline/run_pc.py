"""Windows launcher: load optree before torch to avoid this PC's DLL conflict."""
import importlib.util
import runpy
import sys
from pathlib import Path

if sys.platform == 'win32' and importlib.util.find_spec('optree'):
    import optree

root = Path(__file__).resolve().parent
sys.path.insert(0, str(root))
target = 'test_server.py' if '--test' in sys.argv else 'server.py'
sys.argv = [str(root / target)]
runpy.run_path(sys.argv[0], run_name='__main__')
