// 四人共用的工作入口；不连接或修改 Jetson。
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const readline = require('node:readline/promises')

const root = path.resolve(__dirname, '..')
const output = path.join(root, '团队成果')
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-')
const sourcePaths = [
  'app', 'components', 'hooks', 'lib', 'public', 'styles', 'tools',
  'package.json', 'package-lock.json', 'tsconfig.json', 'next-env.d.ts',
  'next.config.mjs', 'postcss.config.mjs', 'components.json',
  'Dockerfile', 'compose.yaml', '.dockerignore', '.env.example',
  'INSTALL.md', 'start-device.sh', '启动电脑离线版.ps1', 'deployment', 'offline', 'compose.offline.yaml',
]

function runNpm(task, capture = false) {
  // Windows npm.cmd 需要 shell；task 只取本脚本中的固定值。
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', task], {
    cwd: root, shell: process.platform === 'win32',
    stdio: capture ? 'pipe' : 'inherit', encoding: 'utf8',
  })
  if (result.error) throw result.error
  return result
}

function deviceChecklist() {
  fs.mkdirSync(output, { recursive: true })
  const file = path.join(output, '设备检查清单.md')
  if (!fs.existsSync(file)) fs.writeFileSync(file, `# 组员一 设备检查

每完成一项再打勾；本脚本不会自动检查或控制硬件。

- [ ] 在 Jetson 本机打开 http://127.0.0.1:3100/home
- [ ] 在“我的 → 设备检测”中检查摄像头、麦克风、播报和在线模型
- [ ] 拍一张照片，完成分析、显示结果和语音播报
- [ ] 关闭拍照/录音界面后，摄像头和麦克风不再占用
- [ ] 重启设备后，确认程序仍可使用
- [ ] 与软件组员联调实体按钮、补光灯和距离提示（目前尚未接入）
- [ ] 连续使用 10 次，记录每次结果

日期：
操作者：
设备问题：
交给软件组员的问题：

硬件接入前，请记录 ESP32 型号、通信方式、引脚和传感器型号。
`, 'utf8')
  console.log(`检查清单：${file}\n请由保管设备的组员在设备上逐项操作。已有记录不会覆盖。`)
}

function startSoftware() {
  if (!fs.existsSync(path.join(root, 'node_modules', 'next'))) {
    throw new Error('尚未安装依赖。请在设备版目录运行 npm ci，再重试。')
  }
  console.log('组员二：启动电脑开发版，打开 http://127.0.0.1:3100/home；按 Ctrl+C 停止。')
  const result = runNpm('dev')
  process.exitCode = result.status ?? 1
}

function testSoftware() {
  fs.mkdirSync(output, { recursive: true })
  const report = path.join(output, `软件测试-${stamp()}.txt`)
  fs.writeFileSync(report, `测试时间：${new Date().toISOString()}\n项目：${root}\n`, 'utf8')
  let failed = false
  for (const task of ['typecheck', 'test', 'build']) {
    console.log(`正在执行 ${task}…`)
    const result = runNpm(task, true)
    const passed = result.status === 0
    failed ||= !passed
    fs.appendFileSync(report, `\n=== ${task}: ${passed ? '通过' : '失败'} ===\n${result.stdout || ''}${result.stderr || ''}`)
    console.log(`${task}：${passed ? '通过' : '失败'}`)
  }
  const manual = path.join(output, '人工测试记录.md')
  if (!fs.existsSync(manual)) fs.writeFileSync(manual, `# 组员三 人工测试记录

自动测试通过不代表摄像头、云端服务或硬件可用。
先在自己的电脑上测试页面，再预约设备集中测试。

| 日期 | 版本 | 操作步骤 | 预期结果 | 实际结果 | 是否通过 | 交给谁修复 | 复测结果 |
|---|---|---|---|---|---|---|---|
| | | 上传照片并分析 | 生成真实结果，失败时明确提示 | | | | |
| | | 拒绝摄像头权限 | 显示提示，仍可上传图片 | | | | |
| | | 断网后分析 | 提示失败，不编造结果 | | | | |
| | | 播报时离开页面 | 停止播报 | | | | |

设备上另做连续 10 次完整操作，以及至少 20 组普通拍摄与固定采集的配对测试。
`, 'utf8')
  console.log(`测试日志：${report}\n人工记录：${manual}`)
  process.exitCode = failed ? 1 : 0
}

function packageSource() {
  fs.mkdirSync(output, { recursive: true })
  const file = path.join(output, `本草知音源码-${stamp()}.tar.gz`)
  const included = sourcePaths.filter(name => fs.existsSync(path.join(root, name)))
  // 只归档明确列出的源码；个人配置、依赖、构建缓存和测试日志不进入交付包。
  const result = spawnSync('tar', ['-czf', file, '--exclude=.env.local', '--exclude=.env',
    '--exclude=.env.*.local', '--exclude=node_modules', '--exclude=.next', '--exclude=*.log',
    ...included], { cwd: root, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error('打包失败，请查看上方错误；不要交付未完成的压缩包。')
  console.log(`组员四：源码包已生成：${file}`)
  console.log('另外准备项目说明、PPT、演示视频和答辩稿。此包不含密钥、个人数据或设备系统，也不会修改“已部署内容”。')
}

async function main() {
  let action = process.argv[2]
  if (!action) {
    console.log('四人协作入口\n1 组员一：生成设备检查清单\n2 组员二：启动程序\n3 组员三：运行测试并生成记录\n4 组员四：打包当前源码\n0 退出')
    const input = readline.createInterface({ input: process.stdin, output: process.stdout })
    try { action = (await input.question('输入编号：')).trim() } finally { input.close() }
  }
  const actions = { '1': deviceChecklist, '2': startSoftware, '3': testSoftware, '4': packageSource }
  if (action === '0') return
  if (!actions[action]) throw new Error('请输入 1、2、3、4 或 0。例如：node tools/team.cjs 1')
  actions[action]()
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
