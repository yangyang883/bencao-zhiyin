export const isOffline = () => process.env.BENCAO_MODE !== 'cloud'

export async function localService(path: string, body?: unknown, signal?: AbortSignal) {
  const response = await fetch(`http://127.0.0.1:8765${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000),
    redirect: 'error', cache: 'no-store',
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error || '本地服务暂不可用')
  }
  return response
}
