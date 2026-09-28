# 本草知音 · 离线版

本项目为“本草知音设备版”的离线源码，包含 Next.js 网页、本地 Python 推理服务、舌象模型与部署说明。

## 开始使用

- 离线配置与模型说明：[offline/README.md](offline/README.md)
- 安装说明：[INSTALL.md](INSTALL.md)
- 电脑离线启动：`启动电脑离线版.ps1`
- Jetson 部署：`compose.offline.yaml`

需要提前安装 Node.js、Python 推理依赖，以及对应的 Ollama 程序和本地语言模型。仓库包含 `offline/tongue_model.pth`，不包含完整运行环境或 Ollama 模型，首次准备依赖需要联网。

本仓库未包含本机 `.env.local`、依赖缓存、构建产物和重复交付压缩包。云端模式配置示例见 `.env.example`；不要提交 API 密钥。

本项目用于学习与演示，模型输出不能代替专业诊疗。
