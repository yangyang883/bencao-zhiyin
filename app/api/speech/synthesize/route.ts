import { cloudJSON, ttsURL } from '@/lib/cloud'
import { isOffline, localService } from '@/lib/offline'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (typeof body?.text !== 'string' || !body.text.trim() || body.text.length > 500) {
    return Response.json({ error: '每段播报需要 1 至 500 个字符' }, { status: 400 })
  }
  try {
    if (isOffline()) {
      const audio = await localService('/speech', { text: body.text }, req.signal)
      return new Response(audio.body, { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' } })
    }
    const data = await cloudJSON(ttsURL, {
      model: process.env.DASHSCOPE_TTS_MODEL || 'qwen3-tts-flash',
      input: { text: body.text, voice: process.env.DASHSCOPE_TTS_VOICE || 'Cherry', language_type: 'Chinese' },
    }, req.signal)
    const url = new URL(data.output?.audio?.url)
    if (!url.hostname.endsWith('.aliyuncs.com') || !['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('语音服务返回了无效音频地址')
    url.protocol = 'https:'
    const audio = await fetch(url, { signal: AbortSignal.any([req.signal, AbortSignal.timeout(20000)]), redirect: 'error' })
    if (!audio.ok) throw new Error('无法下载合成语音')
    return new Response(audio.body, { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' } })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : '语音播报失败' }, { status: 503 })
  }
}
