'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface TongueCameraProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
}

export function TongueCamera({ onCapture, onCancel }: TongueCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileReader = useRef<FileReader | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [deviceBusy, setDeviceBusy] = useState(false)
  const [deviceError, setDeviceError] = useState('')
  const deviceRequest = useRef<AbortController | null>(null)
  useEffect(() => () => { deviceRequest.current?.abort(); fileReader.current?.abort() }, [])

  const captureDevice = async () => {
    const controller = new AbortController()
    deviceRequest.current?.abort()
    deviceRequest.current = controller
    setDeviceBusy(true); setDeviceError('')
    try {
      const response = await fetch('/api/camera/capture', { method: 'POST', signal: controller.signal })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      if (!controller.signal.aborted) { stopCamera(); onCapture(data.image) }
    } catch (error) {
      if (!controller.signal.aborted) setDeviceError(error instanceof Error ? error.message : '设备拍照失败')
    } finally { if (!controller.signal.aborted) setDeviceBusy(false) }
  }

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setIsCameraReady(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    let acquired: MediaStream | null = null
    setCameraError(null)
    setIsCameraReady(false)
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('请使用设备上的 localhost 地址或 HTTPS 访问，以启用摄像头')
        }
        acquired = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled || !videoRef.current) {
          acquired.getTracks().forEach(track => track.stop())
          return
        }
        streamRef.current = acquired
        videoRef.current.srcObject = acquired
        await videoRef.current.play()
      } catch (error) {
        acquired?.getTracks().forEach(track => track.stop())
        if (cancelled) return
        streamRef.current = null
        setCameraError(error instanceof Error && error.name === 'NotAllowedError'
          ? '摄像头权限未开启，请在浏览器中允许访问或上传图片'
          : error instanceof Error && error.name === 'NotFoundError'
            ? '未找到摄像头，请检查连接或上传图片'
            : '摄像头未就绪，请检查连接、权限及访问地址（localhost 或 HTTPS），也可上传图片')
      }
    }
    void start()
    return () => {
      cancelled = true
      acquired?.getTracks().forEach(track => track.stop())
      if (streamRef.current === acquired) streamRef.current = null
    }
  }, [facingMode])

  const switchCamera = () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        stopCamera()
        onCapture(imageData)
      }
    }
  }, [stopCamera, onCapture])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    fileReader.current?.abort()
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
        setCameraError('请上传 10MB 以内的 JPG、PNG 或 WebP 图片')
        stopCamera()
        return
      }
      const reader = new FileReader()
      fileReader.current = reader
      reader.onload = () => {
        if (fileReader.current !== reader || typeof reader.result !== 'string') return
        const imageData = reader.result
        stopCamera()
        onCapture(imageData)
      }
      reader.onerror = () => setCameraError('图片读取失败，请重试')
      reader.readAsDataURL(file)
    }
  }

  const handleCancel = () => {
    fileReader.current?.abort()
    deviceRequest.current?.abort()
    stopCamera()
    onCancel()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* 相机视图 */}
      <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-xl">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-muted">
            <svg className="w-16 h-16 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-muted-foreground mb-4">{cameraError}</p>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              上传舌象照片
            </Button>
            <Button className="mt-3" disabled={deviceBusy} onClick={captureDevice}>
              {deviceBusy ? '设备拍照中…' : '使用设备排线摄像头拍照'}
            </Button>
            {deviceError && <p role="alert" className="mt-2">{deviceError}</p>}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              onLoadedData={() => setIsCameraReady(true)}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* 取景框 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-3/4 aspect-square">
                {/* 圆形取景框 */}
                <div className="absolute inset-0 rounded-full border-4 border-white/50" />
                {/* 角标记 */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
            </div>

            {/* 提示文字 */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-white/90 text-sm bg-black/50 px-4 py-2 rounded-full inline-block">
                将舌头置于取景框内
              </p>
            </div>

            {/* 切换摄像头按钮 */}
            <button
              aria-label="切换摄像头"
              onClick={switchCamera}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-center gap-6">
        {/* 取消按钮 */}
        <Button
          variant="outline"
          size="icon"
          className="w-14 h-14 rounded-full"
          aria-label="取消拍照"
          onClick={handleCancel}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>

        {/* 拍照按钮 */}
        {!cameraError && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            aria-label="拍摄舌象照片"
            onClick={capturePhoto}
            disabled={!isCameraReady}
            className="w-20 h-20 rounded-full bg-white border-4 border-primary shadow-lg flex items-center justify-center disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full bg-primary" />
          </motion.button>
        )}

        {/* 相册按钮 */}
        <Button
          variant="outline"
          size="icon"
          className="w-14 h-14 rounded-full"
          aria-label="从相册选择舌象照片"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </Button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
    </motion.div>
  )
}
