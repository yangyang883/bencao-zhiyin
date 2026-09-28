import { cloudJSON, chatURL } from '@/lib/cloud'
import { isOffline, localService } from '@/lib/offline'
async function offlineStatus() {
  const [health, tags] = await Promise.all([
    localService('/health', undefined, AbortSignal.timeout(5000)).then(r => r.json()).catch(() => null),
    fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(5000), redirect: 'error', cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).catch(() => null),
  ])
  const names = new Set((Array.isArray(tags?.models) ? tags.models : []).map((m: { name: string }) => m.name))
  const baseReady = health?.ok === true
  const visionInstalled = names.has('qwen3-vl:2b')
  return { mode: 'offline', configured: baseReady, speech: health?.speech === true,
    capabilities: { baseReady, visionInstalled, chatInstalled: names.has('qwen3:0.6b') },
    models: { chat: names.has('qwen3:0.6b') ? '本地通义已安装（需实际问答验收）' : '本地知识库问答',
      vision: `八项识别：${visionInstalled ? '模型已安装，需实际图片验收' : '缺少视觉模型'}；三分类：${baseReady ? '已就绪' : '未就绪'}`,
      asr: '未启用，请使用文字输入', tts: health?.speech ? '本地中文语音已安装，需试听' : '本地语音服务未就绪' } }
}
export async function GET() {
  if (isOffline()) {
    return Response.json(await offlineStatus(), { headers: { 'Cache-Control': 'no-store' } })
  }
  return Response.json({ configured: Boolean(process.env.DASHSCOPE_API_KEY), models: {
    chat: process.env.DASHSCOPE_CHAT_MODEL || 'qwen-plus', vision: process.env.DASHSCOPE_VISION_MODEL || 'qwen-vl-plus',
    asr: process.env.DASHSCOPE_ASR_MODEL || 'qwen3-asr-flash', tts: process.env.DASHSCOPE_TTS_MODEL || 'qwen3-tts-flash',
  } }, { headers: { 'Cache-Control': 'no-store' } })
}
export async function POST(req: Request) {
  try {
    if (isOffline()) {
      const status = await offlineStatus()
      return Response.json({ ok: status.configured && status.capabilities.visionInstalled,
        message: Object.values(status.models).join('；') }, { status: status.configured ? 200 : 503 })
    }
    await cloudJSON(chatURL, { model: process.env.DASHSCOPE_CHAT_MODEL || 'qwen-plus', messages: [{ role: 'user', content: '连通性检查，请回复 OK' }], max_tokens: 8 }, req.signal)
    return Response.json({ ok: true, message: '在线问答模型连接成功；图片和语音模型需分别测试' })
  } catch (error) { return Response.json({ ok: false, message: error instanceof Error ? error.message : '连接失败' }, { status: 503 }) }
}
