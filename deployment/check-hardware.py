#!/usr/bin/env python3
"""Run on Jetson: python3 check-hardware.py. Read-only except the JSON report."""
import datetime
import glob
import json
import os
import platform
import subprocess
import sys
import urllib.request


def command(args):
    try:
        result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                universal_newlines=True, timeout=12)
        return {"ok": result.returncode == 0, "exit_code": result.returncode,
                "output": result.stdout.strip(), "error": result.stderr.strip()}
    except (OSError, subprocess.TimeoutExpired) as error:
        return {"ok": False, "error": str(error)}


def http_check(route):
    try:
        # Local service checks must not go through a system proxy.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open("http://127.0.0.1:3100" + route, timeout=12) as response:
            result = {"ok": response.status == 200, "status": response.status}
            if route == "/api/device":
                data = json.loads(response.read(65536).decode("utf-8"))
                result["api_key_configured"] = data.get("configured") is True
            return result
    except Exception as error:
        return {"ok": False, "error": str(error)}


def self_test():
    from unittest.mock import patch, MagicMock
    with patch("subprocess.run", return_value=subprocess.CompletedProcess([], 0, "ready\n", "")):
        assert command(["example"]) == {"ok": True, "exit_code": 0, "output": "ready", "error": ""}
    with patch("subprocess.run", return_value=subprocess.CompletedProcess([], 1, "", "denied")):
        assert command(["example"])["ok"] is False
    with patch("subprocess.run", side_effect=subprocess.TimeoutExpired("example", 12)):
        assert command(["example"])["ok"] is False
    with patch("subprocess.run", side_effect=FileNotFoundError("missing")):
        assert command(["example"])["ok"] is False
    response = MagicMock()
    response.__enter__.return_value = response
    response.status = 200
    response.read.return_value = b'{"configured":true,"secret":"not-for-report"}'
    with patch("urllib.request.build_opener") as opener:
        opener.return_value.open.return_value = response
        result = http_check("/api/device")
        assert result == {"ok": True, "status": 200, "api_key_configured": True}
        response.read.return_value = b'not json'
        assert http_check("/api/device")["ok"] is False
        opener.return_value.open.side_effect = OSError("offline")
        assert http_check("/home")["ok"] is False
    print("Self-test passed: command outcomes, HTTP results, invalid JSON and connection failure.")


def main():
    if sys.argv[1:] == ["--self-test"]:
        self_test()
        return
    if platform.system() != "Linux":
        raise SystemExit("请把此脚本放到 Jetson 上，用 python3 check-hardware.py 运行。")
    checks = {}
    container_command = ["docker", "inspect", "--format",
                         "{{.State.Status}} restart={{.HostConfig.RestartPolicy.Name}}", "bencao-device"]
    commands = [
        ("system", ["uname", "-a"]),
        ("usb_devices", ["lsusb"]),
        ("microphones", ["arecord", "-l"]),
        ("speakers", ["aplay", "-l"]),
        ("network_routes", ["ip", "route"]),
        ("docker_service", ["systemctl", "is-active", "docker"]),
        ("docker_autostart", ["systemctl", "is-enabled", "docker"]),
        ("container", container_command),
        ("browser", ["chromium-browser", "--version"]),
    ]
    for name, args in commands:
        print("Checking " + name + "...", flush=True)
        checks[name] = command(args)
    if not checks["container"]["ok"]:
        # No password prompt; record failure if passwordless sudo is unavailable.
        checks["container_with_sudo"] = command(["sudo", "-n"] + container_command)
    for route in ["/home", "/home/tongue", "/home/profile/device", "/api/device"]:
        print("Checking " + route + "...", flush=True)
        checks[route] = http_check(route)
    checks["video_nodes"] = sorted(glob.glob("/dev/video*"))
    checks["serial_nodes"] = sorted(glob.glob("/dev/ttyUSB*") + glob.glob("/dev/ttyACM*"))
    report = {
        "time": datetime.datetime.now().isoformat(), "checks": checks,
        "not_verified": ["实际拍照", "录音内容和扬声器声音", "真实模型分析", "实体按钮、补光和测距",
                         "完整业务连续运行10次", "重启后的恢复"],
        "note": "设备节点存在不代表外设工作正常；API配置存在不代表云端可用。脚本不调用付费模型、不拍照录音、不修改系统。",
    }
    filename = "设备自检-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f") + ".json"
    with open(filename, "x", encoding="utf-8") as file:
        json.dump(report, file, ensure_ascii=False, indent=2)
    print("报告已保存：" + os.path.abspath(filename))
    print(report["note"])


if __name__ == "__main__":
    main()
