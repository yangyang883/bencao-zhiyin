import records from './health-knowledge.json'
import type { Entity } from './data'

export const healthKnowledge: Entity[] = records.map(record => ({
 id: record.id, name: record.title, type: 'education',
 aliases: [record.id, ...record.keywords], description: record.content,
 properties: {
  '内容用途': '健康科普与教学知识检索，不作为诊断依据',
  '分类': record.category, '适用场景': record.applicability,
  '使用边界': record.limitations, '来源': record.source_title,
  '来源链接': record.source_url, '来源位置': record.source_locator || '未提供',
  '来源版本': record.source_version, '许可': record.license,
  '内容类型': record.content_type,
  '原稿核验声明': record.verification_status + '（原稿日期：' + record.verified_at + '）',
  '核验状态': record.import_review, '专业审核': record.clinical_review,
 },
}))
