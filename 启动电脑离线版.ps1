$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:BENCAO_MODE = 'offline'
$env:BENCAO_MODEL_DEVICE = 'cpu'
$ollamaRoot = Join-Path (Split-Path $PSScriptRoot -Parent) '.local-model'
if ((Test-Path "$ollamaRoot/ollama/ollama.exe") -and -not (Get-NetTCPConnection -State Listen -LocalPort 11434 -ErrorAction SilentlyContinue)) {
    $env:OLLAMA_HOST = '127.0.0.1:11434'
    $env:OLLAMA_MODELS = Join-Path $ollamaRoot 'models'
    $env:OLLAMA_NO_CLOUD = '1'
    Start-Process -FilePath "$ollamaRoot/ollama/ollama.exe" -ArgumentList 'serve' -WindowStyle Hidden -RedirectStandardOutput "$ollamaRoot/serve.stdout.log" -RedirectStandardError "$ollamaRoot/serve.stderr.log"
}
$pythonExe = (Get-Command python).Source
$nodeExe = (Get-Command node).Source
if (-not (Test-Path 'node_modules/next/dist/bin/next')) { throw '请先安装项目 Node 依赖。' }
if (-not (Get-NetTCPConnection -State Listen -LocalPort 8765 -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $pythonExe -ArgumentList 'offline/run_pc.py' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput 'offline/pc-server.stdout.log' -RedirectStandardError 'offline/pc-server.stderr.log'
}
if (-not (Get-NetTCPConnection -State Listen -LocalPort 3100 -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $nodeExe -ArgumentList 'node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3100' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput 'offline/pc-web.stdout.log' -RedirectStandardError 'offline/pc-web.stderr.log'
}
Write-Host '打开 http://127.0.0.1:3100/home；在设备检测页确认本地模型已就绪。启动日志在 offline/pc-*.log。'
