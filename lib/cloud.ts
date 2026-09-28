export const chatURL = process.env.DASHSCOPE_CHAT_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
export const ttsURL = process.env.DASHSCOPE_TTS_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'

export async function cloudJSON(url: string, body: unknown, signal?: AbortSignal) {
  if (process.env.BENCAO_MODE !== 'cloud') throw new Error('离线模式不调用云端服务；语音输入请改用文字输入')
  if (!process.env.DASHSCOPE_API_KEY) throw new Error('尚未配置云端 API 密钥')
  const response = await fetch(url, {
    method: 'POST',
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}` },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) {
    const code = data?.error?.code || data?.code
    if (code === 'Arrearage') throw new Error('阿里云账户欠费或状态异常，请恢复账户后重试')
    if (response.status === 401 || response.status === 403) throw new Error('API 密钥无效或未开通此模型权限')
    if (response.status === 429) throw new Error('云端请求过于频繁，请稍后重试')
    throw new Error(`云端服务暂不可用（${response.status}），请检查模型配置及额度`)
  }
  return data
}
