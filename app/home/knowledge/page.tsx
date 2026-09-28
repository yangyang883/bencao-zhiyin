'use client'

import { TongueStandardSource } from '@/components/tongue-standard-source'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getFavorites, toggleFavorite } from '@/lib/device-store'
import { 
  ChevronLeft, 
  Search, 
  Leaf, 
  Activity, 
  Heart, 
  Sparkles,
  BookOpen,
  CircleDot,
  Apple,
  Brain,
  ChevronRight,
  X
} from 'lucide-react'

interface Entity {
  id: string
  name: string
  type: string
  aliases?: string[]
  description?: string
  properties?: Record<string, string | string[]>
}

interface GraphStats {
  totalEntities: number
  totalRelations: number
  entityCounts: {
    symptoms: number
    diseases: number
    constitutions: number
    herbs: number
    acupoints: number
    organs: number
    foods: number
    tongues: number
    educations: number
  }
}

const categoryConfig = {
  educations: { name: '健康科普', icon: BookOpen, color: 'from-teal-500 to-cyan-500', bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
  tongues: { name: '舌象术语', icon: BookOpen, color: 'from-rose-500 to-pink-500', bgColor: 'bg-rose-50', textColor: 'text-rose-700' },
  symptoms: { 
    name: '症状', 
    icon: Activity, 
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700'
  },
  diseases: { 
    name: '证型', 
    icon: Heart, 
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  constitutions: { 
    name: '体质', 
    icon: Sparkles, 
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700'
  },
  herbs: { 
    name: '中药', 
    icon: Leaf, 
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  acupoints: { 
    name: '穴位', 
    icon: CircleDot, 
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  organs: { 
    name: '脏腑', 
    icon: Brain, 
    color: 'from-rose-500 to-red-500',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700'
  },
  foods: { 
    name: '食材', 
    icon: Apple, 
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700'
  },
}

export default function KnowledgePage() {
  const [stats, setStats] = useState<GraphStats | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Entity[]>([])
  const [loading, setLoading] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [favoriteError, setFavoriteError] = useState('')
  useEffect(() => { setFavoriteIds(getFavorites().map(item => item.id)) }, [])

  // 加载统计数据
  useEffect(() => {
    fetch('/api/knowledge-graph?action=stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error)
  }, [])

  // 加载分类数据
  const loadCategory = async (category: string) => {
    setLoading(true)
    setSelectedCategory(category)
    setSelectedEntity(null)
    try {
      const res = await fetch(`/api/knowledge-graph?action=${category}`)
      const data = await res.json()
      setEntities(data[category] || [])
    } catch (error) {
      console.error('Failed to load category:', error)
    }
    setLoading(false)
  }

  // 搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setSelectedCategory(null)
    try {
      const res = await fetch(`/api/knowledge-graph?action=search&query=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.entities || [])
    } catch (error) {
      console.error('Search failed:', error)
    }
    setLoading(false)
  }

  // 渲染属性
  const renderProperties = (properties: Record<string, string | string[]>) => {
    return Object.entries(properties).map(([key, value]) => (
      <div key={key} className="mb-2">
        <span className="font-medium text-foreground/80">{key}：</span>
        <span className="text-foreground/70">
          {key === '来源链接' && typeof value === 'string' && value.startsWith('https://') ? <a href={value} target="_blank" rel="noopener noreferrer" className="underline break-all">查看原始来源</a> : Array.isArray(value) ? value.join('、') : value}
        </span>
      </div>
    ))
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TongueStandardSource />
      {/* 头部 */}
      <div className="bg-gradient-to-br from-primary/90 to-primary-dark text-primary-foreground px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/home" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">中医知识图谱</h1>
        </div>
        
        {/* 搜索框 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索症状、中药、穴位..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/90 transition-colors"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && !selectedCategory && searchResults.length === 0 && (
        <div className="px-4 py-4">
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">知识库概览</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-primary/5 rounded-xl p-3">
                <div className="text-2xl font-bold text-primary">{stats.totalEntities}</div>
                <div className="text-sm text-foreground/60">实体总数</div>
              </div>
              <div className="bg-accent/10 rounded-xl p-3">
                <div className="text-2xl font-bold text-accent">{stats.totalRelations}</div>
                <div className="text-sm text-foreground/60">关系总数</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 分类网格 */}
      {!selectedCategory && searchResults.length === 0 && (
        <div className="px-4 py-2">
          <h2 className="font-semibold mb-3 text-foreground/80">知识分类</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon
              const count = stats?.entityCounts[key as keyof typeof stats.entityCounts] || 0
              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => loadCategory(key)}
                  className={`${config.bgColor} rounded-2xl p-4 text-left transition-shadow hover:shadow-md`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`font-semibold ${config.textColor}`}>{config.name}</div>
                  <div className="text-sm text-foreground/50">{count} 条记录</div>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">搜索结果 ({searchResults.length})</h2>
            <button
              onClick={() => {
                setSearchResults([])
                setSearchQuery('')
              }}
              className="text-sm text-primary"
            >
              清除
            </button>
          </div>
          <div className="space-y-2">
            {searchResults.map((entity) => {
              const typeKey = entity.type + 's' as keyof typeof categoryConfig
              const config = categoryConfig[typeKey] || categoryConfig.symptoms
              return (
                <motion.button
                  key={entity.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedEntity(entity)}
                  className="w-full bg-card rounded-xl p-4 text-left shadow-sm border border-border/50 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                    <config.icon className={`w-5 h-5 ${config.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{entity.name}</div>
                    <div className="text-sm text-foreground/50 truncate">
                      {entity.description || config.name}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground/30 shrink-0" />
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* 分类列表 */}
      {selectedCategory && (
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => {
                setSelectedCategory(null)
                setEntities([])
              }}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold">
              {categoryConfig[selectedCategory as keyof typeof categoryConfig]?.name || selectedCategory}
            </h2>
            <span className="text-sm text-foreground/50">({entities.length})</span>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {entities.map((entity) => {
                const config = categoryConfig[selectedCategory as keyof typeof categoryConfig]
                return (
                  <motion.button
                    key={entity.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedEntity(entity)}
                    className="w-full bg-card rounded-xl p-4 text-left shadow-sm border border-border/50 flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-lg ${config?.bgColor || 'bg-primary/10'} flex items-center justify-center shrink-0`}>
                      {config && <config.icon className={`w-5 h-5 ${config.textColor}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{entity.name}</div>
                      {entity.aliases && entity.aliases.length > 0 && (
                        <div className="text-xs text-foreground/40 truncate">
                          别名：{entity.aliases.join('、')}
                        </div>
                      )}
                      <div className="text-sm text-foreground/50 truncate mt-0.5">
                        {entity.description || '暂无描述'}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground/30 shrink-0" />
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 实体详情弹窗 */}
      <AnimatePresence>
        {selectedEntity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedEntity(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-background rounded-t-3xl max-h-[85vh] overflow-hidden"
            >
              {/* 拖动条 */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 bg-muted rounded-full" />
              </div>
              
              {/* 内容 */}
              <div className="px-6 pb-8 max-h-[calc(85vh-40px)] overflow-y-auto">
                <button className="border rounded-lg px-4 py-2 mb-4" onClick={() => { if (toggleFavorite(selectedEntity)) { setFavoriteIds(getFavorites().map(item => item.id)); setFavoriteError('') } else setFavoriteError('收藏保存失败，请检查存储空间') }}>{favoriteIds.includes(selectedEntity.id) ? '取消收藏' : '收藏此条目'}</button>
                {favoriteError && <p role="alert">{favoriteError}</p>}
                {/* 头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedEntity.name}</h2>
                    {selectedEntity.aliases && selectedEntity.aliases.length > 0 && (
                      <p className="text-sm text-foreground/50 mt-1">
                        别名：{selectedEntity.aliases.join('、')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedEntity(null)}
                    className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* 描述 */}
                {selectedEntity.description && (
                  <div className="bg-muted/50 rounded-xl p-4 mb-4">
                    <p className="text-foreground/80 leading-relaxed">
                      {selectedEntity.description}
                    </p>
                  </div>
                )}
                
                {/* 属性 */}
                {selectedEntity.properties && Object.keys(selectedEntity.properties).length > 0 && (
                  <div className="bg-card rounded-xl p-4 border border-border/50">
                    <h3 className="font-semibold mb-3 text-foreground/80">详细信息</h3>
                    {renderProperties(selectedEntity.properties)}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
