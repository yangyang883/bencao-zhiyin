# 本草知音离线版

默认模式为offline。照片分析使用本机ResNet18，问答使用本机Qwen3-0.6B并附带本地知识参考；本地模型失败时匹配知识库。动态中文播报使用本地中文语音。可选的结果文字说明也调用本机Qwen3-0.6B。离线请求失败不会切换阿里云。

## 功能边界

- 原项目模型只分黑舌、紫舌、白舌；按原配置保留标签顺序。不能识别舌形、独立舌苔或体质，也不能识别输入是否为舌头。所有图片都会分入三个类别之一。
- 模型分数不是医学准确率；三个自带样本成功不等于通过准确率验证。
- 结果页显示原始模型信息并保存确定格式的报告。可选按钮“用本地通义解释结果”生成一句文字说明，生成文本需人工核对，不改原始分类、不写入原始报告。
- Qwen缺失或超时会让聊天退回本地知识库，并让可选说明按钮返回失败提示。小型通义模型可能答错，不能作为诊断依据。
- 语音识别未实现离线版，使用文字输入；不向云端发送录音。
- 本地中文播报音质取决于已有中文语音。Jetson上已有espeak-ng cmn，音质偏机械，需要现场试听。
- 浏览器识别不到IMX219排线摄像头时，可用“使用设备排线摄像头拍照”按钮调用本机采集。当前为单次拍照，没有实时预览或自动亮度、模糊度验收；请人工检查照片。

## Jetson运行结构

- 网页：http://127.0.0.1:3100/home
- 本地模型和语音服务：http://127.0.0.1:8765，仅监听回环。
- 本地通义：Ollama http://127.0.0.1:11434，使用现有qwen3:0.6b，不自动下载模型。
- 服务目录：/home/jetson/bencao-offline-20260924
- 网页源码：/home/jetson/bencao-device-offline-20260924
- 网页容器使用host网络访问本机Python和Ollama，并以HOSTNAME=127.0.0.1限制网页只在本机访问。

设备已有Python 3.6、torch 1.9.0、torchvision 0.10.0、Pillow、GPU支持和espeak-ng。复用此环境，不要直接照旧版requirements.txt升级全部依赖。模型在本机加载，不下载预训练权重。

开发时先运行`python3 offline/server.py`，再在另一个终端运行`npm run dev`。Windows需要兼容的PyTorch环境和本地语音工具，缺少这些时仍可执行前端检查，但不能据此宣称推理和播报可用。

在Jetson上，systemd服务文件见bencao-offline.service；本机拍照通过BENCAO_CSI=1开启。启动命令：

```sh
sudo systemctl start bencao-offline
sudo docker start bencao-device
```

独立安装时，在确认路径和用户名后安装服务文件。网页可按项目Dockerfile正常构建，然后使用compose.offline.yaml的host网络和离线环境配置；初次安装基础镜像和依赖可能需要联网，运行展示不需要。

Dockerfile.cached-build专用于当前Jetson旧依赖缓存。使用前必须比对缓存与新源码package-lock.json的SHA256，依赖改变时不能继续复用。该缓存不是本源码包的一部分。

## 验证

2026-09-24 已在 Jetson 上部署：网页容器 `bencao-device` 使用镜像 `bencao-device:offline-20260924`，本地服务 `bencao-offline` 已启用自启动。当前选择 CPU 推理：实测比本设备上的 GPU 首次推理更稳定，三个样本在预热后约 0.35–1.3 秒完成。通义文字说明约 13–37 秒，作为可选功能使用。

已通过前端测试、类型检查、生产构建、Python 输入测试和实机接口测试。临时移除设备 IPv4/IPv6 默认路由后，拍照、三张样本分析、本地知识问答、语音文件生成和通义说明仍成功；测试保留了电脑与设备之间的局域网连接，并非拔掉网线测试。记录见 deployment/离线验收。

尚需人工验收：真实舌头拍摄质量、页面保存报告后刷新、音箱实际声音、设备重启和连续十次完整操作。语音文件生成成功不代表音箱已经试听通过。

```sh
npm test
npm run typecheck
npm run build
cd offline
python3 test_server.py
```

自动测试验证默认离线、无云端回退、本地接口、报告边界和失败提示。实机验收还需：拍照、分析、报告保存/刷新、播放声音、可选通义说明，以及断开外网后的完整演示。

## 模型文件

tongue_model.pth复制自项目已有权重，约45MB。仅加载可信的项目权重，接口不接受用户上传模型文件。本源码包不附带Ollama程序和Qwen权重；当前Jetson已有这两项。复制到另一台机器时，需要提前准备这些运行依赖，不能把源码包当作整机镜像。

通义调用参数依据：https://docs.ollama.com/api/chat 。模型出处：https://huggingface.co/Qwen/Qwen3-0.6B-GGUF 。设备实际使用已安装的Ollama Q4_K_M版本。
