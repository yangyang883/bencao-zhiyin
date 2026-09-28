'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSpeech } from '@/hooks/use-speech'
import { generateTongueReportContent } from '@/lib/report-store'
import { TongueAdvicePanel } from '@/components/tongue-advice'

interface TongueAnalysis {
  source?: string
  features?: Record<string, string>
  detections?: { label: string; model_score: number }[]
  class_name?: '黑舌' | '紫舌' | '白舌'
  confidence?: number
  tongueColor: string
  tongueShape: string
  coating: string
  constitution: string
  suggestions: string[]
  details: {
    category: string
    status: string
    description: string
  }[]
}

interface TongueResultProps {
  image: string | null
  analysis: TongueAnalysis
  onReset: () => void
  onRefine?: () => void
}

export function TongueResult({ image, analysis, onReset, onRefine }: TongueResultProps) {
  const speech = useSpeech()
  const [summary, setSummary] = useState('')
  const [summaryBusy, setSummaryBusy] = useState(false)
  const summaryRequest = useRef<AbortController | null>(null)
  useEffect(() => () => summaryRequest.current?.abort(), [])
  const explain = async () => {
    summaryRequest.current?.abort()
    const controller = new AbortController(); summaryRequest.current = controller
    setSummaryBusy(true); setSummary('')
    try {
      const response = await fetch('/api/report-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_name: analysis.class_name, confidence: analysis.confidence }), signal: controller.signal })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      if (!controller.signal.aborted) setSummary(data.text)
    } catch (error) {
      if (!controller.signal.aborted) setSummary(error instanceof Error ? error.message : '文字说明暂不可用')
    } finally { if (!controller.signal.aborted) setSummaryBusy(false) }
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 pb-8"
    >
      {/* 结果概览 */}
      {analysis.source === 'local-qwen-vl' && <section className="rounded-xl border p-4 space-y-2"><p className="font-semibold">本地视觉细分类 · 待人工核对</p><p className="text-sm">8项外观分别记录，无法判断的项目保留未知。通用视觉模型尚未经过舌象专科验证，不能作诊断或体质判断。</p></section>}
      {analysis.source === 'local-resnet18' && <section className="rounded-xl border p-4 space-y-2">
        <p>三分类模型演示，不能判断疾病或体质。模型分数不代表医学准确率。</p>
        {onRefine && <Button onClick={onRefine}>用8项细分类重新分析这张照片</Button>}
        <Button variant="outline" disabled={summaryBusy} onClick={explain}>{summaryBusy ? '本地通义整理中…' : '用本地通义解释结果（试验）'}</Button>
        {summary && <p role="status">{summary}</p>}
        <p className="text-xs text-muted-foreground">文字由本机 Qwen3-0.6B 生成，需人工核对，不替代或更改原始报告。</p>
      </section>}
      <div className="bg-gradient-to-br from-card to-primary/5 rounded-2xl p-6 border border-border/50 shadow-sm">
        <div className="flex gap-4">
          {/* 舌象图片 */}
          {image && (
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-primary/20 flex-shrink-0">
              <img src={image} alt="舌象" className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* 基本信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-herbal-green/20 text-herbal-green rounded-full">
                {analysis.source?.startsWith('local-') ? '观察结果 · 待核对' : '分析完成'}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-1">
              {analysis.source === 'local-qwen-vl' ? '舌象外观细分类' : analysis.source === 'local-resnet18' ? '本地模型分类演示' : `体质参考：${analysis.constitution}`}
            </h2>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>舌色：{analysis.tongueColor}</span>
              <span>|</span>
              <span>舌形：{analysis.tongueShape}</span>
              <span>|</span>
              <span>{analysis.coating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 详细分析 */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">详细分析</h3>
        </div>
        <div className="divide-y divide-border/50">
          {analysis.details.map((detail, index) => (
            <motion.div
              key={detail.category}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="px-6 py-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{detail.category}</span>
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full shrink-0',
                  analysis.source?.startsWith('local-') ? 'bg-muted text-muted-foreground' : detail.status === '正常'
                    ? 'bg-herbal-green/20 text-herbal-green'
                    : detail.status === '偏异' 
                    ? 'bg-warm-gold/20 text-warm-gold'
                    : 'bg-destructive/20 text-destructive'
                )}>
                  {detail.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {detail.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 调理建议 */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">{analysis.source?.startsWith('local-') ? '拍摄与复核建议' : '调理建议'}</h3>
        </div>
        <div className="p-6 space-y-3">
          {analysis.suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">{index + 1}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">{suggestion}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <TongueAdvicePanel analysis={analysis} />
      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl"
          onClick={onReset}
        >
          重新检测
        </Button>
        <Button
          onClick={() => speech.speaking ? speech.stop() : speech.speak(generateTongueReportContent(analysis))}
          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-accent"
        >
          {speech.speaking ? '停止播报' : '播报分析'}
        </Button>
      </div>

      {speech.error && <p role="alert" className="text-destructive">{speech.error}</p>}
      {/* 免责声明 */}
      <p className="text-xs text-muted-foreground/70 text-center px-4">
        以上分析结果仅供参考，不能作为医疗诊断依据。如有健康问题，请咨询专业医师。
      </p>
    </motion.div>
  )
}
