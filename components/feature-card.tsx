'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  href: string
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  index: number
}

export function FeatureCard({ href, title, description, icon, gradient, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={href}>
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br',
            gradient,
            'border border-border/50 shadow-sm hover:shadow-lg transition-shadow duration-300'
          )}
        >
          {/* 装饰背景 */}
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-primary/5 blur-xl" />
          
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center text-primary mb-3 shadow-sm">
              {icon}
            </div>
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
