# 本地推理服务

当前树莓派 5 以 `BENCAO_MODE=offline` 运行网页，以 `BENCAO_CSI=1` 运行 Python 模型服务。`server.py` 默认加载 `models/tongue-yolov8n.onnx`；有 `onnxruntime` 时优先使用，否则使用 OpenCV DNN。摄像头由 `rpicam-still` 采集。网页和模型服务分别绑定 `127.0.0.1:3100`、`127.0.0.1:8765`。

已实机验证：照片采集、三张样例的本地舌象推理、规则建议、故障处理和断网运行。舌象模型输出仅是十类外观候选；弱类别与未检出项需要人工复核。

尚未整机验收：本地千问文字/视觉模型、Vosk 麦克风输入、`espeak-ng` 音箱播报、在线千问失败后的自动切换。Hailo-8L 已被设备识别，但当前舌象 ONNX 模型运行在 CPU 上，未转换为 Hailo HEF。

静音验收可在网页服务运行后执行：

```sh
python3 offline/check_runtime.py --core-only --camera --samples offline/samples
```

此命令检查本地 HTTP 链路和摄像头，不播放音频，也不验证千问或真实麦克风/音箱。测试会在当前目录生成 `offline-check-*.json` 记录。只有另行完成实机测试，才可宣称离线语音和问答已可用。
