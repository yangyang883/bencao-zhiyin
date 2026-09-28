"""Local-only inference and Mandarin speech, compatible with Jetson Python 3.6."""
import base64
import binascii
import io
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import traceback
from http.server import BaseHTTPRequestHandler, HTTPServer
from asr import recognize, status as asr_status, ASRUnavailable

import torch
from torchvision import models, transforms
from PIL import Image, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parent
CLASSES = ['黑舌', '紫舌', '白舌']
Image.MAX_IMAGE_PIXELS = 20000000


def read_image(value):
    if not isinstance(value, str) or len(value) > 14000000:
        raise ValueError('请提供10MB以内的图片')
    header, separator, encoded = value.partition(',')
    if not separator or header not in ['data:image/jpeg;base64', 'data:image/png;base64', 'data:image/webp;base64']:
        raise ValueError('仅支持JPG、PNG、WebP图片')
    try:
        image = Image.open(io.BytesIO(base64.b64decode(encoded, validate=True)))
        if image.format not in ('JPEG', 'PNG', 'WEBP') or image.width * image.height > 20000000:
            raise ValueError()
        image = ImageOps.exif_transpose(image).convert('RGB')
        image.load()
    except (ValueError, OSError, binascii.Error, Image.DecompressionBombError):
        raise ValueError('图片无法解码或尺寸过大，请重新拍摄')
    if min(image.size) < 64:
        raise ValueError('图片尺寸太小，请重新拍摄')
    return image


def make_report(probabilities):
    if len(probabilities) != 3 or not all(math.isfinite(p) and 0 <= p <= 1 for p in probabilities):
        raise ValueError('模型输出无效')
    label = max(range(3), key=lambda i: probabilities[i])
    score = probabilities[label]
    ordered = sorted(probabilities, reverse=True)
    # Engineering abstention rule, not a clinically calibrated threshold.
    uncertain = score < 0.7 or ordered[0] - ordered[1] < 0.15
    notice = '仅为三分类模型的演示输出，模型会将任何图片分到这三类之一；不能判断是否为舌头，也不能作健康诊断。'
    return {
        'tongueColor': '三分类结果不确定，请用细分类或人工复核' if uncertain else '模型分类：' + CLASSES[label],
        'tongueShape': '本模型未识别舌形', 'coating': '本模型未独立识别舌苔',
        'constitution': '未评估，不能由本模型确定体质',
        'suggestions': ['请先确认输入为清晰的舌象照片。', '结果只供模型演示，如有不适请咨询专业医师。'],
        'details': [
            {'category': '模型结果', 'status': '结果不确定' if uncertain else '仅供演示', 'description': ('三个类别无法可靠区分，不把最高分当作确定结论。' if uncertain else '') + 'ResNet18最高分候选：%s；模型分数：%.1f%%。该分数不是医学准确率。' % (CLASSES[label], score * 100)},
            {'category': '三类分数', 'status': '模型输出', 'description': '；'.join('%s %.1f%%' % (n, p * 100) for n, p in zip(CLASSES, probabilities))},
            {'category': '使用范围', 'status': '未作诊断', 'description': notice},
        ],
        'source': 'local-resnet18', 'class_name': CLASSES[label], 'confidence': score,
    }


def check_visual_input(value):
    image = read_image(value)
    # Only rejects almost uniform frames; this is not a tongue detector.
    if max(ImageStat.Stat(image.resize((128, 128))).stddev) < 3:
        raise ValueError('图片接近纯色或没有可辨细节，请重新拍摄')
    return {'ok': True}


def load_model():
    torch.set_num_threads(2)
    # Nano's CUDA context consumed ~2.5GB in testing; CPU leaves room for the UI and Qwen.
    device = torch.device(os.environ.get('BENCAO_MODEL_DEVICE', 'cpu'))
    model = models.resnet18(pretrained=False)
    model.fc = torch.nn.Linear(model.fc.in_features, 3)
    # Only load the project's trusted local checkpoint; never accept weight uploads.
    model.load_state_dict(torch.load(str(ROOT / 'tongue_model.pth'), map_location='cpu'))
    model.to(device).eval()
    transform = transforms.Compose([transforms.Resize((224, 224)), transforms.ToTensor(),
                                    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])
    with torch.no_grad():
        model(torch.zeros(1, 3, 224, 224).to(device)).cpu()
    return model, device, transform


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    def send(self, status, value, mime='application/json'):
        payload = json.dumps(value, ensure_ascii=False).encode('utf-8') if mime == 'application/json' else value
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(payload)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path != '/health':
            self.send(404, {'error': '接口不存在'})
            return
        self.send(200, {'ok': True, 'model': 'ResNet18三分类', 'classes': CLASSES,
                        'device': str(self.server.device), 'speech': bool(shutil.which('espeak-ng')),
                        'asr': asr_status(), 'mode': 'offline'})

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 14001000:
                self.send(413, {'error': '请求为空或过大'})
                return
            if self.headers.get_content_type() != 'application/json':
                self.send(415, {'error': '需要JSON请求'})
                return
            data = json.loads(self.rfile.read(length).decode('utf-8'))
            if not isinstance(data, dict):
                raise ValueError('无效请求')
            if self.path == '/quality':
                self.send(200, check_visual_input(data.get('image')))
            elif self.path == '/analyze':
                image = read_image(data.get('image'))
                tensor = self.server.transform(image).unsqueeze(0).to(self.server.device)
                with torch.no_grad():
                    probabilities = torch.softmax(self.server.model(tensor), dim=1)[0].cpu().tolist()
                self.send(200, make_report(probabilities))
            elif self.path == '/capture':
                if os.environ.get('BENCAO_CSI') != '1':
                    self.send(503, {'error': '此设备未启用排线摄像头，请使用上传图片'})
                    return
                with tempfile.TemporaryDirectory(prefix='bencao-camera-') as folder:
                    target = os.path.join(folder, 'capture.jpg')
                    subprocess.run(['gst-launch-1.0', '-q', 'nvarguscamerasrc', 'num-buffers=1', '!',
                                    'video/x-raw(memory:NVMM),width=1280,height=720,framerate=30/1', '!',
                                    'nvvidconv', '!', 'video/x-raw,format=I420', '!', 'jpegenc', '!',
                                    'filesink', 'location=' + target], stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, timeout=25, check=True)
                    encoded = 'data:image/jpeg;base64,' + base64.b64encode(Path(target).read_bytes()).decode('ascii')
                    read_image(encoded)
                    self.send(200, {'image': encoded})
            elif self.path == '/recognize':
                result = recognize(data.get('audio'))
                self.send(200, result) if result['text'] else self.send(422, {'error': '没有识别到语音，请靠近麦克风重新录制'})
            elif self.path == '/speech':
                text = data.get('text')
                if not isinstance(text, str) or not text.strip() or len(text) > 500:
                    raise ValueError('每段播报需要1至500个字符')
                with tempfile.TemporaryDirectory(prefix='bencao-speech-') as folder:
                    target = os.path.join(folder, 'speech.wav')
                    subprocess.run(['espeak-ng', '-v', 'cmn', '-s', '150', '-w', target, '--stdin'],
                                   input=text.encode('utf-8'), stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   timeout=25, check=True)
                    self.send(200, Path(target).read_bytes(), 'audio/wav')
            else:
                self.send(404, {'error': '接口不存在'})
        except ASRUnavailable as error:
            self.send(503, {'error': str(error)})
        except (ValueError, UnicodeError) as error:
            self.send(400, {'error': str(error)})
        except Exception:
            traceback.print_exc()
            self.send(503, {'error': '本地推理或语音服务失败，请检查模型和中文语音安装；不会调用云端'})


if __name__ == '__main__':
    model, device, transform = load_model()
    # Single request at a time bounds Jetson memory usage; no network dependencies.
    server = HTTPServer(('127.0.0.1', 8765), Handler)
    server.model, server.device, server.transform = model, device, transform
    print('Offline service ready on 127.0.0.1:8765 (' + str(device) + ')', flush=True)
    server.serve_forever()
