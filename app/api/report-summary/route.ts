import { z } from 'zod'

export const maxDuration = 60
export async function POST(req: Request) {
  const parsed = z.object({ class_name: z.enum(['黑舌', '紫舌', '白舌']), confidence: z.number().min(0).max(1) }).safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: '缺少有效的模型分类和分数' }, { status: 400 })
  try {
    const facts = `本地模型输出${parsed.data.class_name}类别，模型分数${(parsed.data.confidence * 100).toFixed(1)}%。这不是医学准确率，不能用于诊断。`
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, redirect: 'error',
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(40000)]),
      body: JSON.stringify({ model: 'qwen3:0.6b', stream: false, think: false, keep_alive: 0,
        messages: [
          { role: 'system', content: '你只做文字整理。不得添加病因、体质、疾病、药物或治疗建议。用中文一句话说明给定事实，不改数字和类别。/no_think' },
          { role: 'user', content: `事实：${facts} 请用一句话解释。/no_think` },
        ], options: { num_ctx: 1024, num_predict: 96, num_thread: 4, temperature: 0 },
      }),
    })
    if (!response.ok) throw new Error()
    const data = await response.json()
    const text = data.message?.content?.trim()
    if (typeof text !== 'string' || !text || text.length > 1000 || text.includes('<think>') || data.done_reason === 'length') throw new Error()
    return Response.json({ text, source: 'local-qwen3-0.6b' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: '本地通义说明暂不可用或超时，原始分类和报告仍可使用' }, { status: 503 })
  }
}
