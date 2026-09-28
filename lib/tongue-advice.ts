import { z } from 'zod'
import knowledge from './knowledge-graph/tongue-advice.json'
import { tongueFeatures } from './tongue-features'

export const symptomQuestions = [
  { key: 'breathing', label: '现在是否呼吸困难？' },
  { key: 'suddenSwelling', label: '嘴唇、舌头或咽喉是否突然肿胀？' },
  { key: 'dryMouth', label: '是否感觉口干？' },
  { key: 'pain', label: '舌头或口腔是否疼痛？' },
  { key: 'ulcer', label: '自己是否观察到口腔溃疡？' },
  { key: 'whitePatch', label: '自己是否观察到白色斑块（不是模型的白苔标签）？' },
  { key: 'eatingDifficulty', label: '是否因不适难以进食或吞咽？' },
  { key: 'worsening', label: '不适是否持续加重，或出现出血？' },
] as const
const answer = z.enum(['yes', 'no', 'unknown']).default('unknown')
export const detectorLabels = ['red_tongue','purple_tongue','swollen_tongue','thin_tongue','red_spots','cracks','tooth_marks','white_coating','yellow_coating','black_coating'] as const
const detectorNames = ['红舌','紫舌','胖大','瘦薄','红点','裂纹','齿痕','白苔','黄苔','黑苔']
export const adviceInputSchema = z.object({
  analysis: z.object({
    source: z.string().max(60).optional(),
    class_name: z.enum(['黑舌','紫舌','白舌']).optional(),
    features: z.record(z.string().max(80)).refine(v => Object.keys(v).length <= 12).optional(),
    detections: z.array(z.object({label:z.enum(detectorLabels),model_score:z.number().finite().min(0).max(1)})).max(300).optional(),
  }).optional(),
  symptoms: z.object({ breathing:answer, suddenSwelling:answer, dryMouth:answer, pain:answer,
    ulcer:answer, whitePatch:answer, eatingDifficulty:answer, worsening:answer }).default({}),
  ulcerDays: z.number().int().min(0).max(3650).nullable().default(null),
  group: z.enum(['adult','child','pregnant','unknown']).default('unknown'),
  description: z.string().trim().max(1000).default(''),
})
export type AdviceInput = z.infer<typeof adviceInputSchema>

export function generateTongueAdvice(input: AdviceInput) {
  const s = input.symptoms
  const observations: string[] = [], limits: string[] = [], questions: string[] = []
  const selfCare: { text:string; sourceId:string }[] = []
  const matched = new Set<string>()
  if (input.analysis?.source === 'local-qwen-vl') {
    for (const f of tongueFeatures) {
      const value = input.analysis.features?.[f.key]
      observations.push(`${f.name}：${f.values.includes(value as never) ? `模型观察为${value}，待核对` : '无法判断'}。`)
    }
    limits.push('通用视觉模型的外观结果未经舌象专科准确率验证，不能据此确定病因或体质。')
  } else if (input.analysis?.source === 'local-yolov8n') {
    const labels = [...new Set(input.analysis.detections?.map(d => d.label) || [])]
    observations.push(...labels.map(label => `检测到疑似${detectorNames[detectorLabels.indexOf(label)]}，待人工核对。`))
    if (!labels.length) observations.push('没有可供解释的检测结果；未检出不代表正常。')
    limits.push('当前十类模型对红点、裂纹、齿痕、紫舌等表现较弱；黑苔测试样本极少。检测分数不是医学概率，未训练项目保持未知。')
  } else if (input.analysis?.source === 'local-resnet18') {
    observations.push(`旧三分类输出：${input.analysis.class_name || '未知'}，仅供模型演示。`)
    limits.push('旧三分类不能区分舌体颜色与舌苔，不能据此补出舌形、白苔或疾病结论。')
  } else {
    observations.push('没有可解释的本地舌象结果；仍可根据你确认的不适提供一般信息。')
  }
  const urgent = s.breathing === 'yes' || s.suddenSwelling === 'yes'
  const incomplete = s.breathing === 'unknown' || s.suddenSwelling === 'unknown'
  const textNeedsReview = /呼吸|喘|憋气|肿|吞咽|出血|晕|昏/.test(input.description)
  const prompt = s.whitePatch === 'yes' || s.eatingDifficulty === 'yes' || s.worsening === 'yes' ||
    (s.ulcer === 'yes' && input.ulcerDays !== null && input.ulcerDays > 21)
  const level = urgent ? 'emergency' : prompt ? 'prompt' : incomplete || textNeedsReview ? 'incomplete' : 'general'
  let care = '仅提供一般信息，不能据此排除疾病。不适持续或加重，请找医生或口腔科检查。'
  if (urgent) {
    matched.add('emergency')
    care = knowledge.entries.find(e => e.id === 'emergency')!.summary
  } else {
    if (textNeedsReview) questions.push('补充文字提到了需要优先核对的情况（也可能是否定或过去的经历）。系统不自动判断其含义，请核对当前症状选项；若当前有呼吸困难或突然肿胀，立即寻求急救。')
    if (incomplete) questions.push('先确认是否存在呼吸困难、嘴唇/舌头/咽喉突然肿胀；尚未回答不能视为没有。若存在，立即寻求急救。')
    if (prompt) care = '你确认的白斑、进食困难、加重/出血，或超过三周的溃疡中有需检查的情况，请尽快联系医生或口腔科。若出现呼吸困难或突然肿胀，立即寻求急救。'
    if (s.whitePatch === 'yes' || s.pain === 'yes' || s.worsening === 'yes') matched.add('oral-care')
    if (s.ulcer === 'yes') {
      matched.add('ulcer')
      if (input.ulcerDays === null) questions.push('这处溃疡已经持续多少天？超过三周仍未好需要检查，不要因为等待满三周而延误加重症状。')
    }
    if (s.eatingDifficulty === 'yes' || s.dryMouth === 'yes') matched.add('dry-mouth')
    // Missing safety answers never become negative answers; no individualized care until confirmed.
    if (!incomplete && !textNeedsReview && s.eatingDifficulty === 'no' && s.worsening === 'no' && input.group === 'adult') {
      if (s.dryMouth === 'yes') selfCare.push({text:'能正常吞咽且没有医生限水要求时，可少量多次饮水。不要因怀疑口干与药物有关就自行停药。',sourceId:'dry-mouth'})
      if (s.pain === 'yes' || s.ulcer === 'yes') selfCare.push({text:'用软毛牙刷清洁，暂时避开辛辣、酸性和过烫食物饮品，以及烟酒刺激。',sourceId:'oral-care'})
    }
    if (input.group !== 'adult') questions.push('本模块不提供儿童、孕哺期或人群信息不明时的个体化护理方案；有不适请由医生评估。')
    if (s.eatingDifficulty === 'unknown' || s.worsening === 'unknown') questions.push('请补充是否影响进食吞咽、是否加重或出血，未确认前不生成针对性护理步骤。')
    if (symptomQuestions.slice(2).every(q => s[q.key] !== 'yes')) questions.push('目前没有确认具体不适；可补充口干、疼痛、溃疡等情况。没有勾选不等于没有症状。')
  }
  selfCare.forEach(item => matched.add(item.sourceId))
  if (incomplete || textNeedsReview) matched.add('emergency')
  limits.push('照片不能确诊疾病或体质，不提供药名、剂量、处方或停药指令。未检出、低分或未知项目都不等于正常。')
  limits.push('建议依据已确认的症状选项生成；补充文字仅记录，不自动抽取否定、时间或急症含义，请在选项中明确确认。')
  const sources = knowledge.entries.filter(e => matched.has(e.id))
  const confirmed = symptomQuestions.filter(q => s[q.key] === 'yes').map(q => q.label.replace(/是否|自己|现在|？/g,''))
  const speechText = urgent ? care : [care, '舌象外观仅供核对。', ...observations, ...selfCare.map(x=>x.text), ...questions,
    '以上是一般健康信息，不能替代专业诊疗。'].join('\n')
  return {version:knowledge.version,source:'local-knowledge-rules' as const,review:knowledge.review,
    level,care,confirmed,observations,selfCare,questions,limits,sources,speechText,
    text:[speechText,...limits,'参考来源：',...sources.map(e=>`${e.sourceTitle}：${e.url}${e.additionalUrl ? '；'+e.additionalUrl : ''}`)].join('\n')}
}
export type TongueAdvice = ReturnType<typeof generateTongueAdvice>
