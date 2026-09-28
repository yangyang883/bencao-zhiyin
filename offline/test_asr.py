import base64
import io
import json
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch
import wave
import asr


def audio(frames=16000, channels=1, rate=16000):
    output = io.BytesIO()
    with wave.open(output, 'wb') as wav:
        wav.setnchannels(channels)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(b'\0\0' * frames * channels)
    return 'data:audio/wav;base64,' + base64.b64encode(output.getvalue()).decode('ascii')


class ASRTests(unittest.TestCase):
    def test_audio_contract(self):
        self.assertEqual(len(asr.read_pcm(audio())), 32000)
        self.assertEqual(len(asr.read_pcm(audio(960000))), 1920000)
        for value in [None, 'https://example.com/audio', 'data:audio/wav;base64,@@',
                      audio(0), audio(960001), audio(channels=2), audio(rate=8000)]:
            with self.assertRaises(ValueError):
                asr.read_pcm(value)
        raw = base64.b64decode(audio().partition(',')[2])[:-8]
        with self.assertRaises(ValueError):
            asr.read_pcm('data:audio/wav;base64,' + base64.b64encode(raw).decode())

    def test_missing_model(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict('os.environ', {'BENCAO_ASR_MODEL': folder}):
            with self.assertRaises(asr.ASRUnavailable):
                asr.recognize(audio())

    def test_segments_and_silence(self):
        class Recognizer:
            def __init__(self, model, rate):
                self.count = 0
            def AcceptWaveform(self, pcm):
                self.count += 1
                return self.count == 1
            def Result(self):
                return json.dumps({'text': '今天'})
            def FinalResult(self):
                return json.dumps({'text': '口干'})
        mock = types.SimpleNamespace(Model=lambda path: object(), KaldiRecognizer=Recognizer, SetLogLevel=lambda level: None)
        with tempfile.TemporaryDirectory() as folder, patch.dict('os.environ', {'BENCAO_ASR_MODEL': folder}), patch.dict('sys.modules', {'vosk': mock}), patch.object(asr, '_model', None):
            target = Path(folder) / 'am'
            target.mkdir()
            (target / 'final.mdl').touch()
            self.assertEqual(asr.recognize(audio())['text'], '今天 口干')
            with patch.object(Recognizer, 'Result', return_value='{"text":""}'), patch.object(Recognizer, 'FinalResult', return_value='{"text":""}'):
                self.assertEqual(asr.recognize(audio())['text'], '')


if __name__ == '__main__':
    unittest.main()
