import terms from './tongue-terms.json'
import type { Entity } from './data'

export const tongueTerms: Entity[] = terms.map(term => ({
  id: term.id, name: term.name, type: 'tongue',
  aliases: [term.id, term.english], description: term.definition,
  properties: {
    '内容用途': '教学与术语检索，不作为诊断依据',
    '内部编码': term.id + '（非国家标准或WHO原始编号）',
    '英文建议译名': term.english, '分类': term.category, '维度': term.dimension,
    '来源': term.source, '核验状态': term.verification, '使用边界': term.notes,
    '病机与证候': '未建立推断关系，不能仅凭舌象确定',
  },
}))

export const tongueTerminologyContext = [
  '以下是用户提供、尚待原文校准的舌象术语整理稿，不是GB/T或WHO原文。T编码仅为项目内部编码，不得宣称符合标准或获得WHO认可。',
  ...terms.map(term => term.id + ' ' + term.dimension + ' ' + term.name + '：' + term.definition),
  '分别描述舌色、舌形、舌态、苔色、苔厚薄、苔润燥、苔质和舌下络脉。舌神(tongue_spirit)尚无核验条目，不得编造。',
  '单张照片不能确认颤动、吐弄、活动力量等动态舌态；没有舌下视图时写无法观察舌下络脉。看不清的维度写无法判断。',
  '术语只描述外观，不自动推断病机、证候、体质或药方；constitution字段填写仅凭照片无法判断。',
].join('\n')
