# 本草知音设备版

当前工作版默认使用离线模式，见 `offline/README.md`。下文云端配置仅适用于显式设置 `BENCAO_MODE=cloud` 的旧云端模式。Jetson离线部署使用 `compose.offline.yaml`，需要先启动宿主机本地模型服务；不使用下面旧的Docker桥接网络配置。

本文件夹是独立项目。原项目位于上一级目录；新版默认端口为 3100，不与原版 3000 冲突。

## 本地启动

安装 Node.js 22 或以上，在本文件夹打开终端：

```powershell
npm ci
npm run build
npm start
```

打开 http://127.0.0.1:3100/home 。Windows 可双击“启动设备版.cmd”。修改代码后重新构建再启动；开发调试用 npm run dev。
生产启动脚本会准备静态资源并运行 standalone 服务。Ctrl+C 停止。

## 云端配置

首次部署时复制 .env.example 为 .env.local，填写 DASHSCOPE_API_KEY。当前工作副本沿用了原项目的本机配置，密钥不会显示在页面中。

- 文字咨询：DASHSCOPE_CHAT_MODEL，默认 qwen-plus。
- 图片分析：DASHSCOPE_VISION_MODEL，默认 qwen-vl-plus。
- 语音识别：DASHSCOPE_ASR_MODEL，默认 qwen3-asr-flash。
- 云端播报：DASHSCOPE_TTS_MODEL，默认 qwen3-tts-flash；音色默认为 Cherry。
- 若账户使用工作空间专属域名，可设置 DASHSCOPE_CHAT_URL 和 DASHSCOPE_TTS_URL。

账户需要有对应模型权限和可用额度。Arrearage 表示账户欠费或状态异常；更换或恢复账户后在“我的 → 设备检测”重新检查。不要把 .env.local 发给他人或放进公开仓库。

## 已接通的程序流程

- 舌象：摄像头采集或图片上传 → 视觉模型分析 → 本机报告 → 语音播报。失败显示实际错误，不生成随机报告。
- 语音：点击录音 → 最长 60 秒 → 转为 16kHz 单声道 WAV → 云端识别 → 可修改文字 → 确认发送。
- 咨询：支持多轮文本与语音输入、回复自动播报/停止、咨询报告保存。在线失败时明确标记本地知识库参考。
- 播报：优先用设备本地中文语音；没有可用中文音色时使用云端合成。浏览器若阻止自动播放，请点击播报按钮。
- 资料、问卷结果、健康报告、知识收藏、日历打卡、消息提醒设置均使用本机真实数据。
- 数据与隐私：导出 JSON 备份、确认后清空本机数据、选择是否保存后续舌象照片。照片默认不留存。
- 报告可导出为文本文件；通知仅在程序打开时显示，不是后台系统推送。
- 设备检测页分别检查摄像头采集、录音识别、中文播报、在线模型和设备列表。

## 部署方式

### 设备本机运行

在目标系统安装 Node.js 22+，将源码复制到设备，执行 npm ci、npm run build、npm start，再在设备浏览器打开 http://127.0.0.1:3100/home 。
不要直接复制 Windows 的 node_modules 或 .next 到 Linux/ARM 设备；必须在目标平台或匹配的平台构建。
摄像头和麦克风由设备浏览器访问，不是由 Node.js 服务直接操作。
此版本采用点击录音，不包含唤醒词、持续监听或完全离线大模型。

### Docker（可选）

本机装好 Docker 后：

```sh
docker compose up --build -d
```

服务映射到 127.0.0.1:3100，密钥从 .env.local 注入，不写进镜像。镜像在目标架构上构建。
Docker 配置已提供，本次没有 Docker/ARM 实机运行环境，尚未实测镜像。

### 网络与权限

默认仅监听本机回环地址。这是单用户设备程序，未实现公网账户鉴权或多人隔离，不应直接暴露到互联网。
从别的设备访问时需要另行配置可信 HTTPS 和访问控制；普通局域网 HTTP 地址通常不能使用摄像头/麦克风。
浏览器需保留站点数据，避免无痕模式。固定使用同一个地址、端口和浏览器，localhost 与 127.0.0.1 的本机数据彼此独立。
开机启动、全屏 kiosk、驱动和默认音频设备设置须在明确设备系统后适配。

## 验证

```sh
npm run typecheck
npm test
npm run build
```

自动测试使用模拟云端响应验证音频编码、分段、消息协议、图像传递、账户错误处理和本机存储；通过不代表云端账户或真实硬件可用。
验收记录见“验收记录.md”。

接口依据：
- https://help.aliyun.com/en/model-studio/qwen-asr-api-reference
- https://help.aliyun.com/en/model-studio/qwen-tts-api
- https://help.aliyun.com/zh/model-studio/qwen-vl-compatible-with-openai
- https://nextjs.org/docs/app/guides/self-hosting
