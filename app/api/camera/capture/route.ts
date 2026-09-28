import { localService } from '@/lib/offline'

export async function POST(req: Request) {
  try {
    const result = await (await localService('/capture', {}, req.signal)).json()
    if (typeof result.image !== 'string' || !result.image.startsWith('data:image/jpeg;base64,')) throw new Error('未取得设备照片')
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: '设备拍照失败，请检查排线摄像头和本地服务，也可上传图片' }, { status: 503 })
  }
}
