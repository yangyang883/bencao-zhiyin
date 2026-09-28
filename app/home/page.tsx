'use client'

import { motion, type Variants } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getUserProfile } from '@/lib/user-store'
import { getAllReports } from '@/lib/report-store'
import { FeatureCard } from '@/components/feature-card'
import { HealthTip } from '@/components/health-tip'

const features = [
  {
    href: '/home/tongue',
    title: '智能舌诊',
    description: '拍摄舌象，辅助健康参考',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    gradient: 'from-primary/20 to-accent/20',
  },
  {
    href: '/home/chat',
    title: 'AI问诊',
    description: '知识图谱智能问答',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    gradient: 'from-herbal-green/20 to-primary/20',
  },
  {
    href: '/home/knowledge',
    title: '知识图谱',
    description: '中医知识库，智能检索',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    href: '/home/reports',
    title: '报告播报',
    description: '健康报告，语音播报',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    gradient: 'from-warm-gold/20 to-accent/20',
  },
  {
    href: '/home/profile',
    title: '个人中心',
    description: '健康档案，养生方案',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    gradient: 'from-deep-brown/20 to-primary/20',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export default function HomePage() {
  const [summary,setSummary] = useState({constitution:'未评估',tongue:0,chat:0})
  useEffect(()=>{const reports=getAllReports();setSummary({constitution:getUserProfile()?.constitution?.type||'未评估',tongue:reports.filter(r=>r.type==='tongue').length,chat:reports.filter(r=>r.type==='consultation').length})},[])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background">
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative px-4 pt-8 pb-4"
      >
        {/* 头部问候 */}
        <motion.header variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">
                本草知音
              </h1>
              <p className="text-muted-foreground mt-1">
                {getGreeting()}，愿您身体安康
              </p>
            </div>
            <Link
              href="/home/profile"
              className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
            >
              <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </motion.header>

        {/* 健康状态卡片 */}
        <motion.section variants={itemVariants} className="mb-8">
          <div className="bg-gradient-to-br from-card to-secondary/30 rounded-2xl p-6 shadow-lg border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">本机健康记录</h2>
              <span className="text-sm text-muted-foreground">{getTodayDate()}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-herbal-green/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-herbal-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-foreground">{summary.constitution}</p>
                <p className="text-xs text-muted-foreground">问卷体质倾向</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-warm-gold/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-warm-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-foreground">{summary.tongue} 次</p>
                <p className="text-xs text-muted-foreground">舌象记录</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-foreground">{summary.chat} 次</p>
                <p className="text-xs text-muted-foreground">咨询记录</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 功能入口 */}
        <motion.section variants={itemVariants} className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">健康服务</h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <FeatureCard key={feature.href} {...feature} index={index} />
            ))}
          </div>
        </motion.section>

        {/* 养生小贴士 */}
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-semibold text-foreground mb-4">每日养生</h2>
          <HealthTip />
        </motion.section>
      </motion.div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早安'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

function getTodayDate(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekDay = weekDays[now.getDay()]
  return `${month}月${day}日 周${weekDay}`
}
