"""Real local API smoke test, not a medical accuracy evaluation."""
import base64
import io
import json
from pathlib import Path
import time
import urllib.error
import urllib.request
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent
blank = io.BytesIO()
Image.new('RGB', (256, 256), 'white').save(blank, format='PNG')
shapes = Image.new('RGB', (256, 256), 'white')
draw = ImageDraw.Draw(shapes)
draw.rectangle((10, 10, 120, 120), fill='blue')
draw.ellipse((130, 130, 245, 245), fill='green')
buffer = io.BytesIO()
shapes.save(buffer, format='PNG')
cases = [('sample2', (root / 'samples/sample2.jpg').read_bytes(), 'jpeg', 200),
         ('sample3', (root / 'samples/sample3.jpg').read_bytes(), 'jpeg', 200),
         ('blank', blank.getvalue(), 'png', 503), ('shapes', buffer.getvalue(), 'png', 503)]
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
results = []
for name, photo, mime, expected in cases:
    started = time.time()
    request = urllib.request.Request('http://127.0.0.1:3100/api/tongue-fine',
        data=json.dumps({'image': 'data:image/' + mime + ';base64,' + base64.b64encode(photo).decode()}).encode(),
        headers={'Content-Type': 'application/json'})
    try:
        with opener.open(request, timeout=170) as response:
            status, data = response.status, json.load(response)
    except urllib.error.HTTPError as error:
        status, data = error.code, json.load(error)
    if status == 200:
        assert data['source'] == 'local-qwen-vl' and len(data['details']) == 8
    results.append({'case': name, 'status': status, 'expected_status': expected,
                    'passed': status == expected, 'seconds': round(time.time() - started, 2), 'result': data})
    print(name, status, results[-1]['seconds'], flush=True)
target = root.parent / 'deployment/离线验收' / ('fine-check-' + str(int(time.time())) + '.json')
target.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
assert all(row['passed'] for row in results), 'See generated report for failed cases'
print('PASS: API completion and rejection checks; classification accuracy NOT evaluated')
