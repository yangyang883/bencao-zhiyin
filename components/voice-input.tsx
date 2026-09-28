'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { recordingToWav } from '@/lib/audio'

interface VoiceInputProps { onResult: (text: string) => void; onClose: () => void }

export function VoiceInput({ onResult, onClose }: VoiceInputProps) {
  const [phase, setPhase] = useState<'idle' | 'starting' | 'recording' | 'recognizing'>('idle')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const mounted = useRef(true)
  const request = useRef<AbortController | null>(null)
  const release = () => {
    if (timer.current) clearInterval(timer.current)
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      request.current?.abort()
      if (recorderRef.current?.state === 'recording') { recorderRef.current.onstop = null; recorderRef.current.stop() }
      release()
    }
  }, [])
  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    release()
  }
  const start = async () => {
    setError(''); setText(''); setSeconds(0); setPhase('starting')
    try {
      const mode = await (await fetch('/api/device')).json()
      if (!mounted.current) return
      if (mode.mode === 'offline') throw new Error('离线展示版暂未启用语音识别，请关闭此窗口并使用文字输入')
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('此浏览器不能录音，请使用 localhost 或 HTTPS 下的新版浏览器')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
      if (!mounted.current) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      const chunks: Blob[] = []
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => { recorder.onstop = null; release(); if (mounted.current) { setError('录音设备发生错误，请检查麦克风'); setPhase('idle') } }
      recorder.onstop = async () => {
        release()
        if (!mounted.current) return
        setPhase('recognizing')
        const controller = new AbortController(); request.current = controller
        try {
          const audio = await recordingToWav(new Blob(chunks, { type: recorder.mimeType }))
          if (!mounted.current) return
          const response = await fetch('/api/speech/recognize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio }), signal: controller.signal })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || '语音识别失败')
          if (mounted.current) setText(result.text)
        } catch (error) {
          if (mounted.current && !controller.signal.aborted) setError(error instanceof Error ? error.message : '录音处理失败')
        } finally { if (mounted.current) setPhase('idle') }
      }
      recorder.start(); setPhase('recording')
      let elapsed = 0
      timer.current = setInterval(() => { elapsed++; setSeconds(elapsed); if (elapsed >= 60) stopRecording() }, 1000)
    } catch (error) {
      release()
      if (mounted.current) { setPhase('idle'); setError(error instanceof Error && error.name === 'NotAllowedError' ? '请允许麦克风权限后重试' : error instanceof Error ? error.message : '无法打开麦克风') }
    }
  }
  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="语音输入">
    <div className="bg-card rounded-2xl p-6 w-full max-w-lg space-y-4">
      <h2 className="text-xl font-semibold">语音输入</h2>
      <p className="text-sm text-muted-foreground">点击录音，结束后识别为文字。录音会发送至阿里云进行识别，最多 60 秒。</p>
      <p aria-live="polite">{phase === 'recording' ? `正在录音：${seconds} 秒` : phase === 'recognizing' ? '正在识别，请稍候…' : phase === 'starting' ? '正在打开麦克风…' : '准备就绪'}</p>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <Button className="h-14 w-full" disabled={phase === 'starting' || phase === 'recognizing'} onClick={phase === 'recording' ? stopRecording : start}>{phase === 'recording' ? '停止并识别' : '开始录音'}</Button>
      <textarea aria-label="识别结果，可修改" placeholder="识别结果会显示在这里，也可以手动修改" value={text} onChange={event => setText(event.target.value)} className="w-full min-h-28 border rounded-xl p-3" />
      <div className="flex gap-3"><Button variant="outline" onClick={onClose}>取消</Button><Button disabled={!text.trim() || phase !== 'idle'} onClick={() => onResult(text.trim())}>发送这段话</Button></div>
    </div>
  </div>
}
