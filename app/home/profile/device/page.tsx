'use client'
import { useEffect, useState } from 'react'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { TongueCamera } from '@/components/tongue-camera'
import { VoiceInput } from '@/components/voice-input'
import { useSpeech } from '@/hooks/use-speech'
export default function DevicePage() {
  const [camera, setCamera] = useState(false), [voice, setVoice] = useState(false)
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [capabilities, setCapabilities] = useState('正在检查…')
  const [config, setConfig] = useState('正在读取…'), [devices, setDevices] = useState<string[]>([])
  const speech = useSpeech()
  const [offline, setOffline] = useState(true)
  useEffect(() => {
    setCapabilities(`安全访问：${window.isSecureContext ? '是' : '否，请改用 localhost 或 HTTPS'}；录音支持：${typeof MediaRecorder !== 'undefined' ? '是' : '否'}`)
    fetch('/api/device').then(r => r.json()).then(data => {
      setOffline(data.mode === 'offline')
      setConfig(`${data.mode === 'offline' ? '离线模式，基础服务' : '云端模式，密钥'}：${data.configured ? '已就绪' : '未就绪'}。${Object.values(data.models).join(' / ')}`)
    }).catch(() => setConfig('无法连接本地服务'))
  }, [])
  const listDevices = async () => {
    try { const entries = await navigator.mediaDevices.enumerateDevices(); setDevices(entries.map((d, i) => `${d.kind}：${d.label || `设备 ${i + 1}（授权后显示名称）`}`)) }
    catch { setMessage('无法枚举设备，请检查访问地址及浏览器权限') }
  }
  return <PageShell title="设备检测"><p>{capabilities}</p><p className="break-words">{config}</p><div className="flex flex-wrap gap-3">
    <Button onClick={listDevices}>查看设备列表</Button>
    <Button onClick={() => { speech.stop(); setCamera(true) }}>测试摄像头</Button>
    {!offline && <Button onClick={() => { speech.stop(); setVoice(true) }}>测试录音识别</Button>}
    <Button onClick={() => speech.speak('您好，欢迎使用本草知音，扬声器测试。')}>测试中文播报</Button>
    {speech.speaking && <Button onClick={speech.stop}>停止播报</Button>}
    <Button disabled={busy} onClick={async () => { setBusy(true); try { const r = await fetch('/api/device', { method: 'POST' }); setMessage((await r.json()).message) } catch { setMessage('本地服务连接失败') } finally { setBusy(false) } }}>{busy ? '检查中…' : offline ? '检查离线模型' : '检查在线模型'}</Button>
  </div><p className="text-sm text-muted-foreground">{offline ? '照片分析、知识查询和播报均在本机完成。语音识别暂未启用，请使用文字输入。' : '当前为云端模式，在线分析和语音识别需要联网。'}</p>{devices.map((d, i) => <p key={i}>{d}</p>)}<p role="status">{message}</p>{speech.error && <p role="alert" className="text-destructive">{speech.error}</p>}
    {camera && <TongueCamera onCancel={() => setCamera(false)} onCapture={image => { setCamera(false); setMessage(`摄像头采集成功，图像约 ${Math.round(image.length * 0.75 / 1024)} KB，未上传`) }} />}
    {voice && <VoiceInput onClose={() => setVoice(false)} onResult={text => { setVoice(false); setMessage('识别结果：' + text) }} />}
  </PageShell>
}
