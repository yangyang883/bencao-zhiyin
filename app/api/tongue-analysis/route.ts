import { tongueTerminologyContext } from '@/lib/knowledge-graph/tongue-terms'
import { chatURL } from '@/lib/cloud'
import { z } from 'zod'
import { isOffline, localService } from '@/lib/offline'
import { detectorLabels } from '@/lib/tongue-advice'

export const maxDuration = 60
const analysisSchema = z.object({
  class_name: z.enum(['黑舌', '紫舌', '白舌']).optional(), confidence: z.number().min(0).max(1).optional(),
  tongueColor: z.string().min(1), tongueShape: z.string().min(1),
  coating: z.string().min(1), constitution: z.string().min(1),
  suggestions: z.array(z.string()).min(1),
  details: z.array(z.object({ category: z.string(), status: z.string(), description: z.string() })).min(1),
})
const localAnalysisSchema = z.discriminatedUnion('source', [
  analysisSchema.extend({ source: z.literal('local-resnet18') }),
  analysisSchema.extend({ source: z.literal('local-yolov8n'), detections: z.array(z.object({
    label: z.enum(detectorLabels), model_score: z.number().finite().min(0).max(1),
    xyxy: z.tuple([z.number().finite().nonnegative(), z.number().finite().nonnegative(), z.number().finite().nonnegative(), z.number().finite().nonnegative()]),
  })).max(300) }),
])

const systemPrompt = `你是一位专业的中医舌诊专家，擅长通过舌象分析来评估人体健康状况。

当用户提供舌头照片或描述时，请从以下几个方面进行分析：

1. **舌色分析**：观察舌质颜色（淡红、红、绛红、淡白、青紫等）
2. **舌形分析**：判断舌体形态（正常、胖大、瘦薄、齿痕、裂纹等）
3. **舌苔分析**：评估舌苔状态（薄白、厚腻、黄苔、灰黑苔、无苔等）
4. **体质说明**：仅凭照片无法判断体质，不作确诊
5. **调理建议**：给出4-6条具体的养生调理建议

请以JSON格式返回分析结果，格式如下：
{
  "tongueColor": "舌色描述",
  "tongueShape": "舌形描述", 
  "coating": "舌苔描述",
  "constitution": "体质类型",
  "suggestions": ["建议1", "建议2", "建议3", "建议4"],
  "details": [
    {"category": "舌色", "status": "状态", "description": "详细描述"},
    {"category": "舌形", "status": "状态", "description": "详细描述"},
    {"category": "舌苔", "status": "状态", "description": "详细描述"},
    {"category": "舌态", "status": "状态", "description": "详细描述"}
  ]
}

注意：
- 分析要专业但表述要通俗易懂
- 状态可以是"正常"、"偏异"、"需关注"
- 建议要具体可操作
- 严重情况建议就医`


export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const image = body?.image
  if (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image)) {
    return Response.json({ error: '请上传 JPG、PNG 或 WebP 格式的舌象照片' }, { status: 400 })
  }
  if (image.length > 14_000_000) {
    return Response.json({ error: '图片过大，请上传小于 10MB 的图片' }, { status: 413 })
  }
  if (isOffline()) {
    try {
      const result = await (await localService('/analyze', { image }, req.signal)).json()
      const validated = localAnalysisSchema.parse(result)
      return Response.json(validated, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
      return Response.json({ error: error instanceof Error && !error.message.includes('fetch failed') ? error.message : '本地模型服务未启动，请启动 offline/server.py；不会调用云端' }, { status: 503 })
    }
  }
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) return Response.json({ error: '请先配置 DASHSCOPE_API_KEY' }, { status: 503 })
  try {
    const response = await fetch(chatURL, {
      method: 'POST',
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(45000)]),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: process.env.DASHSCOPE_VISION_MODEL || 'qwen-vl-plus',
        messages: [
          { role: 'system', content: systemPrompt + '\n' + tongueTerminologyContext + '\n只根据实际图片描述可见特征，不要编造诊断。不清晰或不是舌头照片时返回 {"error":"请上传清晰的舌象照片"}。结果仅供健康参考，不能替代医生诊断。' },
          { role: 'user', content: [
            { type: 'image_url', image_url: { url: image } },
            { type: 'text', text: '请分析这张舌象照片，以 JSON 返回。' },
          ] },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    })
    if (!response.ok) {
      const failure = await response.json().catch(() => null)
      console.error('Tongue API status:', response.status)
      if (failure?.error?.code === 'Arrearage') {
        return Response.json({ error: '阿里云账户欠费或状态异常，请恢复账户后重试' }, { status: 503 })
      }
      return Response.json({ error: '图像分析服务调用失败，请检查 API 密钥、模型权限及额度后重试' }, { status: 502 })
    }
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Missing JSON result')
    const result = JSON.parse(match[0])
    if (typeof result.error === 'string') return Response.json({ error: result.error }, { status: 422 })
    return Response.json(analysisSchema.parse(result))
  } catch {
    return Response.json({ error: '舌象分析超时或返回结果无效，请重试' }, { status: 502 })
  }
}
