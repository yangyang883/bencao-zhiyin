# 安装与运行

## 当前树莓派 5 部署

已经验证的设备目录是 `/home/pi/bencao-device`：`web/` 放 Linux ARM64 的 Next.js standalone 构建产物，`offline/` 放 Python 服务、`models/tongue-yolov8n.onnx` 和样例。`offline/bencao-pi-model.service`、`offline/bencao-pi-web.service` 是对应的 systemd 单元，安装前确认其绝对路径与实际部署目录一致。服务仅监听本机。

在准备好的树莓派上可检查：

```sh
sudo systemctl status bencao-pi-model bencao-pi-web
curl http://127.0.0.1:8765/health
curl http://127.0.0.1:3100/api/device
```

设备浏览器打开 `http://127.0.0.1:3100/home/tongue`。现有实测中 Firefox 可用；Chromium 在该设备上曾持续加载，未作为验收浏览器。

## 从源码准备新设备

在与目标设备匹配的 Linux ARM64 环境安装 Node.js 22+ 与 Python 3、Pillow、NumPy、OpenCV，并确保摄像头命令 `rpicam-still` 可用。执行 `npm ci && npm run build`，将 `.next/standalone/` 的内容连同 `.next/static/` 和 `public/` 复制到 `/home/pi/bencao-device/web/`，将 `offline/` 复制到 `/home/pi/bencao-device/offline/`。安装并启用上述两个 systemd 单元前，确认 Python 依赖与模型文件在目标机上完整可用。完整从空白系统卡重建尚未验收，勿将这份说明视为一键安装包。

源码检查：`npm test`、`npm run typecheck`、`npm run build`。断网实机静音检查见 [offline/README.md](offline/README.md)。
