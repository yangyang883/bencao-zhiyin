'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { speechChunks } from '@/lib/audio'

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const stop = useCallback(() => {
    controller.current?.abort()
    audioRef.current?.pause()
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])
  useEffect(() => () => { controller.current?.abort(); audioRef.current?.pause(); window.speechSynthesis?.cancel() }, [])
  const speak = useCallback(async (text: string) => {
    stop(); setError('')
    const request = new AbortController()
    controller.current = request
    setSpeaking(true)
    try {
      const voice = window.speechSynthesis?.getVoices().find(v => /^zh/i.test(v.lang) && v.localService)
      for (const chunk of speechChunks(text)) {
        if (request.signal.aborted) break
        if (voice) {
          await new Promise<void>((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(chunk)
            utteranceRef.current = utterance
            utterance.voice = voice; utterance.lang = 'zh-CN'
            utterance.onend = () => resolve()
            utterance.onerror = () => reject(new Error('设备语音播报失败，请检查系统中文语音包'))
            request.signal.addEventListener('abort', () => resolve(), { once: true })
            window.speechSynthesis.speak(utterance)
          })
        } else {
          const response = await fetch('/api/speech/synthesize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: chunk }), signal: request.signal })
          if (!response.ok) throw new Error((await response.json()).error || '语音播报服务不可用')
          const url = URL.createObjectURL(await response.blob())
          try {
            if (request.signal.aborted) break
            const audio = new Audio(url); audioRef.current = audio
            await new Promise<void>((resolve, reject) => {
              audio.onended = () => resolve()
              audio.onerror = () => reject(new Error('音频播放失败，请检查扬声器'))
              request.signal.addEventListener('abort', () => { audio.pause(); resolve() }, { once: true })
              audio.play().catch(() => reject(new Error('浏览器阻止自动播放，请点击“播报回复”重试')))
            })
          } finally { URL.revokeObjectURL(url) }
        }
      }
    } catch (error) {
      if (!request.signal.aborted) setError(error instanceof Error ? error.message : '播报失败')
    } finally { if (controller.current === request) setSpeaking(false) }
  }, [stop])
  return { speak, stop, speaking, error }
}
