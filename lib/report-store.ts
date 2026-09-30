import { getSettings, localDate } from './device-store'
// 报告存储服务 - 使用 localStorage 进行持久化存储

export interface TongueAnalysisDetail {
  category: string
  status: string
  description: string
}

export interface TongueAnalysis {
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
  details: TongueAnalysisDetail[]
}

export interface Report {
  id: string
  type: 'tongue' | 'consultation' | 'constitution'
  title: string
  date: string
  time: string
  summary: string
  status: 'good' | 'warning' | 'attention'
  content: string
  imageUrl?: string
  analysis?: TongueAnalysis
}

const STORAGE_KEY = 'bencao_health_reports'

export function getReportStatus(report: Pick<Report, 'status' | 'analysis'>) {
  if (report.analysis?.source?.startsWith('local-')) return { label: '待核对', color: 'bg-muted text-muted-foreground border-border' }
  return {
    good: { label: '良好', color: 'bg-herbal-green/20 text-herbal-green border-herbal-green/30' },
    warning: { label: '注意', color: 'bg-warm-gold/20 text-warm-gold border-warm-gold/30' },
    attention: { label: '需关注', color: 'bg-destructive/20 text-destructive border-destructive/30' },
  }[report.status] || { label: '待核对', color: 'bg-muted text-muted-foreground border-border' }
}

// 获取所有报告
export function getAllReports(): Report[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const data = JSON.parse(stored)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to get reports:', error)
    return []
  }
}

// 保存报告
export function saveReport(report: Report): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const reports = getAllReports()
    // 添加到列表开头
    reports.unshift(report)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
    
    // 触发自定义事件通知其他组件
    window.dispatchEvent(new CustomEvent('reportsUpdated'))
    return true
  } catch (error) {
    console.error('Failed to save report:', error)
    return false
  }
}

// 根据ID获取报告
export function getReportById(id: string): Report | null {
  const reports = getAllReports()
  return reports.find(r => r.id === id) || null
}

// 删除报告
export function deleteReport(id: string): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const reports = getAllReports()
    const filtered = reports.filter(r => r.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent('reportsUpdated'))
    return true
  } catch (error) {
    console.error('Failed to delete report:', error)
    return false
  }
}

// 清空所有报告
export function clearAllReports(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('reportsUpdated'))
    return true
  } catch (error) {
    console.error('Failed to clear reports:', error)
    return false
  }
}

// 根据类型筛选报告
export function getReportsByType(type: 'tongue' | 'consultation' | 'constitution'): Report[] {
  const reports = getAllReports()
  return reports.filter(r => r.type === type)
}

// 生成报告ID
export function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 根据舌诊分析生成报告内容
export function generateTongueReportContent(analysis: TongueAnalysis): string {
  if (analysis.source === 'local-yolov8n') return ['本草知音十类舌象外观检测（离线，待人工核对）', analysis.tongueColor, analysis.tongueShape, analysis.coating, ...analysis.details.map(d => `${d.category}：${d.description}`), ...analysis.suggestions, analysis.constitution].join('\n\n')
  if (analysis.source === 'local-qwen-vl') return ['本草知音舌象外观细分类（试验，待人工核对）', ...analysis.details.map(d => `${d.category}：${d.description}`), ...analysis.suggestions, analysis.constitution].join('\n\n')
  if (analysis.source === 'local-resnet18') return [
    '本草知音离线模型演示报告', analysis.tongueColor,
    ...analysis.details.map(d => `${d.category}：${d.description}`),
    '本模型未识别舌形、未独立识别舌苔、不能判断体质。',
    ...analysis.suggestions,
  ].join('\n\n')
  return `
您好，根据您的舌象分析，以下是详细报告：

一、舌质分析
您的舌色呈${analysis.tongueColor}，${analysis.details.find(d => d.category === '舌色')?.description || '舌色正常'}

二、舌形分析
您的舌形为${analysis.tongueShape}，${analysis.details.find(d => d.category === '舌形')?.description || '舌形正常'}

三、舌苔分析
您的舌苔为${analysis.coating}，${analysis.details.find(d => d.category === '舌苔')?.description || '舌苔正常'}

四、体质判断
综合分析，您属于${analysis.constitution}。

五、养生建议
${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

六、详细指标
${analysis.details.map(d => `• ${d.category}（${d.status}）：${d.description}`).join('\n')}

祝您身体健康！

【报告说明】
本报告由"本草知音"AI智能舌诊系统生成，结合中医舌诊理论和知识图谱分析。
报告仅供参考，如有健康问题请咨询专业医师。
  `.trim()
}

// 根据舌诊分析判断状态
export function analyzeStatus(analysis: TongueAnalysis): 'good' | 'warning' | 'attention' {
  if (analysis.source === 'local-yolov8n') return 'warning'
  if (analysis.source === 'local-qwen-vl') return 'warning'
  if (analysis.source === 'local-resnet18') return 'warning'
  const normalStatuses = analysis.details.filter(d => d.status === '正常').length
  const totalDetails = analysis.details.length
  
  if (normalStatuses === totalDetails) {
    return 'good'
  } else if (normalStatuses >= totalDetails / 2) {
    return 'warning'
  } else {
    return 'attention'
  }
}

// 创建舌诊报告
export function createTongueReport(analysis: TongueAnalysis, imageUrl?: string): Report {
  const now = new Date()
  const date = localDate(now)
  const time = now.toTimeString().split(' ')[0].substring(0, 5)
  
  return {
    id: generateReportId(),
    type: 'tongue',
    title: '舌诊分析报告',
    date,
    time,
    summary: analysis.source === 'local-yolov8n' ? `十类外观检测（待核对）：${analysis.tongueColor}；${analysis.coating}` : analysis.source === 'local-qwen-vl' ? `舌象外观细分类（待核对）：${analysis.tongueColor}` : analysis.source === 'local-resnet18' ? `离线模型演示：${analysis.tongueColor}` : `体质：${analysis.constitution}，舌象：${analysis.tongueColor}`,
    status: analyzeStatus(analysis),
    content: generateTongueReportContent(analysis),
    imageUrl: getSettings().savePhotos ? imageUrl : undefined,
    analysis,
  }
}

// 创建咨询报告
export function createConsultationReport(
  summary: string, 
  content: string,
  status: 'good' | 'warning' | 'attention' = 'good'
): Report {
  const now = new Date()
  const date = localDate(now)
  const time = now.toTimeString().split(' ')[0].substring(0, 5)
  
  return {
    id: generateReportId(),
    type: 'consultation',
    title: '健康咨询报告',
    date,
    time,
    summary,
    status,
    content,
  }
}
