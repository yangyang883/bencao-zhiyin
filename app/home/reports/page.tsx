'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ReportDetail } from '@/components/report-detail'
import { cn } from '@/lib/utils'
import { getAllReports, deleteReport, getReportStatus, type Report } from '@/lib/report-store'
import Link from 'next/link'

const typeConfig = {
  tongue: {
    label: '舌诊',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    color: 'bg-primary/20 text-primary',
  },
  consultation: {
    label: '咨询',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'bg-herbal-green/20 text-herbal-green',
  },
  constitution: {
    label: '体质',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'bg-warm-gold/20 text-warm-gold',
  },
}



export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [filter, setFilter] = useState<'all' | 'tongue' | 'consultation' | 'constitution'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // 加载报告
  const loadReports = () => {
    const storedReports = getAllReports()
    setReports(storedReports)
    setIsLoading(false)
  }

  useEffect(() => {
    loadReports()

    // 监听报告更新事件
    const handleUpdate = () => loadReports()
    window.addEventListener('reportsUpdated', handleUpdate)
    
    return () => {
      window.removeEventListener('reportsUpdated', handleUpdate)
    }
  }, [])

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.type === filter)

  const handleDelete = (id: string) => {
    deleteReport(id)
    setDeleteConfirm(null)
    loadReports()
  }

  const getReportCount = (type: 'tongue' | 'consultation' | 'constitution') => {
    return reports.filter(r => r.type === type).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* 头部 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="px-4 py-4">
          <h1 className="text-xl font-serif font-bold text-foreground">健康报告</h1>
          <p className="text-sm text-muted-foreground">
            共 {reports.length} 份报告
          </p>
        </div>
        
        {/* 筛选标签 */}
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { value: 'all', label: '全部', count: reports.length },
            { value: 'tongue', label: '舌诊报告', count: getReportCount('tongue') },
            { value: 'consultation', label: '咨询报告', count: getReportCount('consultation') },
            { value: 'constitution', label: '体质报告', count: getReportCount('constitution') },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value as typeof filter)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2',
                filter === item.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {item.label}
              {item.count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  filter === item.value
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted-foreground/20 text-muted-foreground'
                )}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full"
            />
          </div>
        ) : filteredReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-muted-foreground mb-4">暂无报告记录</p>
            <Link href="/home/tongue">
              <Button className="bg-gradient-to-r from-primary to-accent">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                开始舌诊
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div
                  onClick={() => setSelectedReport(report)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* 类型图标或舌象图片 */}
                    {report.type === 'tongue' && report.imageUrl ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border/50">
                        <img 
                          src={report.imageUrl} 
                          alt="舌象" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        typeConfig[report.type].color
                      )}>
                        {typeConfig[report.type].icon}
                      </div>
                    )}
                    
                    {/* 报告信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {report.title}
                        </h3>
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ml-2',
                          getReportStatus(report).color
                        )}>
                          {getReportStatus(report).label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 truncate">
                        {report.summary}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            typeConfig[report.type].color
                          )}>
                            {typeConfig[report.type].label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.date} {report.time}
                          </span>
                        </div>
                        <span className="text-xs text-primary flex items-center gap-1">
                          查看详情
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 删除确认 */}
                <AnimatePresence>
                  {deleteConfirm === report.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 bg-destructive/5"
                    >
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-sm text-destructive">确定删除此报告？</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            取消
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(report.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 操作按钮 */}
                {deleteConfirm !== report.id && (
                  <div className="border-t border-border/50 px-4 py-2 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(report.id)
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* 快捷入口 */}
        {reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">继续健康检测</h3>
                <p className="text-sm text-muted-foreground">定期检测，关注健康变化</p>
              </div>
              <Link href="/home/tongue">
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                  舌诊
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>

      {/* 报告详情弹窗 */}
      <AnimatePresence>
        {selectedReport && (
          <ReportDetail
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
