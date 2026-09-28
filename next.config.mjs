import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('.', import.meta.url))
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: root,
  turbopack: { root },
  images: { unoptimized: true },
}
export default nextConfig
