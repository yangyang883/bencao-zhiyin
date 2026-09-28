import { healthKnowledge } from './health-knowledge'
import { tongueTerms } from './tongue-terms'
// 中医知识图谱推理引擎

import {
  Entity,
  Relation,
  EntityType,
  RelationType,
  getAllEntities,
  getAllRelations,
  symptoms,
  diseases,
  constitutions,
  herbs,
  acupoints,
  foods,
  organs,
} from './data'

// 知识图谱类
export class TCMKnowledgeGraph {
  private entities: Map<string, Entity>
  private relations: Relation[]
  private entityIndex: Map<string, Entity[]> // 按名称/别名索引
  private relationIndex: Map<string, Relation[]> // 按源实体索引

  constructor() {
    this.entities = new Map()
    this.relations = getAllRelations()
    this.entityIndex = new Map()
    this.relationIndex = new Map()
    this.buildIndex()
  }

  // 构建索引
  private buildIndex() {
    const allEntities = getAllEntities()
    
    // 构建实体Map
    for (const entity of allEntities) {
      this.entities.set(entity.id, entity)
      
      // 构建名称索引
      const names = [entity.name, ...(entity.aliases || [])]
      for (const name of names) {
        const normalizedName = name.toLowerCase()
        if (!this.entityIndex.has(normalizedName)) {
          this.entityIndex.set(normalizedName, [])
        }
        this.entityIndex.get(normalizedName)!.push(entity)
      }
    }

    // 构建关系索引
    for (const relation of this.relations) {
      if (!this.relationIndex.has(relation.source)) {
        this.relationIndex.set(relation.source, [])
      }
      this.relationIndex.get(relation.source)!.push(relation)
    }
  }

  // 根据ID获取实体
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id)
  }

  // 根据名称搜索实体
  searchEntities(query: string): Entity[] {
    const normalizedQuery = query.toLowerCase()
    const results: Entity[] = []
    
    for (const [name, entities] of this.entityIndex) {
      if (name.includes(normalizedQuery) || normalizedQuery.includes(name)) {
        for (const entity of entities) {
          if (!results.find(e => e.id === entity.id)) {
            results.push(entity)
          }
        }
      }
    }
    
    return results
  }

  // 只按名称和别名取知识条目，不把关键词匹配当作诊断。
  getEducationalContext(text: string): string {
    return this.searchEntities(text).filter(entity => entity.type !== 'education').slice(0, 4).map(entity => {
      const fields = Object.entries(entity.properties || {})
        .filter(([key]) => ['观察要点', '日常管理', '记录方式', '食用方式', '使用边界', '用药安全', '来源', '核验状态'].includes(key))
        .map(([key, value]) => key + '：' + (Array.isArray(value) ? value.join('；') : value));
      return [entity.name + '：' + (entity.description || ''), ...fields].join('\n');
    }).join('\n\n');
  }

  // 获取与实体相关的关系
  getRelationsFrom(entityId: string): Relation[] {
    return this.relationIndex.get(entityId) || []
  }

  // 获取指向实体的关系
  getRelationsTo(entityId: string): Relation[] {
    return this.relations.filter(r => r.target === entityId)
  }

  // 根据症状推断可能的疾病/证型
  inferDiseasesFromSymptoms(symptomNames: string[]): Array<{disease: Entity, confidence: number, matchedSymptoms: string[]}> {
    const diseaseScores = new Map<string, {score: number, symptoms: string[]}>()
    
    for (const symptomName of symptomNames) {
      const symptomEntities = this.searchEntities(symptomName).filter(e => e.type === 'symptom')
      
      for (const symptom of symptomEntities) {
        const relations = this.getRelationsFrom(symptom.id).filter(r => r.type === 'causes')
        
        for (const relation of relations) {
          const disease = this.getEntity(relation.target)
          if (disease && disease.type === 'disease') {
            if (!diseaseScores.has(disease.id)) {
              diseaseScores.set(disease.id, {score: 0, symptoms: []})
            }
            const current = diseaseScores.get(disease.id)!
            current.score += relation.weight || 0.5
            current.symptoms.push(symptom.name)
          }
        }
      }
    }
    
    // 转换为数组并排序
    const results: Array<{disease: Entity, confidence: number, matchedSymptoms: string[]}> = []
    for (const [diseaseId, data] of diseaseScores) {
      const disease = this.getEntity(diseaseId)
      if (disease) {
        results.push({
          disease,
          confidence: Math.min(data.score / symptomNames.length, 1),
          matchedSymptoms: data.symptoms
        })
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }

  // 根据疾病获取推荐的中药
  getHerbsForDisease(diseaseId: string): Array<{herb: Entity, relevance: number}> {
    const results: Array<{herb: Entity, relevance: number}> = []
    
    for (const relation of this.relations) {
      if (relation.target === diseaseId && relation.type === 'treats') {
        const herb = this.getEntity(relation.source)
        if (herb && herb.type === 'herb') {
          results.push({
            herb,
            relevance: relation.weight || 0.5
          })
        }
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance)
  }

  // 根据疾病获取推荐的穴位
  getAcupointsForDisease(diseaseId: string): Array<{acupoint: Entity, relevance: number}> {
    const results: Array<{acupoint: Entity, relevance: number}> = []
    
    for (const relation of this.relations) {
      if (relation.target === diseaseId && relation.type === 'treats') {
        const acupoint = this.getEntity(relation.source)
        if (acupoint && acupoint.type === 'acupoint') {
          results.push({
            acupoint,
            relevance: relation.weight || 0.5
          })
        }
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance)
  }

  // 根据体质获取饮食建议
  getDietForConstitution(constitutionId: string): {suitable: Entity[], contraindicated: Entity[]} {
    const suitable: Entity[] = []
    const contraindicated: Entity[] = []
    
    for (const relation of this.relations) {
      if (relation.target === constitutionId) {
        const food = this.getEntity(relation.source)
        if (food && food.type === 'food') {
          if (relation.type === 'suitable_for') {
            suitable.push(food)
          } else if (relation.type === 'contraindicated') {
            contraindicated.push(food)
          }
        }
      }
    }
    
    return { suitable, contraindicated }
  }

  // 获取完整的调理方案
  getTherapyPlan(symptomNames: string[]): TherapyPlan {
    // 推断疾病
    const diseases = this.inferDiseasesFromSymptoms(symptomNames)
    const primaryDisease = diseases[0]
    
    if (!primaryDisease) {
      return {
        symptoms: symptomNames,
        diseases: [],
        constitution: null,
        herbs: [],
        acupoints: [],
        foods: { suitable: [], contraindicated: [] },
        advice: []
      }
    }

    // 获取相关体质
    const constitutionRelation = this.getRelationsFrom(primaryDisease.disease.id)
      .find(r => r.type === 'belongs_to')
    const constitution = constitutionRelation 
      ? this.getEntity(constitutionRelation.target) ?? null
      : null

    // 获取推荐中药
    const herbs = this.getHerbsForDisease(primaryDisease.disease.id).slice(0, 5)

    // 获取推荐穴位
    const acupoints = this.getAcupointsForDisease(primaryDisease.disease.id).slice(0, 4)

    // 获取饮食建议
    const foods = constitution 
      ? this.getDietForConstitution(constitution.id)
      : { suitable: [], contraindicated: [] }

    // 生成调理建议
    const advice = this.generateAdvice(primaryDisease.disease, constitution, herbs, acupoints)

    return {
      symptoms: symptomNames,
      diseases: diseases.slice(0, 3),
      constitution,
      herbs,
      acupoints,
      foods,
      advice
    }
  }

  // 生成调理建议文本
  private generateAdvice(
    disease: Entity, 
    constitution: Entity | null, 
    herbs: Array<{herb: Entity, relevance: number}>,
    acupoints: Array<{acupoint: Entity, relevance: number}>
  ): string[] {
    const advice: string[] = []
    
    // 基于证型的建议
    if (disease.properties?.['治则']) {
      advice.push(`传统理论中的治则：${disease.properties['治则']}`)
    }
    
    // 中药建议
    if (herbs.length > 0) {
      const herbNames = herbs.slice(0, 3).map(h => h.herb.name).join('、')
      advice.push(`关联药材知识：${herbNames}。仅供学习，用药请咨询医师或药师`)
    }
    
    // 穴位建议
    if (acupoints.length > 0) {
      const acuNames = acupoints.slice(0, 3).map(a => a.acupoint.name).join('、')
      advice.push(`关联穴位知识：${acuNames}。操作需专业指导，请勿自行针刺`)
    }
    
    // 体质建议
    if (constitution && constitution.properties?.['调养']) {
      advice.push(`体质调养：${constitution.properties['调养']}`)
    }
    
    return advice
  }

  // 从文本中提取症状关键词
  extractSymptoms(text: string): string[] {
    const foundSymptoms: string[] = []
    
    for (const symptom of symptoms) {
      const names = [symptom.name, ...(symptom.aliases || [])]
      for (const name of names) {
        if (text.includes(name) && !foundSymptoms.includes(symptom.name)) {
          foundSymptoms.push(symptom.name)
          break
        }
      }
    }
    
    return foundSymptoms
  }

  // 获取所有症状
  getAllSymptoms(): Entity[] {
    return symptoms
  }

  // 获取所有体质
  getAllConstitutions(): Entity[] {
    return constitutions
  }

  // 获取所有中药
  getAllHerbs(): Entity[] {
    return herbs
  }

  // 获取所有穴位
  getAllAcupoints(): Entity[] {
    return acupoints
  }

  // 获取所有脏腑
  getAllOrgans(): Entity[] {
    return organs
  }

  // 获取所有食材
  getAllFoods(): Entity[] {
    return foods
  }

  // 获取所有疾病
  getAllDiseases(): Entity[] {
    return diseases
  }

  // 获取图谱统计信息
  getStats(): GraphStats {
    return {
      totalEntities: this.entities.size,
      totalRelations: this.relations.length,
      entityCounts: {
        symptoms: symptoms.length,
        diseases: diseases.length,
        constitutions: constitutions.length,
        herbs: herbs.length,
        acupoints: acupoints.length,
        organs: organs.length,
        foods: foods.length,
        tongues: tongueTerms.length,
        educations: healthKnowledge.length,
      }
    }
  }
}

// 调理方案接口
export interface TherapyPlan {
  symptoms: string[]
  diseases: Array<{disease: Entity, confidence: number, matchedSymptoms: string[]}>
  constitution: Entity | null
  herbs: Array<{herb: Entity, relevance: number}>
  acupoints: Array<{acupoint: Entity, relevance: number}>
  foods: {suitable: Entity[], contraindicated: Entity[]}
  advice: string[]
}

// 图谱统计接口
export interface GraphStats {
  totalEntities: number
  totalRelations: number
  entityCounts: {
    symptoms: number
    diseases: number
    constitutions: number
    herbs: number
    acupoints: number
    organs: number
    foods: number
    tongues: number
    educations: number
  }
}

// 单例实例
let graphInstance: TCMKnowledgeGraph | null = null

export function getKnowledgeGraph(): TCMKnowledgeGraph {
  if (!graphInstance) {
    graphInstance = new TCMKnowledgeGraph()
  }
  return graphInstance
}
