'use client'

import { TongueStandardSource } from '@/components/tongue-standard-source'
import { tongueFeatures } from '@/lib/tongue-features'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TongueCamera } from '@/components/tongue-camera'
import { TongueResult } from '@/components/tongue-result'
import { saveReport, createTongueReport, type TongueAnalysis } from '@/lib/report-store'
import { useRouter } from 'next/navigation'

type AnalysisStep = 'intro' | 'camera' | 'preview' | 'analyzing' | 'result'

export default function TonguePage() {
  const [step, setStep] = useState<AnalysisStep>('intro')
  const [fine, setFine] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<TongueAnalysis | null>(null)
  const [savedReportId, setSavedReportId] = useState<string | null>(null)
  const router = useRouter()
  const requestRef = useRef<AbortController | null>(null)
  useEffect(() => () => requestRef.current?.abort(), [])
  const [error, setError] = useState<string | null>(null)

  const handleCapture = useCallback(async (imageData: string, useFine = fine) => {
    setError(null)
    setSavedReportId(null)
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setCapturedImage(imageData)
    setStep('analyzing')
    
    try {
      // 调用AI舌诊分析API
      const response = await fetch(useFine ? '/api/tongue-fine' : '/api/tongue-analysis', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      })

      const analysisResult = await response.json()
      if (!response.ok) throw new Error(analysisResult.error || '分析失败')
      
      if (analysisResult.error) {
        throw new Error(analysisResult.error)
      }

      if (controller.signal.aborted) return
      // 保存报告
      const report = createTongueReport(analysisResult, imageData)
      const saved = saveReport(report)
      if (saved) {
        setSavedReportId(report.id)
      } else {
        setError('分析完成，但报告保存失败，请检查本机存储空间')
      }

      setAnalysis(analysisResult)
      setStep('result')
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Tongue analysis error:', error)
      setError(error instanceof Error ? error.message : '分析失败，请重试')
      setStep('intro')
    }
  }, [fine])

  const handleReset = () => {
    requestRef.current?.abort()
    setError(null)
    setStep('intro')
    setCapturedImage(null)
    setAnalysis(null)
    setSavedReportId(null)
  }

  const handleViewReports = () => {
    router.push('/home/reports')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <TongueStandardSource />
      {/* 头部 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-bold text-foreground">智能舌诊</h1>
            <p className="text-sm text-muted-foreground">AI辅助舌象分析</p>
          </div>
          {step !== 'intro' && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              重新开始
            </Button>
          )}
        </div>
      </header>

      <main className="px-4 py-6">
        {step === 'intro' && <a href="/home/tongue/advice" className="mb-4 block rounded-xl border bg-card p-4 underline">暂不拍照，先填写不适并获取离线健康建议</a>}
        {step === 'intro' && <section className="mb-4 rounded-xl border p-4 space-y-3">
          <label className="block space-y-2"><span className="font-semibold">选择分析方式</span><select className="block w-full rounded border bg-background p-2" value={fine ? 'fine' : 'detector'} onChange={e => setFine(e.target.value === 'fine')}><option value="detector">新训练模型：十类舌象外观检测（离线）</option><option value="fine">通义视觉：8项外观分析（电脑试验，设备未验证）</option></select></label>
          <p className="text-sm text-muted-foreground">默认使用新训练的十类模型：红舌、紫舌、胖大、瘦薄、红点、裂纹、齿痕、白苔、黄苔、黑苔。结果待人工核对，未检出不等于正常；未训练项目保持未知。</p>
          <details><summary className="cursor-pointer">查看分类与观察要点</summary><ul className="mt-2 space-y-2 text-sm">{tongueFeatures.map(f => <li key={f.key}><strong>{f.name}：</strong>{f.values.join('、')}、无法判断。{f.note}</li>)}</ul>
            <p className="mt-2 text-xs">项目观察分类，非国家标准原文。参考：<a className="underline" href="https://dep.mohw.gov.tw/DOCMAP/fp-772-5723-108.html" target="_blank" rel="noopener noreferrer">中医药司《望舌》</a>、<a className="underline" href="https://github.com/tonguedx/tonguedx" target="_blank" rel="noopener noreferrer">TongueDx</a>。资料用于定义观察维度，不能替代模型训练和准确率验证。</p>
          </details>
        </section>}
        {error && <p role="alert" className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</p>}
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <IntroSection key="intro" onStart={() => setStep('camera')} />
          )}
          
          {step === 'camera' && (
            <TongueCamera
              key="camera"
              onCapture={image => { setCapturedImage(image); setError(null); setStep('preview') }}
              onCancel={() => setStep('intro')}
            />
          )}
          
          {step === 'preview' && capturedImage && <section className="space-y-4">
            <h2 className="text-lg font-semibold">先确认照片</h2>
            <img src={capturedImage} alt="待分析的原始照片" className="max-h-[55vh] w-full object-contain rounded-xl bg-muted" />
            <p className="text-sm">确认舌面清晰、舌尖和两侧完整；尽量拍近照，避免整张人脸占据主要画面。</p>
            <p className="text-sm text-muted-foreground">本次使用：{fine ? '8项本地视觉细分类（试验）' : '新训练的十类外观检测模型'}。照片在本机分析。</p>
            <div className="flex gap-3"><Button variant="outline" onClick={() => setStep('camera')}>重新选图或拍照</Button><Button onClick={() => void handleCapture(capturedImage)}>确认并开始分析</Button></div>
          </section>}
          {step === 'analyzing' && (
            <AnalyzingSection key="analyzing" image={capturedImage} onCancel={handleReset} />
          )}
          
          {step === 'result' && analysis && (
            <div className="space-y-4">
              {/* 报告保存成功提示 */}
              {savedReportId && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-herbal-green/10 border border-herbal-green/30 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-herbal-green/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-herbal-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">报告已自动保存</p>
                      <p className="text-xs text-muted-foreground">可在"报告播报"中查看</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewReports}
                    className="text-herbal-green hover:text-herbal-green/80"
                  >
                    查看
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </motion.div>
              )}
              
              <TongueResult
                key="result"
                image={capturedImage}
                analysis={analysis}
                onReset={handleReset}
                onRefine={analysis.source === 'local-resnet18' && capturedImage ? () => { setFine(true); void handleCapture(capturedImage, true) } : undefined}
              />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function IntroSection({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* 介绍卡片 */}
      <div className="bg-gradient-to-br from-card to-primary/5 rounded-2xl p-6 border border-border/50 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">舌诊原理</h2>
            <p className="text-sm text-muted-foreground">中医望诊重要方法</p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          本功能记录照片中可见的舌体和舌苔外观。分类结果受光线、伸舌姿势和图像质量影响，需结合原图核对，不能据此确定疾病或体质。
        </p>
      </div>

      {/* 拍摄指南 */}
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">拍摄指南</h3>
        <div className="space-y-3">
          {[
            { icon: '1', text: '在自然光线下拍摄，避免灯光直射' },
            { icon: '2', text: '自然伸舌，舌尖朝下，不要过度用力' },
            { icon: '3', text: '保持手机稳定，舌头置于画面中央' },
              { icon: '4', text: '记录拍摄时间与近期饮食、刷舌情况，便于比较' },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center justify-center">
                {item.icon}
              </span>
              <span className="text-sm text-muted-foreground">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 报告提示 */}
      <div className="bg-warm-gold/10 border border-warm-gold/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-warm-gold mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-foreground">自动保存报告</p>
            <p className="text-xs text-muted-foreground mt-1">
              每次舌诊分析完成后，报告将自动保存至"报告播报"，方便您随时查看历史记录。
            </p>
          </div>
        </div>
      </div>

      {/* 开始按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={onStart}
          className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-xl shadow-lg"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          开始舌诊
        </Button>
      </motion.div>

      {/* 免责声明 */}
      <p className="text-xs text-muted-foreground/70 text-center px-4">
        本功能仅供参考，不能替代专业医疗诊断。如有健康问题，请咨询专业医师。
      </p>
    </motion.div>
  )
}

function AnalyzingSection({ image, onCancel }: { image: string | null; onCancel: () => void }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
    >
      {/* 图片预览 */}
      {image && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-primary/20"
        >
          <img src={image} alt="舌象照片" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </motion.div>
      )}

      {/* 分析动画 */}
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
        />
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">AI正在分析舌象...</p>
          <p className="text-sm text-muted-foreground mt-1">已等待 {seconds} 秒；首次加载可能较慢</p>
        </div>
      </div>

      <p role="status" className="text-sm text-muted-foreground">{seconds >= 30 ? '模型仍在处理中，你可以继续等待或取消。取消后不会保存本次结果。' : '正在等待本地模型返回完整结果，尚未生成报告。'}</p>
      <Button variant="outline" onClick={onCancel}>取消本次分析</Button>
    </motion.div>
  )
}
