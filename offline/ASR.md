# 离线语音识别接口

已实现接口与输入检查，尚未安装Vosk/中文模型，也未进行真人录音或Jetson速度验收。

## 准备一次，之后离线使用

1. 在运行 `offline/server.py` 的Python环境安装 `vosk`：`python -m pip install vosk`。Jetson需使用与系统Python、ARM64和glibc匹配的发行包；安装成功不等于实机验收完成。不要替换原有torch环境。
2. 从官方模型页面 https://alphacephei.com/vosk/models 下载中文小模型 `vosk-model-small-cn-0.22`，保留其许可文件，解压到 `offline/models/vosk-model-small-cn-0.22/`。确保其中存在 `am/final.mdl` 等完整模型文件，而不是再套一层同名目录。
3. 也可以在Python服务的环境变量中设置 `BENCAO_ASR_MODEL` 为解压后的绝对目录。systemd启动时应在服务配置中设置，终端设置不会自动传给已有服务。
4. 重启Python服务。网页代码更新后执行 `npm run build` 并重启网页服务，离线模式为 `BENCAO_MODE=offline`。

安装与下载需要联网；推理只读取明确指定的本地模型目录，不自动下载，不调用阿里云。官方安装说明：https://alphacephei.com/vosk/install 。

## 接口

前端继续调用 `POST /api/speech/recognize`，JSON：`{"audio":"data:audio/wav;base64,..."}`。离线时转发到 `http://127.0.0.1:8765/recognize`。

要求16kHz、单声道、16位PCM WAV，非空且最长60秒。现有录音转换函数已输出该格式。建议设备展示先录5—10秒短句；本机请求45秒超时，长音频在低性能设备上可能超时。

成功返回 `{"text":"识别文字","source":"local-vosk","needs_confirmation":true}`。先让用户核对文字，再发送或用于症状确认，尤其“没有疼痛”等否定词。不要自动把识别文字变成确认的病情。

400：格式或时长错误；413：请求过大；422：未识别到文字；503：依赖/模型缺失、模型损坏或服务超时。失败不回退云端。

`GET http://127.0.0.1:8765/health` 增加 `asr`：`installed`仅表示能找到Python模块；`model_present`仅检查关键模型文件；`loaded`表示该进程已成功加载模型。前两项不是可用性或准确率保证。

模型首次请求时加载并缓存；当前Python服务串行处理，识别可能暂时阻塞拍照和播报。需要实际测内存及延迟后再决定是否拆分服务。浏览器取消请求不保证已开始的Python识别立即停止。

## 验证与交接

`python offline/test_asr.py` 检查音频格式、60秒边界、截断、模型缺失及模拟识别分段/空结果。`npm test` 检查本地路由、状态透传及失败不调用云端。模拟测试不代表真实语音识别成功。

组员四准备中文模型后，测试普通话短句、静音、噪声、否定句及录音文字修改。组员一负责Jetson依赖、麦克风、内存和断网运行验收。本次没有下载模型、修改设备或增加语音识别准确率承诺。
