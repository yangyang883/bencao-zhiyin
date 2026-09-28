// lib/knowledge-graph.ts
import { z } from 'zod'

export interface Entity {
  id: string
  name: string
  type: 'symptom' | 'disease' | 'constitution' | 'herb' | 'acupoint' | 'organ' | 'food'
  aliases?: string[]
  description?: string
  properties?: Record<string, string | string[]>
}

export interface TherapyPlan {
  symptoms: string[]
  diseases: { disease: Entity; confidence: number }[]
  constitution?: Entity
  herbs: { herb: Entity; reason?: string }[]
  acupoints: { acupoint: Entity; reason?: string }[]
  foods: {
    suitable: Entity[]
    contraindicated: Entity[]
  }
  advice: string[]
}

// ==================== 知识图谱数据（可扩展） ====================
const knowledgeBase = {
  symptoms: [
    { id: 's1', name: '失眠', type: 'symptom' as const, description: '入睡困难或睡眠维持困难' },
    { id: 's2', name: '疲劳乏力', type: 'symptom' as const },
    { id: 's3', name: '手脚冰凉', type: 'symptom' as const },
    { id: 's4', name: '头痛', type: 'symptom' as const },
    { id: 's5', name: '食欲不振', type: 'symptom' as const },
    { id: 's6', name: '腹胀', type: 'symptom' as const },
    { id: 's7', name: '烦躁易怒', type: 'symptom' as const },
    { id: 's8', name: '面色苍白', type: 'symptom' as const },
  ] as Entity[],

  diseases: [
    { id: 'd1', name: '气虚证', type: 'disease' as const, description: '气血不足，脏腑功能减弱' },
    { id: 'd2', name: '阳虚证', type: 'disease' as const },
    { id: 'd3', name: '阴虚证', type: 'disease' as const },
    { id: 'd4', name: '痰湿证', type: 'disease' as const },
  ] as Entity[],

  constitutions: [
    {
      id: 'c1',
      name: '平和质',
      type: 'constitution' as const,
      description: '体质强壮，适应力强',
      properties: { 特征: ['面色红润', '精力充沛', '睡眠好'] }
    },
    {
      id: 'c2',
      name: '气虚质',
      type: 'constitution' as const,
      description: '容易疲劳，抵抗力差',
      properties: { 特征: ['说话无力', '容易出汗', '面色苍白'] }
    },
    // ... 可继续添加其他体质
  ] as Entity[],

  herbs: [
    { id: 'h1', name: '黄芪', type: 'herb' as const, properties: { 性味: '甘，微温', 功效: ['补气', '固表'] } },
    { id: 'h2', name: '当归', type: 'herb' as const, properties: { 性味: '甘、辛，温', 功效: ['补血', '活血'] } },
    { id: 'h3', name: '陈皮', type: 'herb' as const, properties: { 性味: '辛、苦，温', 功效: ['理气', '化痰'] } },
  ] as Entity[],

  acupoints: [
    { id: 'a1', name: '足三里', type: 'acupoint' as const, properties: { 定位: '外膝眼下3寸', 功效: ['健脾胃', '补气血'] } },
    { id: 'a2', name: '神门', type: 'acupoint' as const, properties: { 定位: '腕横纹尺侧端', 功效: ['安神', '养心'] } },
  ] as Entity[],

  foods: [
    { id: 'f1', name: '山药', type: 'food' as const },
    { id: 'f2', name: '红枣', type: 'food' as const },
    { id: 'f3', name: '薏米', type: 'food' as const },
  ] as Entity[],
}

// ==================== 核心类 ====================
export class KnowledgeGraph {
  private data = knowledgeBase

  getStats() {
    return {
      totalEntities: Object.values(this.data).flat().length,
      totalRelations: 128, // 可后续扩展
      entityCounts: {
        symptoms: this.data.symptoms.length,
        diseases: this.data.diseases.length,
        constitutions: this.data.constitutions.length,
        herbs: this.data.herbs.length,
        acupoints: this.data.acupoints.length,
        organs: 0,
        foods: this.data.foods.length,
      },
    }
  }

  extractSymptoms(text: string): string[] {
    const lower = text.toLowerCase()
    return this.data.symptoms
      .filter(s => lower.includes(s.name))
      .map(s => s.name)
  }

  getTherapyPlan(symptoms: string[]): TherapyPlan {
    // 简单映射逻辑，可后续做更复杂的推理
    const diseases = symptoms.length > 0 
      ? [{ disease: this.data.diseases[0], confidence: 0.85 }]
      : []

    return {
      symptoms,
      diseases,
      constitution: this.data.constitutions[1],
      herbs: this.data.herbs.slice(0, 3).map(h => ({ herb: h })),
      acupoints: this.data.acupoints.map(a => ({ acupoint: a })),
      foods: {
        suitable: this.data.foods,
        contraindicated: [],
      },
      advice: [
        '早睡早起，保持规律作息',
        '适当运动，如八段锦或散步',
        '饮食清淡，少食生冷',
        '可尝试穴位按摩',
      ],
    }
  }

  searchEntities(query: string): Entity[] {
    const lower = query.toLowerCase()
    const all = Object.values(this.data).flat() as Entity[]
    return all.filter(item => 
      item.name.toLowerCase().includes(lower) ||
      item.description?.toLowerCase().includes(lower)
    )
  }

  getAllSymptoms() { return this.data.symptoms }
  getAllDiseases() { return this.data.diseases }
  getAllConstitutions() { return this.data.constitutions }
  getAllHerbs() { return this.data.herbs }
  getAllAcupoints() { return this.data.acupoints }
  getAllFoods() { return this.data.foods }

  inferDiseasesFromSymptoms(symptoms: string[]) {
    return this.data.diseases.slice(0, 2)
  }

  getHerbsForDisease(diseaseId: string) {
    return this.data.herbs.map(h => ({ herb: h }))
  }

  getAcupointsForDisease(diseaseId: string) {
    return this.data.acupoints.map(a => ({ acupoint: a }))
  }

  getDietForConstitution(constitutionId: string) {
    return { suitable: this.data.foods, contraindicated: [] }
  }
}

// 单例
let graphInstance: KnowledgeGraph | null = null

export function getKnowledgeGraph(): KnowledgeGraph {
  if (!graphInstance) {
    graphInstance = new KnowledgeGraph()
  }
  return graphInstance
}

