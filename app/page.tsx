'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getUserProfile } from '@/lib/user-store'

export default function SplashPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showEnter, setShowEnter] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // 检查用户是否已登录
    const user = getUserProfile()
    setIsLoggedIn(!!user)
    
    const timer = setTimeout(() => {
      setIsLoading(false)
      setShowEnter(true)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = () => {
    // 如果已登录，直接进入主页；否则进入登录页
    if (isLoggedIn) {
      router.push('/home')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* 背景装饰 */}
      <div className="absolute inset-0 chinese-pattern opacity-30" />
      
      {/* 浮动装饰元素 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
        className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl"
      />

      {/* 主内容区 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo 和标题 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          {/* Logo 图标 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, type: 'spring', stiffness: 100 }}
            className="relative mb-8"
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl">
              <svg
                viewBox="0 0 100 100"
                className="w-16 h-16 md:w-20 md:h-20 text-primary-foreground"
                fill="currentColor"
              >
                {/* 草药叶子图案 */}
                <path d="M50 15 C30 25 20 45 25 65 C30 75 40 85 50 85 C60 85 70 75 75 65 C80 45 70 25 50 15 Z" opacity="0.9" />
                <path d="M50 25 C45 35 45 55 50 70 M35 40 C45 45 55 45 65 40" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
                <circle cx="50" cy="50" r="8" opacity="0.8" />
              </svg>
            </div>
            {/* 脉冲光环 */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-full border-2 border-primary/30"
            />
          </motion.div>

          {/* 标题 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground tracking-wider mb-4"
          >
            本草知音
          </motion.h1>

          {/* 副标题 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-lg md:text-xl text-muted-foreground font-light tracking-wide mb-2"
          >
            智能中医健康管理平台
          </motion.p>

          {/* 描述文字 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="text-sm md:text-base text-muted-foreground/80 text-center max-w-md mt-4 leading-relaxed"
          >
            融合千年本草智慧与现代AI科技
            <br />
            为您的健康保驾护航
          </motion.p>
        </motion.div>

        {/* 加载动画或进入按钮 */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-16"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
                />
                <span className="text-muted-foreground">正在加载...</span>
              </div>
            </motion.div>
          ) : (
            showEnter && (
              <motion.div
                key="enter"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-16"
              >
                <motion.button
                  onClick={handleEnter}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-12 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  {/* 背景动画 */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    进入平台
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </motion.button>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* 底部装饰 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-0 right-0 flex justify-center"
        >
          <div className="flex items-center gap-8 text-muted-foreground/60 text-sm">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                <path d="M10 6a1 1 0 011 1v3h2a1 1 0 110 2H9V7a1 1 0 011-1z" />
              </svg>
              24小时在线
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              隐私保护
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              专业认证
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
