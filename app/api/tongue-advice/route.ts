import { adviceInputSchema, generateTongueAdvice } from '@/lib/tongue-advice'

export async function POST(req: Request) {
  const text = await req.text()
  if (text.length > 32000) return Response.json({error:'输入过长，请缩短描述或减少检测框。'},{status:413})
  let body: unknown
  try { body = JSON.parse(text) } catch { return Response.json({error:'请求格式无效。'},{status:400}) }
  const parsed = adviceInputSchema.safeParse(body)
  if (!parsed.success) return Response.json({error:'请检查症状选项、溃疡天数及模型结果格式。'},{status:400})
  return Response.json(generateTongueAdvice(parsed.data),{headers:{'Cache-Control':'no-store','X-Reply-Source':'local-knowledge-rules'}})
}
