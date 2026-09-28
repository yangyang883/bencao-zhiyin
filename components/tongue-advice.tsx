'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { symptomQuestions, type AdviceInput, type TongueAdvice } from '@/lib/tongue-advice'
import { createConsultationReport, saveReport, type TongueAnalysis } from '@/lib/report-store'

export function TongueAdvicePanel({ analysis }: { analysis?: TongueAnalysis }) {
  const [symptoms, setSymptoms] = useState<AdviceInput['symptoms']>({breathing:'unknown',suddenSwelling:'unknown',dryMouth:'unknown',pain:'unknown',ulcer:'unknown',whitePatch:'unknown',eatingDifficulty:'unknown',worsening:'unknown'})
  const [days, setDays] = useState('')
  const [group, setGroup] = useState<AdviceInput['group']>('unknown')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<TongueAdvice | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const active = useRef<AbortController | null>(null)
  useEffect(() => { active.current?.abort(); setResult(null); setBusy(false); setSaved(false) }, [analysis])
  useEffect(() => () => active.current?.abort(), [])
  const changed = () => { active.current?.abort(); setBusy(false); setResult(null); setError(''); setSaved(false) }
  const generate = async (event: React.FormEvent) => {
    event.preventDefault(); changed()
    const controller = new AbortController(); active.current = controller; setBusy(true)
    try {
      const response = await fetch('/api/tongue-advice', {method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,
        body:JSON.stringify({analysis:analysis ? {source:analysis.source,class_name:analysis.class_name,features:analysis.features,detections:analysis.detections} : undefined,
          symptoms,group,description,ulcerDays:symptoms.ulcer === 'yes' && days !== '' ? Number(days) : null})})
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '暂时无法生成建议')
      if (!controller.signal.aborted) setResult(data)
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : '生成失败，请重试') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  const save = () => {
    if (!result) return
    const answers = symptomQuestions.map(q=>`${q.label} ${ {yes:'是',no:'否',unknown:'未确认'}[symptoms[q.key]]}`).join('\n')
    const content = `用户确认：\n${answers}\n溃疡天数：${symptoms.ulcer === 'yes' ? days || '未知' : '未确认溃疡'}\n补充记录（未自动解读）：${description || '无'}\n\n${result.text}`
    const report = createConsultationReport('舌象后的健康建议（待复核）',content,result.level === 'emergency' || result.level === 'prompt' ? 'attention' : 'warning')
    report.title = '舌象后健康建议'
    if (saveReport(report)) setSaved(true)
    else setError('保存失败，请检查本机存储空间；当前建议仍可查看。')
  }
  return <section className="rounded-2xl border bg-card p-5 space-y-4" aria-labelledby="tongue-advice-title">
    <div><h2 id="tongue-advice-title" className="text-lg font-semibold">补充不适，获取离线健康建议</h2>
      <p className="text-sm text-muted-foreground mt-2">结合舌象外观与自己确认的症状，提供解释、一般护理和就医提示。不能开药或确定病因。</p></div>
    <p className="rounded-lg bg-destructive/10 p-3 text-sm">如果现在呼吸困难，或嘴唇、舌头、咽喉突然肿胀，请立即寻求急救：中国大陆拨打120，其他地区使用当地急救电话。不要等待图片分析或填写完表单。</p>
    <form onSubmit={generate} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">{symptomQuestions.map(q=><label key={q.key} className="block text-sm space-y-1">
        <span>{q.label}</span><select className="w-full rounded border bg-background p-2" value={symptoms[q.key]} onChange={e=>{changed();setSymptoms({...symptoms,[q.key]:e.target.value})}}>
          <option value="unknown">不确定 / 尚未确认</option><option value="yes">是</option><option value="no">否</option>
        </select></label>)}</div>
      {(symptoms.breathing === 'yes' || symptoms.suddenSwelling === 'yes') && <p role="alert" className="font-semibold text-destructive">你确认了需要优先急救的症状，请立即求助，不等待本系统结果。</p>}
      {symptoms.ulcer === 'yes' && <label className="block text-sm space-y-1"><span>这处溃疡持续多少天？不知道可以留空</span><input type="number" min="0" max="3650" step="1" className="block rounded border bg-background p-2" value={days} onChange={e=>{changed();setDays(e.target.value)}} /></label>}
      <label className="block text-sm space-y-1"><span>适用人群</span><select className="block w-full rounded border bg-background p-2" value={group} onChange={e=>{changed();setGroup(e.target.value as AdviceInput['group'])}}>
        <option value="unknown">尚未确认</option><option value="adult">成人（非孕哺期）</option><option value="child">未成年人</option><option value="pregnant">孕期或哺乳期</option>
      </select></label>
      <label className="block text-sm space-y-1"><span>补充描述（可选，最多1000字）</span><textarea className="block w-full rounded border bg-background p-2" rows={3} maxLength={1000} value={description} onChange={e=>{changed();setDescription(e.target.value)}} /></label>
      <p className="text-xs text-muted-foreground">补充文字用于记录，不代替上方症状确认。点击保存才会把这次问答存入本机报告。</p>
      <Button type="submit" disabled={busy}>{busy ? '整理建议中…' : '生成离线健康建议'}</Button>
    </form>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {result && <div className="space-y-4 border-t pt-4" aria-live="polite">
      <div><h3 className="font-semibold">{result.level === 'emergency' ? '立即求助' : result.level === 'prompt' ? '建议尽快检查' : result.level === 'incomplete' ? '先补充确认' : '一般健康信息'}</h3><p className="mt-1">{result.care}</p></div>
      {result.level !== 'emergency' && <>
        <div><h3 className="font-semibold">舌象解释</h3><ul className="list-disc pl-5 text-sm space-y-1">{result.observations.map(t=><li key={t}>{t}</li>)}</ul></div>
        {result.selfCare.length > 0 && <div><h3 className="font-semibold">可以参考的一般护理</h3><ul className="list-disc pl-5 space-y-1">{result.selfCare.map(item=><li key={item.sourceId}>{item.text}</li>)}</ul></div>}
        {result.questions.length > 0 && <div><h3 className="font-semibold">还需要确认</h3><ul className="list-disc pl-5 text-sm space-y-1">{result.questions.map(t=><li key={t}>{t}</li>)}</ul></div>}
      </>}
      <details><summary className="cursor-pointer">查看依据与使用边界</summary><p className="mt-2 text-sm">{result.review}</p>
        <ul className="list-disc pl-5 text-sm">{result.limits.map(t=><li key={t}>{t}</li>)}</ul>
        {result.sources.map(s=><div key={s.id} className="mt-3 text-sm"><p className="font-medium">{s.title}</p><p>{s.summary}</p><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.sourceTitle}</a>{s.additionalUrl && <a href={s.additionalUrl} target="_blank" rel="noopener noreferrer" className="underline ml-2">中国大陆急救电话依据</a>}<p>核对日期：{s.checkedAt}。摘要可离线阅读，原文链接需联网。</p></div>)}
      </details>
      <Button type="button" variant="outline" onClick={save} disabled={saved}>{saved ? '已保存到本机报告' : '保存这次建议'}</Button>
      {saved && <p role="status" className="text-sm">可在“报告播报”查看这次健康建议。</p>}
    </div>}
  </section>
}
