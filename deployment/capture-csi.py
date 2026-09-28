#!/usr/bin/env python3
"""Jetson IMX219 capture helper. Saves locally; never uploads images."""
import datetime
import os
import pathlib
import subprocess
import tempfile


def main():
    folder = pathlib.Path.home() / "Pictures" / "bencao"
    folder.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".capture-", suffix=".jpg", dir=str(folder))
    os.close(fd)
    try:
        command = ["gst-launch-1.0", "-q", "nvarguscamerasrc", "num-buffers=1", "!",
                   "video/x-raw(memory:NVMM),width=1280,height=720,framerate=30/1", "!",
                   "nvvidconv", "!", "video/x-raw,format=I420", "!", "jpegenc", "!",
                   "filesink", "location=" + temporary]
        subprocess.run(command, check=True, timeout=25)
        with open(temporary, "rb") as image:
            if image.read(2) != b"\xff\xd8":
                raise RuntimeError("未取得有效照片，请检查摄像头连接")
        name = datetime.datetime.now().strftime("tongue-%Y%m%d-%H%M%S-%f.jpg")
        target = folder / name
        os.rename(temporary, str(target))
        print("照片已保存：" + str(target))
        print("在本草知音舌象页面选择上传图片，再选择此照片。请先检查是否清晰。")
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print("拍照失败：" + str(error))
        raise SystemExit(1)
