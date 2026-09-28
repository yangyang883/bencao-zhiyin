import { healthKnowledge } from '@/lib/knowledge-graph/health-knowledge'
import { tongueTerms } from '@/lib/knowledge-graph/tongue-terms'
import { tongueStandard } from '@/lib/knowledge-graph/tongue-standard'
// 知识图谱查询API
import { NextRequest } from 'next/server'
import { getKnowledgeGraph } from '@/lib/knowledge-graph'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const action = searchParams.get('action')
  const query = searchParams.get('query')

  const graph = getKnowledgeGraph()

  try {
    switch (action) {
      case 'educations':
        return Response.json({ educations: healthKnowledge })

      case 'tongues':
        return Response.json({ tongues: tongueTerms })

      case 'standards':
        return Response.json({ standards: [tongueStandard] })

      case 'stats':
        return Response.json(graph.getStats())

      case 'search':
        if (!query) {
          return Response.json({ error: '请提供搜索关键词' }, { status: 400 })
        }
        const entities = graph.searchEntities(query)
        return Response.json({ entities })

      case 'symptoms':
        return Response.json({ symptoms: graph.getAllSymptoms() })

      case 'diseases':
        return Response.json({ diseases: graph.getAllDiseases() })

      case 'constitutions':
        return Response.json({ constitutions: graph.getAllConstitutions() })

      case 'herbs':
        return Response.json({ herbs: graph.getAllHerbs() })

      case 'acupoints':
        return Response.json({ acupoints: graph.getAllAcupoints() })

      case 'organs':
        return Response.json({ organs: graph.searchEntities('').filter(entity => entity.type === 'organ') })

      case 'foods':
        return Response.json({ foods: graph.getAllFoods() })

      default:
        return Response.json({ 
          error: '无效的操作',
          availableActions: ['educations', 'tongues', 'standards', 'stats', 'search', 'symptoms', 'diseases', 'constitutions', 'herbs', 'acupoints', 'foods']
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Knowledge graph API error:', error)
    return Response.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, symptoms, diseaseId, constitutionId, text } = body

    const graph = getKnowledgeGraph()

    switch (action) {
      case 'diagnose':
        // 根据症状推断疾病
        if (!symptoms || !Array.isArray(symptoms)) {
          return Response.json({ error: '请提供症状列表' }, { status: 400 })
        }
        const diseases = graph.inferDiseasesFromSymptoms(symptoms)
        return Response.json({ diseases })

      case 'therapy':
        // 获取完整调理方案
        if (!symptoms || !Array.isArray(symptoms)) {
          return Response.json({ error: '请提供症状列表' }, { status: 400 })
        }
        const plan = graph.getTherapyPlan(symptoms)
        return Response.json({ plan })

      case 'herbs':
        // 根据疾病获取推荐中药
        if (!diseaseId) {
          return Response.json({ error: '请提供疾病ID' }, { status: 400 })
        }
        const herbs = graph.getHerbsForDisease(diseaseId)
        return Response.json({ herbs })

      case 'acupoints':
        // 根据疾病获取推荐穴位
        if (!diseaseId) {
          return Response.json({ error: '请提供疾病ID' }, { status: 400 })
        }
        const acupoints = graph.getAcupointsForDisease(diseaseId)
        return Response.json({ acupoints })

      case 'diet':
        // 根据体质获取饮食建议
        if (!constitutionId) {
          return Response.json({ error: '请提供体质ID' }, { status: 400 })
        }
        const diet = graph.getDietForConstitution(constitutionId)
        return Response.json({ diet })

      case 'extract':
        // 从文本中提取症状
        if (!text) {
          return Response.json({ error: '请提供文本内容' }, { status: 400 })
        }
        const extractedSymptoms = graph.extractSymptoms(text)
        return Response.json({ symptoms: extractedSymptoms })

      case 'analyze':
        // 完整的文本分析：提取症状 -> 推断疾病 -> 生成方案
        if (!text) {
          return Response.json({ error: '请提供文本内容' }, { status: 400 })
        }
        const foundSymptoms = graph.extractSymptoms(text)
        if (foundSymptoms.length === 0) {
          return Response.json({ 
            message: '未能识别出明确的症状关键词，请描述您的具体不适',
            symptoms: [],
            plan: null
          })
        }
        const therapyPlan = graph.getTherapyPlan(foundSymptoms)
        return Response.json({ 
          symptoms: foundSymptoms,
          plan: therapyPlan 
        })

      default:
        return Response.json({ 
          error: '无效的操作',
          availableActions: ['diagnose', 'therapy', 'herbs', 'acupoints', 'diet', 'extract', 'analyze']
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Knowledge graph API error:', error)
    return Response.json({ error: '服务器错误' }, { status: 500 })
  }
}
