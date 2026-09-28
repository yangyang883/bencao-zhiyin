'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tips = [
  {
    title: '每日健康记录',
    content: '把今天的作息与感受记在养生日历中，方便之后回顾。',
    icon: '🌿',
    season: 'spring',
  },
  {
    title: '饮食调理',
    content: '食宜温补，忌生冷。推荐红枣枸杞茶，补气养血，提升免疫力。',
    icon: '🍵',
    season: 'all',
  },
  {
    title: '经络保健',
    content: '每日按揉足三里、合谷穴各3分钟，可调理脾胃，增强体质。',
    icon: '💆',
    season: 'all',
  },
  {
    title: '作息养生',
    content: '子时（23:00-1:00）宜入睡，此时胆经当令，养胆护肝。',
    icon: '🌙',
    season: 'all',
  },
  {
    title: '情志调养',
    content: '怒伤肝，喜伤心。保持平和心态，可练习八段锦或太极拳。',
    icon: '🧘',
    season: 'all',
  },
]

export function HealthTip() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tips.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const currentTip = tips[currentIndex]

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-card to-light-cream/50 rounded-2xl p-5 border border-border/50 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-warm-gold/20 flex items-center justify-center text-2xl flex-shrink-0">
              {currentTip.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-2">{currentTip.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentTip.content}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 指示器 */}
      <div className="flex justify-center gap-1.5 mt-4">
        {tips.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-6 bg-primary'
                : 'bg-border hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
