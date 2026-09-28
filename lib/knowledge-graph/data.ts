import { healthKnowledge } from './health-knowledge'
import { tongueTerms } from './tongue-terms'
import supplement from './supplement.json'
// 中医知识图谱数据结构

// 实体类型定义
export type EntityType = 
  | 'symptom'      // 症状
  | 'disease'      // 疾病/证型
  | 'constitution' // 体质
  | 'herb'         // 中药
  | 'formula'      // 方剂
  | 'acupoint'     // 穴位
  | 'meridian'     // 经络
  | 'organ'        // 脏腑
  | 'food'         // 食材
  | 'education'    // 健康科普
  | 'tongue'       // 舌象术语
  | 'emotion'      // 情志

// 关系类型定义
export type RelationType =
  | 'causes'           // 导致
  | 'treats'           // 治疗
  | 'belongs_to'       // 属于
  | 'contains'         // 包含
  | 'located_on'       // 位于
  | 'connects'         // 联络
  | 'governs'          // 主管
  | 'promotes'         // 促进
  | 'inhibits'         // 抑制
  | 'transforms_to'    // 转化为
  | 'suitable_for'     // 适用于
  | 'contraindicated'  // 禁忌

// 实体接口
export interface Entity {
  id: string
  name: string
  type: EntityType
  aliases?: string[]      // 别名
  description?: string    // 描述
  properties?: Record<string, string | string[]>  // 额外属性
}

// 关系接口
export interface Relation {
  id: string
  source: string          // 源实体ID
  target: string          // 目标实体ID
  type: RelationType
  weight?: number         // 关系权重 0-1
  description?: string    // 关系描述
}

// ==================== 实体数据 ====================

// 症状实体
export const symptoms: Entity[] = [
  {
    id: 'sym_insomnia',
    name: '失眠',
    type: 'symptom',
    aliases: ['不寐', '睡眠障碍', '睡不着', '入睡困难'],
    description: '以经常不能获得正常睡眠为特征的一类病证',
    properties: {
      severity: ['轻度', '中度', '重度'],
      duration: ['偶发', '短期', '慢性']
    }
  },
  {
    id: 'sym_fatigue',
    name: '疲劳乏力',
    type: 'symptom',
    aliases: ['乏力', '倦怠', '神疲', '气短懒言'],
    description: '身体疲倦，精神不振，懒于活动'
  },
  {
    id: 'sym_pale_face',
    name: '面色苍白',
    type: 'symptom',
    aliases: ['面白', '面色淡白', '脸色差'],
    description: '面部颜色淡白无华'
  },
  {
    id: 'sym_cold_limbs',
    name: '手脚冰凉',
    type: 'symptom',
    aliases: ['四肢厥冷', '手足不温', '畏寒肢冷'],
    description: '四肢末端发凉，不温'
  },
  {
    id: 'sym_headache',
    name: '头痛',
    type: 'symptom',
    aliases: ['头疼', '偏头痛', '头风'],
    description: '头部疼痛的症状',
    properties: {
      location: ['前额', '两侧', '后枕', '巅顶'],
      nature: ['胀痛', '刺痛', '隐痛', '跳痛']
    }
  },
  {
    id: 'sym_dizziness',
    name: '头晕',
    type: 'symptom',
    aliases: ['眩晕', '头昏', '目眩'],
    description: '头脑昏沉，视物旋转'
  },
  {
    id: 'sym_poor_appetite',
    name: '食欲不振',
    type: 'symptom',
    aliases: ['纳呆', '不思饮食', '厌食'],
    description: '食欲减退，不想进食'
  },
  {
    id: 'sym_bloating',
    name: '腹胀',
    type: 'symptom',
    aliases: ['脘腹胀满', '胃胀', '腹满'],
    description: '腹部胀满不适'
  },
  {
    id: 'sym_loose_stool',
    name: '便溏',
    type: 'symptom',
    aliases: ['大便稀', '腹泻', '泄泻'],
    description: '大便稀薄不成形'
  },
  {
    id: 'sym_constipation',
    name: '便秘',
    type: 'symptom',
    aliases: ['大便干结', '排便困难'],
    description: '大便秘结不通'
  },
  {
    id: 'sym_irritability',
    name: '烦躁易怒',
    type: 'symptom',
    aliases: ['急躁', '易怒', '心烦'],
    description: '情绪急躁，容易发怒'
  },
  {
    id: 'sym_dry_mouth',
    name: '口干',
    type: 'symptom',
    aliases: ['口渴', '咽干', '口燥'],
    description: '口中干燥，欲饮水'
  },
  {
    id: 'sym_night_sweat',
    name: '盗汗',
    type: 'symptom',
    aliases: ['夜间出汗', '睡中汗出'],
    description: '睡眠中出汗，醒后汗止'
  },
  {
    id: 'sym_palpitation',
    name: '心悸',
    type: 'symptom',
    aliases: ['心慌', '怔忡', '心跳'],
    description: '自觉心跳不安'
  },
  {
    id: 'sym_chest_tightness',
    name: '胸闷',
    type: 'symptom',
    aliases: ['胸闷气短', '憋闷'],
    description: '胸部憋闷不舒'
  },
  {
    id: 'sym_lower_back_pain',
    name: '腰膝酸软',
    type: 'symptom',
    aliases: ['腰痛', '腿软', '膝软'],
    description: '腰部和膝部酸软无力'
  },
  {
    id: 'sym_menstrual_pain',
    name: '痛经',
    type: 'symptom',
    aliases: ['经期腹痛', '月经痛'],
    description: '月经期间腹部疼痛'
  },
  {
    id: 'sym_irregular_period',
    name: '月经不调',
    type: 'symptom',
    aliases: ['经期紊乱', '月经失调'],
    description: '月经周期、经量、经色异常'
  }
]

// 疾病/证型实体
export const diseases: Entity[] = [
  {
    id: 'dis_qi_deficiency',
    name: '气虚证',
    type: 'disease',
    aliases: ['气虚', '元气不足'],
    description: '元气不足，脏腑功能减退',
    properties: {
      治则: '补气'
    }
  },
  {
    id: 'dis_blood_deficiency',
    name: '血虚证',
    type: 'disease',
    aliases: ['血虚', '血液亏虚'],
    description: '血液亏少，脏腑组织失养',
    properties: {
      治则: '补血养血'
    }
  },
  {
    id: 'dis_qi_blood_deficiency',
    name: '气血两虚',
    type: 'disease',
    aliases: ['气血不足', '气血亏虚'],
    description: '气虚与血虚同时存在'
  },
  {
    id: 'dis_yang_deficiency',
    name: '阳虚证',
    type: 'disease',
    aliases: ['阳虚', '阳气不足'],
    description: '阳气虚衰，温煦功能减退',
    properties: {
      治则: '温阳补气'
    }
  },
  {
    id: 'dis_yin_deficiency',
    name: '阴虚证',
    type: 'disease',
    aliases: ['阴虚', '阴液不足'],
    description: '阴液亏损，虚热内生',
    properties: {
      治则: '滋阴降火'
    }
  },
  {
    id: 'dis_liver_qi_stagnation',
    name: '肝郁气滞',
    type: 'disease',
    aliases: ['肝气郁结', '肝郁'],
    description: '肝失疏泄，气机郁滞',
    properties: {
      治则: '疏肝解郁'
    }
  },
  {
    id: 'dis_spleen_deficiency',
    name: '脾虚证',
    type: 'disease',
    aliases: ['脾气虚', '脾胃虚弱'],
    description: '脾气虚弱，运化失职',
    properties: {
      治则: '健脾益气'
    }
  },
  {
    id: 'dis_kidney_yang_deficiency',
    name: '肾阳虚',
    type: 'disease',
    aliases: ['肾阳不足', '命门火衰'],
    description: '肾阳虚衰，温煦功能减退'
  },
  {
    id: 'dis_kidney_yin_deficiency',
    name: '肾阴虚',
    type: 'disease',
    aliases: ['肾阴不足'],
    description: '肾阴亏损，虚火内生'
  },
  {
    id: 'dis_phlegm_dampness',
    name: '痰湿证',
    type: 'disease',
    aliases: ['痰湿内阻', '湿痰'],
    description: '水液代谢失常，痰湿内生'
  },
  {
    id: 'dis_blood_stasis',
    name: '血瘀证',
    type: 'disease',
    aliases: ['瘀血', '血行不畅'],
    description: '血行不畅，瘀血阻滞'
  },
  {
    id: 'dis_heart_blood_deficiency',
    name: '心血虚',
    type: 'disease',
    aliases: ['心血不足'],
    description: '心血亏虚，心神失养'
  },
  {
    id: 'dis_liver_fire',
    name: '肝火上炎',
    type: 'disease',
    aliases: ['肝火', '肝火旺'],
    description: '肝火亢盛，上扰清窍'
  }
]

// 体质实体
export const constitutions: Entity[] = [
  {
    id: 'con_balanced',
    name: '平和质',
    type: 'constitution',
    description: '阴阳气血调和，体态适中，面色红润',
    properties: {
      特征: ['精力充沛', '睡眠良好', '性格开朗'],
      调养: '维持现状，均衡饮食'
    }
  },
  {
    id: 'con_qi_deficient',
    name: '气虚质',
    type: 'constitution',
    description: '元气不足，容易疲乏，气短懒言',
    properties: {
      特征: ['易疲劳', '气短', '出汗多', '易感冒'],
      调养: '补气健脾'
    }
  },
  {
    id: 'con_yang_deficient',
    name: '阳虚质',
    type: 'constitution',
    description: '阳气不足，以畏寒怕冷、手足不温为主要特征',
    properties: {
      特征: ['畏寒怕冷', '手脚冰凉', '喜热饮食'],
      调养: '温补阳气'
    }
  },
  {
    id: 'con_yin_deficient',
    name: '阴虚质',
    type: 'constitution',
    description: '阴液亏少，以口燥咽干、手足心热为主要特征',
    properties: {
      特征: ['口干', '手足心热', '盗汗', '便干'],
      调养: '滋阴清热'
    }
  },
  {
    id: 'con_phlegm_dampness',
    name: '痰湿质',
    type: 'constitution',
    description: '痰湿凝聚，以形体肥胖、腹部肥满为主要特征',
    properties: {
      特征: ['体型肥胖', '腹部松软', '易困倦', '痰多'],
      调养: '化痰祛湿'
    }
  },
  {
    id: 'con_damp_heat',
    name: '湿热质',
    type: 'constitution',
    description: '湿热内蕴，以面垢油光、口苦为主要特征',
    properties: {
      特征: ['面部油腻', '口苦', '大便黏滞', '小便短黄'],
      调养: '清热利湿'
    }
  },
  {
    id: 'con_blood_stasis',
    name: '血瘀质',
    type: 'constitution',
    description: '血行不畅，以肤色晦暗、舌质紫暗为主要特征',
    properties: {
      特征: ['肤色暗沉', '易有瘀斑', '唇色偏暗'],
      调养: '活血化瘀'
    }
  },
  {
    id: 'con_qi_stagnation',
    name: '气郁质',
    type: 'constitution',
    description: '气机郁滞，以神情抑郁、忧虑脆弱为主要特征',
    properties: {
      特征: ['情绪低落', '多愁善感', '胸闷', '叹气'],
      调养: '疏肝理气'
    }
  },
  {
    id: 'con_special',
    name: '特禀质',
    type: 'constitution',
    description: '先天特殊，以生理缺陷、过敏反应为主要特征',
    properties: {
      特征: ['过敏体质', '先天不足'],
      调养: '益气固表'
    }
  }
]

// 中药实体
export const herbs: Entity[] = [
  {
    id: 'herb_huangqi',
    name: '黄芪',
    type: 'herb',
    aliases: ['北芪', '绵芪'],
    description: '补气固表，利尿托毒，排脓，敛疮生肌',
    properties: {
      性味: '甘，微温',
      归经: ['肺', '脾'],
      功效: ['补气升阳', '益卫固表', '利水消肿', '托疮生肌']
    }
  },
  {
    id: 'herb_danggui',
    name: '当归',
    type: 'herb',
    aliases: ['秦归', '西当归'],
    description: '补血活血，调经止痛，润肠通便',
    properties: {
      性味: '甘、辛，温',
      归经: ['肝', '心', '脾'],
      功效: ['补血', '活血', '调经', '止痛']
    }
  },
  {
    id: 'herb_renshen',
    name: '人参',
    type: 'herb',
    aliases: ['园参', '红参', '白参'],
    description: '大补元气，复脉固脱，补脾益肺，生津止渴，安神益智',
    properties: {
      性味: '甘、微苦，平',
      归经: ['脾', '肺', '心'],
      功效: ['大补元气', '补脾益肺', '生津', '安神']
    }
  },
  {
    id: 'herb_gouqi',
    name: '枸杞子',
    type: 'herb',
    aliases: ['枸杞', '宁夏枸杞'],
    description: '滋补肝肾，益精明目',
    properties: {
      性味: '甘，平',
      归经: ['肝', '肾'],
      功效: ['滋补肝肾', '益精明目']
    }
  },
  {
    id: 'herb_hongzao',
    name: '红枣',
    type: 'herb',
    aliases: ['大枣', '枣子'],
    description: '补中益气，养血安神',
    properties: {
      性味: '甘，温',
      归经: ['脾', '胃'],
      功效: ['补中益气', '养血安神']
    }
  },
  {
    id: 'herb_suanzaoren',
    name: '酸枣仁',
    type: 'herb',
    description: '养心补肝，宁心安神，敛汗生津',
    properties: {
      性味: '甘、酸，平',
      归经: ['心', '肝', '胆'],
      功效: ['养心安神', '敛汗']
    }
  },
  {
    id: 'herb_baizhu',
    name: '白术',
    type: 'herb',
    description: '健脾益气，燥湿利水，止汗，安胎',
    properties: {
      性味: '苦、甘，温',
      归经: ['脾', '胃'],
      功效: ['健脾益气', '燥湿利水']
    }
  },
  {
    id: 'herb_fuling',
    name: '茯苓',
    type: 'herb',
    aliases: ['白茯苓', '云苓'],
    description: '利水渗湿，健脾宁心',
    properties: {
      性味: '甘、淡，平',
      归经: ['心', '脾', '肾'],
      功效: ['利水渗湿', '健脾', '宁心']
    }
  },
  {
    id: 'herb_chenpi',
    name: '陈皮',
    type: 'herb',
    aliases: ['橘皮'],
    description: '理气健脾，燥湿化痰',
    properties: {
      性味: '苦、辛，温',
      归经: ['脾', '肺'],
      功效: ['理气健脾', '燥湿化痰']
    }
  },
  {
    id: 'herb_juhua',
    name: '菊花',
    type: 'herb',
    aliases: ['杭菊', '贡菊'],
    description: '散风清热，平肝明目，清热解毒',
    properties: {
      性味: '甘、苦，微寒',
      归经: ['肺', '肝'],
      功效: ['散风清热', '平肝明目']
    }
  },
  {
    id: 'herb_shanyao',
    name: '山药',
    type: 'herb',
    aliases: ['淮山', '怀山药'],
    description: '补脾养胃，生津益肺，补肾涩精',
    properties: {
      性味: '甘，平',
      归经: ['脾', '肺', '肾'],
      功效: ['健脾', '补肺', '固肾', '益精']
    }
  },
  {
    id: 'herb_yiyiren',
    name: '薏苡仁',
    type: 'herb',
    aliases: ['薏米', '薏仁'],
    description: '健脾渗湿，除痹止泻，清热排脓',
    properties: {
      性味: '甘、淡，凉',
      归经: ['脾', '胃', '肺'],
      功效: ['健脾渗湿', '清热排脓']
    }
  },
  {
    id: 'herb_sanqi',
    name: '三七',
    type: 'herb',
    aliases: ['田七', '金不换'],
    description: '散瘀止血，消肿定痛',
    properties: {
      性味: '甘、微苦，温',
      归经: ['肝', '胃'],
      功效: ['散瘀止血', '消肿定痛']
    }
  },
  {
    id: 'herb_gegen',
    name: '葛根',
    type: 'herb',
    description: '解肌退热，生津止渴，透疹，升阳止泻',
    properties: {
      性味: '甘、辛，凉',
      归经: ['脾', '胃'],
      功效: ['解肌退热', '生津', '升阳止泻']
    }
  },
  {
    id: 'herb_shengjiang',
    name: '生姜',
    type: 'herb',
    description: '解表散寒，温中止呕，化痰止咳',
    properties: {
      性味: '辛，微温',
      归经: ['肺', '脾', '胃'],
      功效: ['解表散寒', '温中止呕', '化痰']
    }
  },
  {
    id: 'herb_rougui',
    name: '肉桂',
    type: 'herb',
    aliases: ['桂皮'],
    description: '补火助阳，引火归源，散寒止痛，温经通脉',
    properties: {
      性味: '辛、甘，大热',
      归经: ['肾', '脾', '心', '肝'],
      功效: ['补火助阳', '散寒止痛', '温经通脉']
    }
  },
  {
    id: 'herb_meiguihua',
    name: '玫瑰花',
    type: 'herb',
    description: '行气解郁，和血止痛',
    properties: {
      性味: '甘、微苦，温',
      归经: ['肝', '脾'],
      功效: ['疏肝解郁', '活血止痛', '调经']
    }
  },
  {
    id: 'herb_longyan',
    name: '龙眼肉',
    type: 'herb',
    aliases: ['桂圆'],
    description: '补益心脾，养血安神',
    properties: {
      性味: '甘，温',
      归经: ['心', '脾'],
      功效: ['补心脾', '益气血', '安神']
    }
  },
  {
    id: 'herb_baihe',
    name: '百合',
    type: 'herb',
    description: '养阴润肺，清心安神',
    properties: {
      性味: '甘，微寒',
      归经: ['心', '肺'],
      功效: ['养阴润肺', '清心安神']
    }
  },
  {
    id: 'herb_lianzi',
    name: '莲子',
    type: 'herb',
    description: '补脾止泻，止带，益肾涩精，养心安神',
    properties: {
      性味: '甘、涩，平',
      归经: ['脾', '肾', '心'],
      功效: ['健脾止泻', '益肾', '养心安神']
    }
  }
]

// 穴位实体
export const acupoints: Entity[] = [
  {
    id: 'acu_zusanli',
    name: '足三里',
    type: 'acupoint',
    description: '强壮保健要穴，健脾和胃',
    properties: {
      定位: '外膝眼下3寸，胫骨前嵴外1横指',
      经络: '足阳明胃经',
      功效: ['健脾和胃', '扶正培元', '通经活络', '升降气机']
    }
  },
  {
    id: 'acu_shenmen',
    name: '神门',
    type: 'acupoint',
    description: '心经原穴，宁心安神',
    properties: {
      定位: '腕横纹尺侧端，尺侧腕屈肌腱的桡侧凹陷中',
      经络: '手少阴心经',
      功效: ['宁心安神', '清心泻火']
    }
  },
  {
    id: 'acu_taichong',
    name: '太冲',
    type: 'acupoint',
    description: '肝经原穴，疏肝解郁',
    properties: {
      定位: '足背，第1、2跖骨间隙的后方凹陷中',
      经络: '足厥阴肝经',
      功效: ['疏肝解郁', '平肝潜阳', '清热利湿']
    }
  },
  {
    id: 'acu_hegu',
    name: '合谷',
    type: 'acupoint',
    description: '大肠经原穴，止痛要穴',
    properties: {
      定位: '手背，第1、2掌骨间，第2掌骨桡侧的中点处',
      经络: '手阳明大肠经',
      功效: ['镇静止痛', '通经活络', '清热解表']
    }
  },
  {
    id: 'acu_guanyuan',
    name: '关元',
    type: 'acupoint',
    description: '培补元气要穴',
    properties: {
      定位: '脐下3寸',
      经络: '任脉',
      功效: ['培补元气', '温肾固精', '补益下焦']
    }
  },
  {
    id: 'acu_qihai',
    name: '气海',
    type: 'acupoint',
    description: '补气要穴',
    properties: {
      定位: '脐下1.5寸',
      经络: '任脉',
      功效: ['补气益肾', '调理冲任']
    }
  },
  {
    id: 'acu_baihui',
    name: '百会',
    type: 'acupoint',
    description: '诸阳之会，升阳举陷',
    properties: {
      定位: '头顶正中线与两耳尖连线的交点',
      经络: '督脉',
      功效: ['开窍醒脑', '升阳举陷', '宁心安神']
    }
  },
  {
    id: 'acu_fengchi',
    name: '风池',
    type: 'acupoint',
    description: '祛风要穴，治头痛',
    properties: {
      定位: '项后枕骨下，与风府穴相平，胸锁乳突肌与斜方肌上端之间的凹陷中',
      经络: '足少阳胆经',
      功效: ['祛风解表', '清头明目', '通利官窍']
    }
  },
  {
    id: 'acu_yongquan',
    name: '涌泉',
    type: 'acupoint',
    description: '肾经井穴，滋阴降火',
    properties: {
      定位: '足底前部凹陷处，第2、3趾趾缝纹头端与足跟连线的前1/3与后2/3交点上',
      经络: '足少阴肾经',
      功效: ['滋阴降火', '醒脑开窍', '宁心安神']
    }
  },
  {
    id: 'acu_zhongwan',
    name: '中脘',
    type: 'acupoint',
    description: '胃之募穴，和胃健脾',
    properties: {
      定位: '脐上4寸',
      经络: '任脉',
      功效: ['和胃健脾', '降逆利水']
    }
  },
  {
    id: 'acu_neiguan',
    name: '内关',
    type: 'acupoint',
    description: '宁心安神，和胃降逆',
    properties: {
      定位: '腕横纹上2寸，掌长肌腱与桡侧腕屈肌腱之间',
      经络: '手厥阴心包经',
      功效: ['宁心安神', '理气止痛', '和胃降逆']
    }
  },
  {
    id: 'acu_sanyinjiao',
    name: '三阴交',
    type: 'acupoint',
    description: '妇科要穴，健脾益血',
    properties: {
      定位: '内踝尖上3寸，胫骨内侧缘后际',
      经络: '足太阴脾经',
      功效: ['健脾益血', '调肝补肾', '安神助眠']
    }
  },
  {
    id: 'acu_mingmen',
    name: '命门',
    type: 'acupoint',
    description: '补肾壮阳要穴',
    properties: {
      定位: '后正中线上，第2腰椎棘突下凹陷中',
      经络: '督脉',
      功效: ['补肾壮阳', '培元固本', '强壮腰膝']
    }
  },
  {
    id: 'acu_xuehai',
    name: '血海',
    type: 'acupoint',
    description: '活血化瘀要穴',
    properties: {
      定位: '屈膝，在髌骨内上缘上2寸',
      经络: '足太阴脾经',
      功效: ['活血化瘀', '调经统血', '健脾利湿']
    }
  },
  {
    id: 'acu_taiyang',
    name: '太阳',
    type: 'acupoint',
    description: '治头痛要穴',
    properties: {
      定位: '眉梢与目外眦之间，向后约一横指的凹陷处',
      经络: '经外奇穴',
      功效: ['清热止痛', '清肝明目']
    }
  }
]

// 脏腑实体
export const organs: Entity[] = [
  {
    id: 'org_heart',
    name: '心',
    type: 'organ',
    description: '心主血脉，主神明',
    properties: {
      功能: ['主血脉', '主神明', '开窍于舌', '其华在面'],
      五行: '火',
      情志: '喜'
    }
  },
  {
    id: 'org_liver',
    name: '肝',
    type: 'organ',
    description: '肝主疏泄，主藏血',
    properties: {
      功能: ['主疏泄', '主藏血', '主筋', '开窍于目', '其华在爪'],
      五行: '木',
      情志: '怒'
    }
  },
  {
    id: 'org_spleen',
    name: '脾',
    type: 'organ',
    description: '脾主运化，主统血',
    properties: {
      功能: ['主运化', '主统血', '主肌肉', '开窍于口', '其华在唇'],
      五行: '土',
      情志: '思'
    }
  },
  {
    id: 'org_lung',
    name: '肺',
    type: 'organ',
    description: '肺主气，主宣发肃降',
    properties: {
      功能: ['主气', '主宣发肃降', '主皮毛', '开窍于鼻'],
      五行: '金',
      情志: '悲'
    }
  },
  {
    id: 'org_kidney',
    name: '肾',
    type: 'organ',
    description: '肾主藏精，主水',
    properties: {
      功能: ['主藏精', '主水', '主骨', '生髓', '开窍于耳', '其华在发'],
      五行: '水',
      情志: '恐'
    }
  },
  {
    id: 'org_stomach',
    name: '胃',
    type: 'organ',
    description: '胃主受纳，腐熟水谷',
    properties: {
      功能: ['主受纳', '腐熟水谷', '主通降'],
      五行: '土',
      配对: '脾'
    }
  }
]

// 食材实体
export const foods: Entity[] = [
  {
    id: 'food_xiaomi',
    name: '小米',
    type: 'food',
    description: '健脾和胃，补益虚损，安神',
    properties: {
      性味: '甘、咸，凉',
      归经: ['脾', '胃', '肾'],
      功效: ['健脾和胃', '补虚', '安神']
    }
  },
  {
    id: 'food_nangua',
    name: '南瓜',
    type: 'food',
    description: '补中益气，消炎止痛',
    properties: {
      性味: '甘，温',
      归经: ['脾', '胃'],
      功效: ['补中益气', '养胃']
    }
  },
  {
    id: 'food_heidou',
    name: '黑豆',
    type: 'food',
    description: '补肾益阴，健脾利湿',
    properties: {
      性味: '甘，平',
      归经: ['脾', '肾'],
      功效: ['补肾', '利水', '活血']
    }
  },
  {
    id: 'food_heizhima',
    name: '黑芝麻',
    type: 'food',
    description: '补肝肾，益精血，润肠燥',
    properties: {
      性味: '甘，平',
      归经: ['肝', '肾', '大肠'],
      功效: ['补肝肾', '益精血', '润肠']
    }
  },
  {
    id: 'food_yangrou',
    name: '羊肉',
    type: 'food',
    description: '温中暖肾，补气养血',
    properties: {
      性味: '甘，温',
      归经: ['脾', '肾'],
      功效: ['温中暖肾', '补气养血']
    }
  },
  {
    id: 'food_hetao',
    name: '核桃',
    type: 'food',
    description: '补肾固精，温肺定喘，润肠通便',
    properties: {
      性味: '甘，温',
      归经: ['肾', '肺', '大肠'],
      功效: ['补肾', '温肺', '润肠']
    }
  },
  {
    id: 'food_lvdou',
    name: '绿豆',
    type: 'food',
    description: '清热解毒，消暑利水',
    properties: {
      性味: '甘，凉',
      归经: ['心', '胃'],
      功效: ['清热解毒', '消暑', '利水']
    }
  },
  {
    id: 'food_yimi',
    name: '薏米',
    type: 'food',
    description: '健脾利水，清热排脓',
    properties: {
      性味: '甘、淡，凉',
      归经: ['脾', '胃', '肺'],
      功效: ['健脾', '利水', '清热']
    }
  }
]

// ==================== 关系数据 ====================

export const relations: Relation[] = [
  // 症状 -> 疾病关系
  { id: 'r1', source: 'sym_fatigue', target: 'dis_qi_deficiency', type: 'causes', weight: 0.9 },
  { id: 'r2', source: 'sym_pale_face', target: 'dis_blood_deficiency', type: 'causes', weight: 0.85 },
  { id: 'r3', source: 'sym_cold_limbs', target: 'dis_yang_deficiency', type: 'causes', weight: 0.9 },
  { id: 'r4', source: 'sym_insomnia', target: 'dis_heart_blood_deficiency', type: 'causes', weight: 0.7 },
  { id: 'r5', source: 'sym_insomnia', target: 'dis_liver_fire', type: 'causes', weight: 0.6 },
  { id: 'r6', source: 'sym_insomnia', target: 'dis_yin_deficiency', type: 'causes', weight: 0.65 },
  { id: 'r7', source: 'sym_irritability', target: 'dis_liver_qi_stagnation', type: 'causes', weight: 0.85 },
  { id: 'r8', source: 'sym_irritability', target: 'dis_liver_fire', type: 'causes', weight: 0.8 },
  { id: 'r9', source: 'sym_poor_appetite', target: 'dis_spleen_deficiency', type: 'causes', weight: 0.9 },
  { id: 'r10', source: 'sym_bloating', target: 'dis_spleen_deficiency', type: 'causes', weight: 0.85 },
  { id: 'r11', source: 'sym_loose_stool', target: 'dis_spleen_deficiency', type: 'causes', weight: 0.9 },
  { id: 'r12', source: 'sym_dry_mouth', target: 'dis_yin_deficiency', type: 'causes', weight: 0.8 },
  { id: 'r13', source: 'sym_night_sweat', target: 'dis_yin_deficiency', type: 'causes', weight: 0.9 },
  { id: 'r14', source: 'sym_headache', target: 'dis_liver_fire', type: 'causes', weight: 0.7 },
  { id: 'r15', source: 'sym_dizziness', target: 'dis_blood_deficiency', type: 'causes', weight: 0.75 },
  { id: 'r16', source: 'sym_dizziness', target: 'dis_qi_deficiency', type: 'causes', weight: 0.7 },
  { id: 'r17', source: 'sym_palpitation', target: 'dis_heart_blood_deficiency', type: 'causes', weight: 0.85 },
  { id: 'r18', source: 'sym_palpitation', target: 'dis_qi_deficiency', type: 'causes', weight: 0.7 },
  { id: 'r19', source: 'sym_lower_back_pain', target: 'dis_kidney_yang_deficiency', type: 'causes', weight: 0.8 },
  { id: 'r20', source: 'sym_lower_back_pain', target: 'dis_kidney_yin_deficiency', type: 'causes', weight: 0.75 },
  { id: 'r21', source: 'sym_menstrual_pain', target: 'dis_blood_stasis', type: 'causes', weight: 0.85 },
  { id: 'r22', source: 'sym_menstrual_pain', target: 'dis_qi_blood_deficiency', type: 'causes', weight: 0.7 },
  { id: 'r23', source: 'sym_chest_tightness', target: 'dis_liver_qi_stagnation', type: 'causes', weight: 0.75 },
  
  // 疾病 -> 体质关系
  { id: 'r24', source: 'dis_qi_deficiency', target: 'con_qi_deficient', type: 'belongs_to', weight: 0.9 },
  { id: 'r25', source: 'dis_yang_deficiency', target: 'con_yang_deficient', type: 'belongs_to', weight: 0.9 },
  { id: 'r26', source: 'dis_yin_deficiency', target: 'con_yin_deficient', type: 'belongs_to', weight: 0.9 },
  { id: 'r27', source: 'dis_phlegm_dampness', target: 'con_phlegm_dampness', type: 'belongs_to', weight: 0.9 },
  { id: 'r28', source: 'dis_blood_stasis', target: 'con_blood_stasis', type: 'belongs_to', weight: 0.9 },
  { id: 'r29', source: 'dis_liver_qi_stagnation', target: 'con_qi_stagnation', type: 'belongs_to', weight: 0.85 },
  
  // 中药 -> 疾病治疗关系
  { id: 'r30', source: 'herb_huangqi', target: 'dis_qi_deficiency', type: 'treats', weight: 0.9 },
  { id: 'r31', source: 'herb_danggui', target: 'dis_blood_deficiency', type: 'treats', weight: 0.9 },
  { id: 'r32', source: 'herb_renshen', target: 'dis_qi_deficiency', type: 'treats', weight: 0.95 },
  { id: 'r33', source: 'herb_suanzaoren', target: 'dis_heart_blood_deficiency', type: 'treats', weight: 0.85 },
  { id: 'r34', source: 'herb_fuling', target: 'dis_spleen_deficiency', type: 'treats', weight: 0.8 },
  { id: 'r35', source: 'herb_baizhu', target: 'dis_spleen_deficiency', type: 'treats', weight: 0.85 },
  { id: 'r36', source: 'herb_gouqi', target: 'dis_kidney_yin_deficiency', type: 'treats', weight: 0.8 },
  { id: 'r37', source: 'herb_rougui', target: 'dis_yang_deficiency', type: 'treats', weight: 0.85 },
  { id: 'r38', source: 'herb_rougui', target: 'dis_kidney_yang_deficiency', type: 'treats', weight: 0.9 },
  { id: 'r39', source: 'herb_meiguihua', target: 'dis_liver_qi_stagnation', type: 'treats', weight: 0.85 },
  { id: 'r40', source: 'herb_juhua', target: 'dis_liver_fire', type: 'treats', weight: 0.8 },
  { id: 'r41', source: 'herb_longyan', target: 'dis_heart_blood_deficiency', type: 'treats', weight: 0.8 },
  { id: 'r42', source: 'herb_baihe', target: 'dis_yin_deficiency', type: 'treats', weight: 0.75 },
  { id: 'r43', source: 'herb_chenpi', target: 'dis_phlegm_dampness', type: 'treats', weight: 0.8 },
  { id: 'r44', source: 'herb_sanqi', target: 'dis_blood_stasis', type: 'treats', weight: 0.9 },
  { id: 'r45', source: 'herb_shanyao', target: 'dis_spleen_deficiency', type: 'treats', weight: 0.85 },
  { id: 'r46', source: 'herb_yiyiren', target: 'dis_phlegm_dampness', type: 'treats', weight: 0.8 },
  
  // 穴位 -> 疾病治疗关系
  { id: 'r47', source: 'acu_zusanli', target: 'dis_spleen_deficiency', type: 'treats', weight: 0.9 },
  { id: 'r48', source: 'acu_zusanli', target: 'dis_qi_deficiency', type: 'treats', weight: 0.85 },
  { id: 'r49', source: 'acu_shenmen', target: 'dis_heart_blood_deficiency', type: 'treats', weight: 0.85 },
  { id: 'r50', source: 'acu_taichong', target: 'dis_liver_qi_stagnation', type: 'treats', weight: 0.9 },
  { id: 'r51', source: 'acu_taichong', target: 'dis_liver_fire', type: 'treats', weight: 0.85 },
  { id: 'r52', source: 'acu_guanyuan', target: 'dis_yang_deficiency', type: 'treats', weight: 0.85 },
  { id: 'r53', source: 'acu_guanyuan', target: 'dis_kidney_yang_deficiency', type: 'treats', weight: 0.9 },
  { id: 'r54', source: 'acu_sanyinjiao', target: 'dis_blood_deficiency', type: 'treats', weight: 0.8 },
  { id: 'r55', source: 'acu_sanyinjiao', target: 'dis_blood_stasis', type: 'treats', weight: 0.75 },
  { id: 'r56', source: 'acu_yongquan', target: 'dis_yin_deficiency', type: 'treats', weight: 0.8 },
  { id: 'r57', source: 'acu_zhongwan', target: 'dis_spleen_deficiency', type: 'treats', weight: 0.85 },
  { id: 'r58', source: 'acu_neiguan', target: 'dis_heart_blood_deficiency', type: 'treats', weight: 0.8 },
  { id: 'r59', source: 'acu_hegu', target: 'dis_liver_fire', type: 'treats', weight: 0.7 },
  { id: 'r60', source: 'acu_fengchi', target: 'dis_liver_fire', type: 'treats', weight: 0.75 },
  { id: 'r61', source: 'acu_baihui', target: 'dis_qi_deficiency', type: 'treats', weight: 0.7 },
  { id: 'r62', source: 'acu_xuehai', target: 'dis_blood_stasis', type: 'treats', weight: 0.85 },
  { id: 'r63', source: 'acu_mingmen', target: 'dis_kidney_yang_deficiency', type: 'treats', weight: 0.9 },
  
  // 脏腑 -> 疾病关系
  { id: 'r64', source: 'org_heart', target: 'dis_heart_blood_deficiency', type: 'governs', weight: 0.95 },
  { id: 'r65', source: 'org_liver', target: 'dis_liver_qi_stagnation', type: 'governs', weight: 0.95 },
  { id: 'r66', source: 'org_liver', target: 'dis_liver_fire', type: 'governs', weight: 0.9 },
  { id: 'r67', source: 'org_spleen', target: 'dis_spleen_deficiency', type: 'governs', weight: 0.95 },
  { id: 'r68', source: 'org_spleen', target: 'dis_qi_deficiency', type: 'governs', weight: 0.85 },
  { id: 'r69', source: 'org_kidney', target: 'dis_kidney_yang_deficiency', type: 'governs', weight: 0.95 },
  { id: 'r70', source: 'org_kidney', target: 'dis_kidney_yin_deficiency', type: 'governs', weight: 0.95 },
  
  // 食材 -> 体质适用关系
  { id: 'r71', source: 'food_yangrou', target: 'con_yang_deficient', type: 'suitable_for', weight: 0.9 },
  { id: 'r72', source: 'food_heidou', target: 'con_yin_deficient', type: 'suitable_for', weight: 0.8 },
  { id: 'r73', source: 'food_heizhima', target: 'con_yin_deficient', type: 'suitable_for', weight: 0.85 },
  { id: 'r74', source: 'food_xiaomi', target: 'con_qi_deficient', type: 'suitable_for', weight: 0.85 },
  { id: 'r75', source: 'food_yimi', target: 'con_phlegm_dampness', type: 'suitable_for', weight: 0.9 },
  { id: 'r76', source: 'food_lvdou', target: 'con_damp_heat', type: 'suitable_for', weight: 0.85 },
  { id: 'r77', source: 'food_hetao', target: 'con_yang_deficient', type: 'suitable_for', weight: 0.8 },
  
  // 禁忌关系
  { id: 'r78', source: 'food_yangrou', target: 'con_yin_deficient', type: 'contraindicated', weight: 0.8 },
  { id: 'r79', source: 'food_lvdou', target: 'con_yang_deficient', type: 'contraindicated', weight: 0.85 },
  { id: 'r80', source: 'herb_rougui', target: 'con_yin_deficient', type: 'contraindicated', weight: 0.9 },
]

// 教学补充：新增内容与原有中医术语分开标注，不构成诊疗依据。
symptoms.push(...supplement.additions.symptoms as Entity[])
foods.push(...supplement.additions.foods as Entity[])
organs.push(...supplement.additions.organs as Entity[])
for (const entity of [...symptoms, ...diseases, ...constitutions, ...herbs, ...acupoints, ...organs, ...foods]) {
  const notes: Record<string, string | string[]> = { '内容用途': '教学展示与健康知识检索，不作为诊断或处方依据' }
  if (entity.type === 'symptom') Object.assign(notes, { '观察要点': '记录出现时间、持续时间、诱因、程度及伴随情况', '记录建议': '症状持续、加重或影响日常活动时应就医评估' })
  if (entity.type === 'disease' || entity.type === 'constitution') Object.assign(notes, { '概念边界': '本条为传统中医术语，不能通过单个症状、照片或问卷确诊', '学习方法': '结合相关症状和脏腑条目对照学习；不同证型可出现相似表现' })
  if (entity.type === 'herb') Object.assign(notes, { '用药安全': '中药可能有不良反应及药物相互作用，不能因天然来源而视为无风险', '使用边界': '本文不提供用量、配方或自行用药指导；正在用药或有特殊健康情况时先咨询专业人员', '安全参考': supplement.sources.tcm })
  if (entity.type === 'acupoint') Object.assign(notes, { '操作边界': '定位仅供学习，不提供自行针刺或侵入性操作指导', '安全参考': supplement.sources.tcm })
  if (entity.type === 'organ') Object.assign(notes, { '概念边界': '传统脏腑理论不等同于现代解剖学分类' })
  if (entity.type === 'food') Object.assign(notes, { '饮食边界': '注意过敏、食品卫生和个人耐受；不将食材作为药物替代品', '通用膳食参考': supplement.sources.health })
  const patch = (supplement.patches as Record<string, Record<string, string | string[]>>)[entity.id]
  entity.properties = { ...notes, ...entity.properties, ...patch }
}

// 获取所有实体
export function getAllEntities(): Entity[] {
  return [
    ...symptoms,
    ...diseases,
    ...constitutions,
    ...herbs,
    ...acupoints,
    ...organs,
    ...foods,
    ...tongueTerms,
    ...healthKnowledge,
  ]
}

// 获取所有关系
export function getAllRelations(): Relation[] {
  return relations
}
