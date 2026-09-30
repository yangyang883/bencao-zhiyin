"""Exercise the real local HTTP chain; never send photos outside localhost."""
import argparse
import base64
import datetime
import io
import json
from pathlib import Path
import time
import urllib.error
import urllib.request
import wave

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=3100, choices=[3100, 3101])
parser.add_argument('--samples', default='.')
parser.add_argument('--camera', action='store_true')
parser.add_argument('--core-only', action='store_true', help='Skip Qwen and WAV speech when not installed on the PC')
args = parser.parse_args()
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
results = []


def request(path, body=None):
    started = time.time()
    req = urllib.request.Request('http://127.0.0.1:%d%s' % (args.port, path),
                                 data=None if body is None else json.dumps(body).encode('utf-8'),
                                 headers={'Content-Type': 'application/json'})
    with opener.open(req, timeout=55) as response:
        value = response.read()
        headers = dict(response.headers)
    results.append({'path': path, 'seconds': round(time.time() - started, 3), 'bytes': len(value)})
    return value, headers


try:
    config = json.loads(request('/api/device')[0])
    assert config['mode'] == 'offline' and config['configured']
    for n in [1, 2, 3]:
        photo = (Path(args.samples) / ('sample%d.jpg' % n)).read_bytes()
        result = json.loads(request('/api/tongue-analysis', {'image': 'data:image/jpeg;base64,' + base64.b64encode(photo).decode()})[0])
        assert result['source'] in ('local-resnet18', 'local-yolov8n')
        if result['source'] == 'local-yolov8n':
            assert isinstance(result['detections'], list)
            assert all(0 <= item['model_score'] <= 1 for item in result['detections'])
            results[-1]['detections'] = result['detections']
        else:
            assert 0 <= result['confidence'] <= 1
            results[-1]['class_name'] = result['class_name']
            results[-1]['confidence'] = result['confidence']
    if not args.core_only:
        if result['source'] == 'local-resnet18':
            summary = json.loads(request('/api/report-summary', {'class_name': result['class_name'], 'confidence': result['confidence']})[0])
            assert summary['source'] == 'local-qwen3-0.6b' and summary['text']
            results[-1]['text'] = summary['text']
        sound = request('/api/speech/synthesize', {'text': '本草知音离线语音测试。结果仅供模型演示。'})[0]
        with wave.open(io.BytesIO(sound)) as audio:
            assert audio.getnframes() > 1000 and audio.getframerate() > 0
            results[-1]['audio_seconds'] = round(audio.getnframes() / audio.getframerate(), 2)
    reply, headers = request('/api/chat', {'messages': [{'role': 'user', 'content': '失眠'}]})
    assert '本地知识库'.encode() in reply or '本地通义生成'.encode() in reply
    assert json.loads(request('/api/knowledge-graph?action=stats')[0])
    if args.camera:
        photo = json.loads(request('/api/camera/capture', {})[0])['image']
        assert base64.b64decode(photo.split(',', 1)[1]).startswith(b'\xff\xd8')
    try:
        request('/api/tongue-analysis', {'image': 'data:image/png;base64,aGVsbG8='})
        raise AssertionError('Invalid image accepted')
    except urllib.error.HTTPError as error:
        assert error.code == 503
    try:
        request('/api/speech/recognize', {'audio': 'data:audio/wav;base64,aGVsbG8='})
        raise AssertionError('Invalid WAV was accepted')
    except urllib.error.HTTPError as error:
        assert error.code == 400
    print('PASS: local image analysis, knowledge and failure handling' + ('; Qwen and WAV speech SKIPPED' if args.core_only else '; Qwen and WAV speech passed'))
finally:
    target = Path('offline-check-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S') + '.json')
    target.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(str(target.resolve()))
