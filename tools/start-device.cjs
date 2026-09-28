const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
process.chdir(root)
if (!fs.existsSync('.next/standalone/server.js')) {
  console.error('请先执行 npm run build')
  process.exit(1)
}
// cpSync crashes in this Windows Node runtime; copying individual files works.
for (const [source, destination] of [['.next/static', '.next/standalone/.next/static'], ['public', '.next/standalone/public']]) {
  fs.mkdirSync(destination, { recursive: true })
  for (const name of fs.readdirSync(source, { recursive: true })) {
    const input = path.join(source, name), output = path.join(destination, name)
    if (fs.statSync(input).isDirectory()) fs.mkdirSync(output, { recursive: true })
    else { fs.mkdirSync(path.dirname(output), { recursive: true }); fs.copyFileSync(input, output) }
  }
}
if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local')
process.env.NODE_ENV = 'production'
process.env.HOSTNAME = process.env.DEVICE_HOST || '127.0.0.1'
process.env.PORT = process.env.DEVICE_PORT || '3100'
require(path.join(root, '.next/standalone/server.js'))
