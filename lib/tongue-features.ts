// Project observation categories, not a verbatim national standard or diagnostic rule.
export const tongueFeatures = [
  { key: 'bodyColor', name: '舌体颜色', values: ['淡红', '淡白', '红', '绛红', '青紫'], note: '观察舌体，不把白色舌苔当成淡白舌；光线和染色会影响颜色。' },
  { key: 'bodyShape', name: '舌体形状', values: ['未见明显胖瘦改变', '胖大', '瘦薄'], note: '伸舌力度和拍摄角度会改变外观。' },
  { key: 'toothMarks', name: '齿痕', values: ['未见明显齿痕', '可见齿痕'], note: '观察舌缘连续的凹陷；边缘看不清则不判断。' },
  { key: 'fissures', name: '裂纹', values: ['未见明显裂纹', '可见裂纹'], note: '观察舌面沟裂，不把反光或阴影直接算作裂纹。' },
  { key: 'coatColor', name: '苔色', values: ['白', '黄', '灰黑', '混合色', '未见明显舌苔'], note: '苔色与舌体颜色分开记录。' },
  { key: 'coatThickness', name: '苔厚薄', values: ['薄', '厚', '局部厚薄不均', '未见明显舌苔'], note: '以舌体是否容易透见作为观察线索，图片不能触诊。' },
  { key: 'coatTexture', name: '苔质', values: ['未见明显腻腐外观', '疑似腻苔', '疑似腐苔'], note: '只描述细密或粗松外观，不能用照片验证刮除情况。' },
  { key: 'peeling', name: '剥苔', values: ['未见明显剥苔', '疑似局部剥苔', '疑似广泛少苔'], note: '记录局部缺苔外观，不自动推断病因。' },
] as const

export const featureSchema = {
  type: 'object', additionalProperties: false,
  properties: { imageQuality: { type: 'string', enum: ['可观察', '不清晰', '非舌象', '无法判断'] },
    ...Object.fromEntries(tongueFeatures.map(f => [f.key, { type: 'string', enum: [...f.values, '无法判断'] }])) },
  required: ['imageQuality', ...tongueFeatures.map(f => f.key)],
}

export function featureReport(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('细分类输出无效')
  const data = { ...value } as Record<string, unknown>
  if (!['可观察','不清晰','非舌象','无法判断'].includes(String(data.imageQuality))) throw new Error('图片质量输出无效')
  if (data.imageQuality !== '可观察') throw new Error('图片不适合细分类，请上传清晰、完整的舌面照片')
  for (const f of tongueFeatures) {
    if (typeof data[f.key] !== 'string' || ![...f.values, '无法判断'].includes(data[f.key] as never)) throw new Error('细分类标签无效')
  }
  const absent = '未见明显舌苔'
  const conflict = (data.coatColor === absent && ![absent,'无法判断'].includes(String(data.coatThickness))) || (data.coatThickness === absent && ![absent,'无法判断'].includes(String(data.coatColor)))
  if (conflict) { data.coatColor = '无法判断'; data.coatThickness = '无法判断' }
  const details = tongueFeatures.map(f => {
    const conflictNote = conflict && ['coatColor','coatThickness'].includes(f.key) ? '模型的苔色与厚薄输出矛盾，已保留为无法判断。' : ''
    return { category: f.name, status: data[f.key] === '无法判断' ? '无法判断' : '待人工核对', description: `${data[f.key]}。${conflictNote}${f.note}` }
  })
  return { source: 'local-qwen-vl', model: 'qwen3-vl:2b', features: Object.fromEntries(tongueFeatures.map(f => [f.key, data[f.key]])), tongueColor: String(data.bodyColor),
    tongueShape: `${data.bodyShape}；${data.toothMarks}；${data.fissures}`,
    coating: `${data.coatColor}；${data.coatThickness}；${data.coatTexture}；${data.peeling}`,
    constitution: '仅凭照片无法判断体质', details,
    suggestions: ['拍摄舌面近照，完整保留舌尖和两侧舌缘，避免整张人脸占据主要画面。', '在均匀光线下自然伸舌，确认对焦清晰；记录近期饮食和刷舌情况，避免把染色当成苔色。', '逐项对照原图核验；无法判断的项目不要当成正常，可补拍后再观察。', '以上为通用视觉模型外观试验，尚未用专家标注数据验证准确率；单张照片不评估动态舌态、触感或未拍摄的舌下络脉，不据此诊断或开药。'] }
}
