'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getReportStatus, type Report } from '@/lib/report-store'
import { useSpeech } from '@/hooks/use-speech'

interface ReportDetailProps {
  report: Report
  onClose: () => void
}

export function ReportDetail({ report, onClose }: ReportDetailProps) {
  const { speak, stop, speaking: isPlaying, error } = useSpeech()
  const [showImage, setShowImage] = useState(false)
  const togglePlay = () => { if (isPlaying) stop(); else void speak(report.content) }

  

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {error && <p role="alert" className="fixed top-4 inset-x-4 bg-card p-4 z-50 text-destructive">{error}</p>}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 h-[90vh] bg-background rounded-t-3xl overflow-hidden flex flex-col"
      >
        {/* 拖拽指示器 */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-border rounded-full" />
        </div>

        {/* 头部 */}
        <div className="px-6 pb-4 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-serif font-semibold text-foreground">
                  {report.title}
                </h2>
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full border',
                  getReportStatus(report).color
                )}>
                  {getReportStatus(report).label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {report.date} {report.time} · {report.summary}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 舌象图片（如果有） */}
        {report.type === 'tongue' && report.imageUrl && (
          <div className="px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setShowImage(true)}
              >
                <img 
                  src={report.imageUrl} 
                  alt="舌象照片" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">舌象照片</h4>
                <p className="text-sm text-muted-foreground">点击查看大图</p>
                {report.analysis && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      {report.analysis.tongueColor}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      {report.analysis.coating}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      {report.analysis.constitution}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 播报控制 */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border/50">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              aria-label={isPlaying ? "停止报告播报" : "播报报告"}
              onClick={togglePlay}
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors',
                isPlaying
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-gradient-to-r from-primary to-accent text-primary-foreground'
              )}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </motion.button>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {isPlaying ? '正在播报...' : '语音播报'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isPlaying ? '可随时停止' : '点击播放'}
                </span>
              </div>
              

            </div>
          </div>
        </div>

        {/* 报告内容 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* 分析详情卡片（舌诊报告特有） */}
          {report.type === 'tongue' && report.analysis && (
            <div className="mb-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                分析指标
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {report.analysis.details.map((detail, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-3 rounded-xl border',
                      detail.status === '正常' 
                        ? 'bg-herbal-green/5 border-herbal-green/20'
                        : detail.status === '注意'
                        ? 'bg-warm-gold/5 border-warm-gold/20'
                        : 'bg-destructive/5 border-destructive/20'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground">{detail.category}</span>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        detail.status === '正常' 
                          ? 'bg-herbal-green/20 text-herbal-green'
                          : detail.status === '注意'
                          ? 'bg-warm-gold/20 text-warm-gold'
                          : 'bg-destructive/20 text-destructive'
                      )}>
                        {detail.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {detail.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 报告正文 */}
          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
            {report.content.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="mb-3 leading-relaxed text-foreground text-sm">
                  {paragraph}
                </p>
              )
            ))}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="px-6 py-4 border-t border-border/50 bg-background">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl"
              onClick={onClose}
            >
              关闭
            </Button>
            <Button
              onClick={() => {
                const url = URL.createObjectURL(new Blob([report.title + '\n' + report.date + '\n\n' + report.content], { type: 'text/plain;charset=utf-8' }))
                const link = document.createElement('a'); link.href = url; link.download = report.title + '-' + report.date + '.txt'; link.click()
                setTimeout(() => URL.revokeObjectURL(url), 1000)
              }}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-accent"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              导出报告
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 大图查看 */}
      {showImage && report.imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowImage(false)}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="relative max-w-sm w-full"
          >
            <img 
              src={report.imageUrl} 
              alt="舌象照片" 
              className="w-full rounded-2xl"
            />
            <button
              onClick={() => setShowImage(false)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
