"""Local Vosk adapter. No automatic model downloads; Python 3.6 compatible."""
import base64
import binascii
import importlib.util
import io
import json
import os
from pathlib import Path
import wave

_model = None


class ASRUnavailable(RuntimeError):
    pass


def model_path():
    return Path(os.environ.get('BENCAO_ASR_MODEL', str(Path(__file__).resolve().parent / 'models' / 'vosk-model-small-cn-0.22')))


def status():
    return {'engine': 'vosk', 'installed': importlib.util.find_spec('vosk') is not None,
            'model_present': (model_path() / 'am' / 'final.mdl').is_file(),
            'loaded': _model is not None}


def read_pcm(value):
    if not isinstance(value, str) or len(value) > 3000000 or not value.startswith('data:audio/wav;base64,'):
        raise ValueError('需要60秒以内的16kHz单声道16位PCM WAV录音')
    try:
        raw = base64.b64decode(value.partition(',')[2], validate=True)
        with wave.open(io.BytesIO(raw), 'rb') as wav:
            if (wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getcomptype()) != (1, 2, 16000, 'NONE'):
                raise ValueError('录音必须为16kHz单声道16位PCM WAV')
            frames = wav.getnframes()
            if not 0 < frames <= 16000 * 60:
                raise ValueError('录音不能为空，且不得超过60秒')
            pcm = wav.readframes(frames)
            if len(pcm) != frames * 2:
                raise ValueError('录音文件不完整，请重新录制')
            return pcm
    except (binascii.Error, wave.Error, EOFError):
        raise ValueError('录音格式损坏，请重新录制')


def recognize(value):
    global _model
    pcm = read_pcm(value)
    if not (model_path() / 'am' / 'final.mdl').is_file():
        raise ASRUnavailable('未准备本地中文语音模型，请配置BENCAO_ASR_MODEL；不会调用云端')
    try:
        from vosk import Model, KaldiRecognizer, SetLogLevel
        SetLogLevel(-1)
        if _model is None:
            _model = Model(str(model_path()))
        recognizer = KaldiRecognizer(_model, 16000)
        parts = []
        for offset in range(0, len(pcm), 8000):
            if recognizer.AcceptWaveform(pcm[offset:offset + 8000]):
                parts.append(json.loads(recognizer.Result()).get('text', ''))
        parts.append(json.loads(recognizer.FinalResult()).get('text', ''))
        text = ' '.join(part.strip() for part in parts if part.strip())
        return {'text': text, 'source': 'local-vosk', 'needs_confirmation': True}
    except ImportError:
        raise ASRUnavailable('未安装Vosk离线识别依赖，请按offline/ASR.md配置')
    except Exception:
        raise ASRUnavailable('本地语音模型加载或识别失败，请检查模型完整性和运行环境')
