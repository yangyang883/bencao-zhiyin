// 用户信息和体质问卷存储服务

export interface ConstitutionAnswer {
  questionId: string
  answer: string
  score: number
}

export interface UserProfile {
  id: string
  name: string
  gender: 'male' | 'female'
  age: number
  phone?: string
  createdAt: string
  constitution?: {
    type: string
    score: number
    answers: ConstitutionAnswer[]
    analyzedAt: string
  }
}

const USER_STORAGE_KEY = 'bencao_user_profile'

// 获取用户信息
export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to get user profile:', error)
    return null
  }
}

// 保存用户信息
export function saveUserProfile(profile: UserProfile): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile))
    window.dispatchEvent(new CustomEvent('userProfileUpdated'))
    return true
  } catch (error) {
    console.error('Failed to save user profile:', error)
    return false
  }
}

// 更新用户体质信息
export function updateUserConstitution(
  constitutionType: string,
  score: number,
  answers: ConstitutionAnswer[]
): boolean {
  const profile = getUserProfile()
  if (!profile) return false
  
  profile.constitution = {
    type: constitutionType,
    score,
    answers,
    analyzedAt: new Date().toISOString(),
  }
  
  return saveUserProfile(profile)
}

// 检查用户是否已登录
export function isUserLoggedIn(): boolean {
  return getUserProfile() !== null
}

// 登出
export function logoutUser(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.removeItem(USER_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('userProfileUpdated'))
    return true
  } catch (error) {
    console.error('Failed to logout:', error)
    return false
  }
}

// 生成用户ID
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 体质问卷题目
export interface ConstitutionQuestion {
  id: string
  question: string
  options: {
    label: string
    value: string
    scores: Record<string, number> // 每个选项对不同体质的得分
  }[]
}

export const constitutionQuestions: ConstitutionQuestion[] = [
  {
    id: 'q1',
    question: '您是否经常感到疲劳、乏力？',
    options: [
      { label: '几乎没有', value: 'never', scores: { '平和质': 3, '气虚质': 0, '阳虚质': 0, '阴虚质': 2, '痰湿质': 1, '湿热质': 2, '血瘀质': 1, '气郁质': 1, '特禀质': 2 } },
      { label: '偶尔', value: 'sometimes', scores: { '平和质': 2, '气虚质': 1, '阳虚质': 1, '阴虚质': 1, '痰湿质': 2, '湿热质': 1, '血瘀质': 2, '气郁质': 2, '特禀质': 1 } },
      { label: '经常', value: 'often', scores: { '平和质': 0, '气虚质': 3, '阳虚质': 2, '阴虚质': 1, '痰湿质': 2, '湿热质': 1, '血瘀质': 2, '气郁质': 2, '特禀质': 1 } },
    ],
  },
  {
    id: 'q2',
    question: '您是否容易怕冷、手脚发凉？',
    options: [
      { label: '几乎没有', value: 'never', scores: { '平和质': 3, '气虚质': 1, '阳虚质': 0, '阴虚质': 2, '痰湿质': 2, '湿热质': 3, '血瘀质': 1, '气郁质': 2, '特禀质': 2 } },
      { label: '偶尔', value: 'sometimes', scores: { '平和质': 2, '气虚质': 2, '阳虚质': 1, '阴虚质': 1, '痰湿质': 2, '湿热质': 2, '血瘀质': 2, '气郁质': 2, '特禀质': 1 } },
      { label: '经常', value: 'often', scores: { '平和质': 0, '气虚质': 2, '阳虚质': 3, '阴虚质': 0, '痰湿质': 1, '湿热质': 0, '血瘀质': 2, '气郁质': 1, '特禀质': 1 } },
    ],
  },
  {
    id: 'q3',
    question: '您是否容易口干舌燥、喜欢喝水？',
    options: [
      { label: '几乎没有', value: 'never', scores: { '平和质': 3, '气虚质': 2, '阳虚质': 2, '阴虚质': 0, '痰湿质': 2, '湿热质': 1, '血瘀质': 2, '气郁质': 2, '特禀质': 2 } },
      { label: '偶尔', value: 'sometimes', scores: { '平和质': 2, '气虚质': 1, '阳虚质': 2, '阴虚质': 1, '痰湿质': 2, '湿热质': 2, '血瘀质': 2, '气郁质': 2, '特禀质': 1 } },
      { label: '经常', value: 'often', scores: { '平和质': 0, '气虚质': 1, '阳虚质': 1, '阴虚质': 3, '痰湿质': 1, '湿热质': 2, '血瘀质': 1, '气郁质': 1, '特禀质': 1 } },
    ],
  },
  {
    id: 'q4',
    question: '您的体型属于？',
    options: [
      { label: '匀称适中', value: 'normal', scores: { '平和质': 3, '气虚质': 1, '阳虚质': 1, '阴虚质': 2, '痰湿质': 0, '湿热质': 1, '血瘀质': 2, '气郁质': 2, '特禀质': 2 } },
      { label: '偏瘦', value: 'thin', scores: { '平和质': 1, '气虚质': 2, '阳虚质': 1, '阴虚质': 3, '痰湿质': 0, '湿热质': 1, '血瘀质': 2, '气郁质': 2, '特禀质': 1 } },
      { label: '偏胖', value: 'fat', scores: { '平和质': 0, '气虚质': 2, '阳虚质': 2, '阴虚质': 0, '痰湿质': 3, '湿热质': 2, '血瘀质': 1, '气郁质': 1, '特禀质': 1 } },
    ],
  },
  {
    id: 'q5',
    question: '您的睡眠质量如何？',
    options: [
      { label: '很好，容易入睡', value: 'good', scores: { '平和质': 3, '气虚质': 2, '阳虚质': 2, '阴虚质': 1, '痰湿质': 2, '湿热质': 2, '血瘀质': 2, '气郁质': 1, '特禀质': 2 } },
      { label: '一般，偶尔失眠', value: 'normal', scores: { '平和质': 2, '气虚质': 2, '阳虚质': 2, '阴虚质': 2, '痰湿质': 2, '湿热质': 2, '血瘀质': 2, '气郁质': 2, '特禀质': 1 } },
      { label: '较差，经常失眠', value: 'poor', scores: { '平和质': 0, '气虚质': 1, '阳虚质': 1, '阴虚质': 3, '痰湿质': 1, '湿热质': 2, '血瘀质': 2, '气郁质': 3, '特禀质': 1 } },
    ],
  },
  {
    id: 'q6',
    question: '您是否容易出汗？',
    options: [
      { label: '正常出汗', value: 'normal', scores: { '平和质': 3, '气虚质': 1, '阳虚质': 2, '阴虚质': 1, '痰湿质': 2, '湿热质': 1, '血瘀质': 2, '气郁质': 2, '特禀质': 2 } },
      { label: '稍活动就出汗', value: 'easy', scores: { '平和质': 1, '气虚质': 3, '阳虚质': 2, '阴虚质': 2, '痰湿质': 2, '湿热质': 2, '血瘀质': 1, '气郁质': 1, '特禀质': 1 } },
      { label: '睡觉时盗汗', value: 'night', scores: { '平和质': 0, '气虚质': 2, '阳虚质': 1, '阴虚质': 3, '痰湿质': 1, '湿热质': 2, '血瘀质': 2, '气郁质': 2, '特禀质': 1 } },
    ],
  },
  {
    id: 'q7',
    question: '您的情绪状态如何？',
    options: [
      { label: '平和稳定', value: 'stable', scores: { '平和质': 3, '气虚质': 2, '阳虚质': 2, '阴虚质': 2, '痰湿质': 2, '湿热质': 2, '血瘀质': 2, '气郁质': 0, '特禀质': 2 } },
      { label: '偶尔焦虑烦躁', value: 'sometimes', scores: { '平和质': 2, '气虚质': 2, '阳虚质': 2, '阴虚质': 2, '痰湿质': 2, '湿热质': 2, '血瘀质': 2, '气郁质': 2, '特禀质': 1 } },
      { label: '经常闷闷不乐', value: 'often', scores: { '平和质': 0, '气虚质': 2, '阳虚质': 2, '阴虚质': 1, '痰湿质': 2, '湿热质': 1, '血瘀质': 2, '气郁质': 3, '特禀质': 1 } },
    ],
  },
  {
    id: 'q8',
    question: '您是否容易过敏（皮肤、鼻子等）？',
    options: [
      { label: '几乎没有', value: 'never', scores: { '平和质': 3, '气虚质': 2, '阳虚质': 2, '阴虚质': 2, '痰湿质': 2, '湿热质': 2, '血瘀质': 2, '气郁质': 2, '特禀质': 0 } },
      { label: '偶尔过敏', value: 'sometimes', scores: { '平和质': 2, '气虚质': 2, '阳虚质': 2, '阴虚质': 2, '痰湿质': 2, '湿热质': 2, '血瘀质': 2, '气郁质': 2, '特禀质': 2 } },
      { label: '经常过敏', value: 'often', scores: { '平和质': 0, '气虚质': 1, '阳虚质': 1, '阴虚质': 1, '痰湿质': 1, '湿热质': 1, '血瘀质': 1, '气郁质': 1, '特禀质': 3 } },
    ],
  },
  {
    id: 'q9',
    question: '您的面色通常是？',
    options: [
      { label: '红润有光泽', value: 'rosy', scores: { '平和质': 3, '气虚质': 1, '阳虚质': 0, '阴虚质': 1, '痰湿质': 1, '湿热质': 2, '血瘀质': 0, '气郁质': 1, '特禀质': 2 } },
      { label: '偏白或萎黄', value: 'pale', scores: { '平和质': 1, '气虚质': 3, '阳虚质': 2, '阴虚质': 1, '痰湿质': 2, '湿热质': 1, '血瘀质': 1, '气郁质': 2, '特禀质': 1 } },
      { label: '偏暗或有斑', value: 'dark', scores: { '平和质': 0, '气虚质': 1, '阳虚质': 1, '阴虚质': 2, '痰湿质': 1, '湿热质': 2, '血瘀质': 3, '气郁质': 2, '特禀质': 1 } },
    ],
  },
  {
    id: 'q10',
    question: '您的大便情况如何？',
    options: [
      { label: '正常成形', value: 'normal', scores: { '平和质': 3, '气虚质': 1, '阳虚质': 1, '阴虚质': 1, '痰湿质': 1, '湿热质': 1, '血瘀质': 2, '气郁质': 2, '特禀质': 2 } },
      { label: '偏软或不成形', value: 'soft', scores: { '平和质': 1, '气虚质': 2, '阳虚质': 3, '阴虚质': 0, '痰湿质': 3, '湿热质': 2, '血瘀质': 1, '气郁质': 1, '特禀质': 1 } },
      { label: '偏干或便秘', value: 'dry', scores: { '平和质': 1, '气虚质': 1, '阳虚质': 0, '阴虚质': 3, '痰湿质': 0, '湿热质': 2, '血瘀质': 2, '气郁质': 2, '特禀质': 1 } },
    ],
  },
]

// 体质类型信息
export const constitutionTypes: Record<string, { name: string; description: string; advice: string[] }> = {
  '平和质': {
    name: '平和质',
    description: '阴阳气血调和，体态适中，面色红润，精力充沛，是最理想的体质状态。',
    advice: ['保持规律作息', '饮食均衡，不偏食', '适度运动，保持心情愉悦', '顺应四时养生'],
  },
  '气虚质': {
    name: '气虚质',
    description: '元气不足，容易疲劳、气短、出汗，抵抗力较弱。',
    advice: ['多食益气健脾食物如山药、黄芪', '避免过度劳累', '适当进行柔和运动如太极', '保证充足睡眠'],
  },
  '阳虚质': {
    name: '阳虚质',
    description: '阳气不足，手脚发凉，喜温怕冷，精神不振。',
    advice: ['多食温阳食物如羊肉、生姜', '注意保暖，避免受寒', '多晒太阳，适当运动', '可用艾灸温补阳气'],
  },
  '阴虚质': {
    name: '阴虚质',
    description: '阴液亏少，口干咽燥，手足心热，容易失眠。',
    advice: ['多食滋阴食物如银耳、百合', '避免熬夜，保证睡眠', '少吃辛辣燥热食物', '保持心态平和'],
  },
  '痰湿质': {
    name: '痰湿质',
    description: '痰湿凝聚，体型肥胖，腹部肥满，面部油脂较多。',
    advice: ['饮食清淡，少食肥甘厚腻', '多食健脾化湿食物如薏米', '坚持运动，控制体重', '避免潮湿环境'],
  },
  '湿热质': {
    name: '湿热质',
    description: '湿热内蕴，面部油腻，口苦口干，身重困倦。',
    advice: ['饮食清淡，多吃清热利湿食物', '避免辛辣油腻食物', '保持大便通畅', '适当运动出汗'],
  },
  '血瘀质': {
    name: '血瘀质',
    description: '血行不畅，肤色晦暗，容易出现瘀斑，记忆力下降。',
    advice: ['多食活血化瘀食物如山楂', '保持适度运动', '避免久坐不动', '保持情绪舒畅'],
  },
  '气郁质': {
    name: '气郁质',
    description: '气机郁滞，情志抑郁，胸闷不舒，容易焦虑。',
    advice: ['保持心情舒畅，多交流', '多食疏肝理气食物如玫瑰花', '适当运动，听音乐放松', '培养兴趣爱好'],
  },
  '特禀质': {
    name: '特禀质',
    description: '先天禀赋不足，容易过敏，适应能力较差。',
    advice: ['远离过敏原', '饮食清淡，避免易过敏食物', '增强体质，提高免疫力', '注意环境卫生'],
  },
}

// 根据答案计算主要体质类型
export function determineConstitutionType(answers: { questionId: string; optionValue: string }[]): { type: string; score: number; allScores: Record<string, number> } {
  const scores: Record<string, number> = {
    '平和质': 0,
    '气虚质': 0,
    '阳虚质': 0,
    '阴虚质': 0,
    '痰湿质': 0,
    '湿热质': 0,
    '血瘀质': 0,
    '气郁质': 0,
    '特禀质': 0,
  }
  
  for (const answer of answers) {
    const question = constitutionQuestions.find(q => q.id === answer.questionId)
    if (question) {
      const option = question.options.find(o => o.value === answer.optionValue)
      if (option) {
        for (const [type, score] of Object.entries(option.scores)) {
          scores[type] = (scores[type] || 0) + score
        }
      }
    }
  }
  
  // 找出得分最高的体质
  let maxType = '平和质'
  let maxScore = 0
  
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      maxType = type
    }
  }
  
  // 按该体质在当前问卷中的可达最高分归一化。
  const maximum = constitutionQuestions.reduce((sum, question) => sum + Math.max(0, ...question.options.map(option => (option.scores as Record<string, number>)[maxType] || 0)), 0)
  const percentScore = maximum ? Math.round((maxScore / maximum) * 100) : 0
  
  return {
    type: maxType,
    score: Math.min(percentScore, 100),
    allScores: scores,
  }
}
