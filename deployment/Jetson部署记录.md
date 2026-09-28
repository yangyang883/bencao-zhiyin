# Jetson 部署记录

2026-09-21：设备本机服务已部署并运行；云端功能尚不可用，硬件尚未实测。

## 使用

在 Jetson 登录后，打开 http://127.0.0.1:3100/home 。地址只在设备本机有效。

- 设备：Jetson Nano，用户 jetson，直连地址 192.168.137.179。
- 部署目录：/home/jetson/bencao-device-20260921。
- Docker 镜像：bencao-device:20260921；容器：bencao-device。
- 端口：127.0.0.1:3100 映射容器 3000，未开放到局域网或公网。
- 恢复策略：unless-stopped；Docker 服务已启用开机启动，未实际重启设备验证。
- .env.local 已按用户明确授权通过 SSH 传输，权限 600，未写入镜像。
- 个人资料和报告存储于浏览器，固定使用同一浏览器和地址。

设备终端维护命令：

```sh
sudo docker logs --tail 100 bencao-device
sudo docker restart bencao-device
sudo docker stop bencao-device
sudo docker start bencao-device
```

## 验证结果

- Ubuntu 18.04.6、ARM64、内核 4.9.253-tegra、glibc 2.27；内存 3.9 GiB、交换空间 1.9 GiB。
- Docker 20.10.7；Node.js v22.23.2 ARM64 容器运行及异步 crypto 检查通过。
- 本地 npm test、npm run typecheck 通过；设备上完成 npm ci 和生产构建，未复制 Windows node_modules 或 .next。
- 首页、咨询、知识库、报告、舌象、个人中心、设备检测、编辑资料、隐私、体质页面及 /api/device 均返回 HTTP 200。
- 首页引用的 13 个静态资源全部 HTTP 200。
- /api/device 确认已读取配置，未输出密钥。
- 设备 Chromium 99 独立浏览器已加载首页文字和功能入口，截图：工作区 .deploy-jetson/bencao-home-live.png。

## 网络修复

原 DHCP 每约 45 秒超时并重新连接，导致 SSH/VNC 反复失联。保留原 Wired connection 1 配置，新增 bencao-direct：192.168.137.179/24，网关 192.168.137.1，自动连接优先级 20。适用于当前电脑网线直连环境。

切回 DHCP 时在设备终端运行：

```sh
sudo nmcli connection modify bencao-direct connection.autoconnect no
sudo nmcli connection up 'Wired connection 1'
```

依赖下载临时通过电脑代理和 SSH 隧道完成，项目本机运行不依赖该隧道。临时 Docker 代理文件在设备重启后已不存在。

## 限制与待验收

- 云端连通测试实际返回 fetch failed。设备独立外网仍未打通，在线问答、舌象分析和云端语音尚未成功验收，云端账户额度也未重新确认。
- Chromium 99 低于 Tailwind 4 官方支持版本：基本页面可显示，部分渐变、透明度和图标效果有兼容差异，尚未升级浏览器。
- VNC 曾停在 Jetson 登录界面，需要用户自行登录，未绕过认证。真实桌面完整交互、摄像头、麦克风和扬声器尚未完整验收。
