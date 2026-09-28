import { cloudJSON, chatURL } from '@/lib/cloud'
import { isOffline } from '@/lib/offline'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (typeof body?.audio !== 'string' || body.audio.length > 3_000_000 || !/^data:audio\/wav;base64,[A-Za-z0-9+/]+=*$/.test(body.audio)) {
    return Response.json({ error: '请录制不超过 60 秒的语音' }, { status: 400 })
  }
  try {
    if (isOffline()) {
      const response = await fetch('http://127.0.0.1:8765/recognize', {
        method:'POST',redirect:'error',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({audio:body.audio}),signal:AbortSignal.any([req.signal,AbortSignal.timeout(45000)]),
      })
      const data = await response.json()
      if (!response.ok) return Response.json({error:typeof data.error === 'string' ? data.error : '本地语音识别暂不可用'},
        {status:[400,413,422,503].includes(response.status) ? response.status : 503,headers:{'Cache-Control':'no-store'}})
      if (typeof data.text !== 'string' || !data.text.trim()) return Response.json({error:'没有识别到语音，请重新录制'},{status:422})
      if (data.text.length > 12000) throw new Error('本地语音返回内容过长')
      return Response.json({text:data.text.trim(),source:'local-vosk',needs_confirmation:true},{headers:{'Cache-Control':'no-store'}})
    }
    const data = await cloudJSON(chatURL, {
      model: process.env.DASHSCOPE_ASR_MODEL || 'qwen3-asr-flash',
      messages: [{ role: 'user', content: [{ type: 'input_audio', input_audio: { data: body.audio } }] }],
      stream: false, asr_options: { enable_itn: true },
    }, req.signal)
    const text = data.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim()) return Response.json({ error: '没有识别到语音，请重新录制' }, { status: 422 })
    return Response.json({ text }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (req.signal.aborted) return new Response(null,{status:499})
    if (isOffline()) return Response.json({error:'本地语音识别失败或超时，请检查离线服务；建议分段录制短句，不会调用云端'},{status:503})
    return Response.json({ error: error instanceof Error ? error.message : '语音识别失败' }, { status: 503 })
  }
}
