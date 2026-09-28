'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  saveUserProfile,
  getUserProfile, 
  generateUserId, 
  constitutionQuestions,
  constitutionTypes,
  determineConstitutionType,
  type UserProfile,
  type ConstitutionAnswer
} from '@/lib/user-store'
import { saveReport, generateReportId } from '@/lib/report-store'
import { localDate } from '@/lib/device-store'

type Step = 'info' | 'questionnaire' | 'result'

export default function LoginPage() {
  const router = useRouter()
  const changing = useRef(false)
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveError, setSaveError] = useState('')
  useEffect(() => {
    const user = getUserProfile()
    if (user) { setName(user.name); setAge(String(user.age)); setGender(user.gender); setPhone(user.phone || '') }
    return () => { if (pending.current) clearTimeout(pending.current) }
  }, [])
  const [step, setStep] = useState<Step>('info')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ questionId: string; optionValue: string }[]>([])
  const [result, setResult] = useState<{ type: string; score: number; allScores: Record<string, number> } | null>(null)
  
  // 用户基本信息
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')

  // 提交基本信息，进入问卷
  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !age) return
    setStep('questionnaire')
  }

  // 选择问卷答案
  const handleAnswer = (questionId: string, optionValue: string) => {
    if (changing.current) return
    changing.current = true
    const newAnswers = [...answers.filter(a => a.questionId !== questionId), { questionId, optionValue }]
    setAnswers(newAnswers)
    
    // 自动进入下一题或完成
    if (currentQuestion < constitutionQuestions.length - 1) {
      pending.current = setTimeout(() => {
        changing.current = false
        setCurrentQuestion(currentQuestion + 1)
      }, 300)
    } else {
      // 计算结果
      pending.current = setTimeout(() => {
        changing.current = false
        const constitutionResult = determineConstitutionType(newAnswers)
        setResult(constitutionResult)
        setStep('result')
        
        // 保存用户信息
        const profile: UserProfile = {
          id: getUserProfile()?.id || generateUserId(),
          name: name.trim(),
          gender,
          age: parseInt(age),
          phone: phone || undefined,
          createdAt: getUserProfile()?.createdAt || new Date().toISOString(),
          constitution: {
            type: constitutionResult.type,
            score: constitutionResult.score,
            answers: newAnswers.map(a => ({
              questionId: a.questionId,
              answer: a.optionValue,
              score: constitutionResult.allScores[constitutionResult.type] || 0,
            })),
            analyzedAt: new Date().toISOString(),
          },
        }
        if (!saveUserProfile(profile)) setSaveError('个人档案保存失败，请检查本机存储空间')
        
        // 保存体质报告
        const constitutionInfo = constitutionTypes[constitutionResult.type]
        const reportContent = `
您好，${name}！

根据您填写的中医体质问卷，我们为您进行了全面的体质分析。

一、体质类型
您的主要体质类型为：${constitutionResult.type}
体质倾向得分：${constitutionResult.score}分

二、体质特征
${constitutionInfo?.description || ''}

三、调养建议
${constitutionInfo?.advice.map((a, i) => `${i + 1}. ${a}`).join('\n') || ''}

四、各体质得分参考
${Object.entries(constitutionResult.allScores)
  .sort((a, b) => b[1] - a[1])
  .map(([type, score]) => `• ${type}：${score}分`)
  .join('\n')}

【温馨提示】
体质会随着生活方式、环境等因素变化，建议定期进行体质评估。
本报告仅供参考，如有健康问题请咨询专业医师。
        `.trim()

        const reportSaved = saveReport({
          id: generateReportId(),
          type: 'constitution',
          title: '体质分析报告',
          date: localDate(),
          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          summary: `体质类型：${constitutionResult.type}，得分：${constitutionResult.score}分`,
          status: constitutionResult.score >= 70 ? 'good' : constitutionResult.score >= 50 ? 'warning' : 'attention',
          content: reportContent,
        })
        if (!reportSaved) setSaveError('体质报告保存失败，请检查本机存储空间')
      }, 500)
    }
  }

  // 进入主页
  const handleEnterHome = () => {
    router.push('/home')
  }

  // 返回上一题
  const handlePrevQuestion = () => {
    if (changing.current) return
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const currentQuestionData = constitutionQuestions[currentQuestion]
  const currentAnswer = answers.find(a => a.questionId === currentQuestionData?.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {saveError && <p role="alert" className="relative z-50 p-4 text-destructive">{saveError}</p>}
      {/* 背景装饰 */}
      <div className="absolute inset-0 chinese-pattern opacity-20" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {/* 步骤1: 基本信息 */}
          {step === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              {/* Logo */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl"
                >
                  <svg viewBox="0 0 100 100" className="w-12 h-12 text-primary-foreground" fill="currentColor">
                    <path d="M50 15 C30 25 20 45 25 65 C30 75 40 85 50 85 C60 85 70 75 75 65 C80 45 70 25 50 15 Z" opacity="0.9" />
                    <circle cx="50" cy="50" r="8" opacity="0.8" />
                  </svg>
                </motion.div>
                <h1 className="text-2xl font-serif font-bold text-foreground">欢迎使用本草知音</h1>
                <p className="text-muted-foreground mt-2">请填写您的基本信息</p>
              </div>

              {/* 表单 */}
              <form onSubmit={handleInfoSubmit} className="space-y-5">
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50">
                  {/* 姓名 */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      姓名 <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="请输入您的姓名"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  </div>

                  {/* 性别 */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      性别 <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                          gender === 'male'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        男
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                          gender === 'female'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        女
                      </button>
                    </div>
                  </div>

                  {/* 年龄 */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      年龄 <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="请输入您的年龄"
                      min="1"
                      max="120"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  </div>

                  {/* 手机号 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      手机号 <span className="text-muted-foreground text-xs">(选填)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入您的手机号"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 提交按钮 */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  下一步：体质问卷
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* 步骤2: 体质问卷 */}
          {step === 'questionnaire' && currentQuestionData && (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              {/* 进度条 */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>体质问卷</span>
                  <span>{currentQuestion + 1} / {constitutionQuestions.length}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestion + 1) / constitutionQuestions.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
              </div>

              {/* 问题卡片 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionData.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-card/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                >
                  <h2 className="text-lg font-medium text-foreground mb-6 leading-relaxed">
                    {currentQuestionData.question}
                  </h2>

                  <div className="space-y-3">
                    {currentQuestionData.options.map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => handleAnswer(currentQuestionData.id, option.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${
                          currentAnswer?.optionValue === option.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background/50 text-foreground hover:border-primary/50 hover:bg-background'
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* 导航按钮 */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                  className={`px-6 py-3 rounded-xl transition-all ${
                    currentQuestion === 0
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  上一题
                </button>
                <div className="flex items-center gap-1">
                  {constitutionQuestions.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentQuestion
                          ? 'bg-primary w-4'
                          : index < currentQuestion || answers.some(a => a.questionId === constitutionQuestions[index].id)
                          ? 'bg-primary/50'
                          : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 步骤3: 结果展示 */}
          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md"
            >
              {/* 结果卡片 */}
              <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 text-center">
                {/* 体质图标 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl"
                >
                  <span className="text-3xl font-serif text-primary-foreground">
                    {result.type.charAt(0)}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-muted-foreground mb-2">您的体质类型</p>
                  <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
                    {result.type}
                  </h2>
                  
                  {/* 得分 */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="text-muted-foreground">体质倾向</span>
                    <span className="text-2xl font-bold text-primary">{result.score}</span>
                    <span className="text-muted-foreground">分</span>
                  </div>

                  {/* 体质描述 */}
                  <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
                    <p className="text-foreground/90 leading-relaxed">
                      {constitutionTypes[result.type]?.description}
                    </p>
                  </div>

                  {/* 调养建议 */}
                  <div className="text-left mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">调养建议</h3>
                    <div className="space-y-2">
                      {constitutionTypes[result.type]?.advice.map((advice, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-foreground/90">{advice}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 进入主页按钮 */}
              <motion.button
                onClick={handleEnterHome}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                开始使用
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                体质报告已保存，可在报告中心查看
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
