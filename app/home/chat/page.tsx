'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChatMessage } from '@/components/chat-message'
import { VoiceInput } from '@/components/voice-input'
import { cn } from '@/lib/utils'
import { useSpeech } from '@/hooks/use-speech'
import { createConsultationReport, saveReport } from '@/lib/report-store'

const quickQuestions = [
  '我最近总是失眠，该怎么调理？',
  '气血不足有什么表现？',
  '春季如何养肝？',
  '体寒的人适合吃什么？',
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const speech = useSpeech()
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [replySource, setReplySource] = useState('健康咨询')
  const [showVoice, setShowVoice] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    speech.stop()
    setSaveError('')

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      // 构建消息历史，转换为 UIMessage 格式
      const historyMessages = [...messages, userMessage].map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: 'text' as const, text: msg.content }],
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyMessages }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const failure = await response.json().catch(() => null)
        throw new Error(failure?.error || '请求失败')
      }

      const source = response.headers.get('X-Reply-Source')
      setReplySource(source === 'cloud' ? '在线模型' : source === 'local-qwen' ? '本地通义 · 离线' : '本地知识库')
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应')

      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        buffer += decoder.decode(value, { stream: !done })
        const lines = buffer.split('\n')
        buffer = done ? '' : lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data:')) {
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const delta = parsed.type === 'text-delta' ? parsed.delta : parsed.choices?.[0]?.delta?.content
              if (typeof delta === 'string') {
                fullContent += delta
                setStreamingContent(fullContent)
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
        if (done) break
      }

      if (!fullContent.trim()) throw new Error('服务未返回有效回复，请重试')

      // 添加助手消息
      if (fullContent) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullContent,
        }
        setMessages((prev) => [...prev, assistantMessage])
        if (!saveReport(createConsultationReport(text.slice(0, 60), '问题：' + text + '\n\n回复：' + fullContent))) setSaveError('本次回复未保存，请检查本机存储空间')
        if (autoSpeak) void speech.speak(fullContent)
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Chat error:', error)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: error instanceof Error ? error.message : '服务暂时不可用，请稍后重试。',
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } finally {
      setIsLoading(false)
      setStreamingContent('')
    }
  }, [messages, isLoading, autoSpeak, speech.speak, speech.stop])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickQuestion = (question: string) => {
    sendMessage(question)
  }

  const handleVoiceResult = (text: string) => {
    setShowVoice(false)
    void sendMessage(text)
  }

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  // 将消息转换为 ChatMessage 组件需要的格式
  const displayMessages = messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: 'text' as const, text: msg.content }],
  }))

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-gradient-to-b from-background to-secondary/10">
      {/* 头部 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="px-4 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-foreground">AI健康顾问</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? '正在思考中...' : replySource}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-2 flex flex-wrap items-center gap-3 border-b">
        <label className="flex items-center gap-2"><input type="checkbox" checked={autoSpeak} onChange={e => { setAutoSpeak(e.target.checked); if (!e.target.checked) speech.stop() }} />自动播报</label>
        <Button size="sm" variant="outline" disabled={!messages.some(m => m.role === 'assistant')} onClick={() => { const last = [...messages].reverse().find(m => m.role === 'assistant'); if (last) void speech.speak(last.content) }}>播报回复</Button>
        {speech.speaking && <Button size="sm" variant="outline" onClick={speech.stop}>停止播报</Button>}
        {(speech.error || saveError) && <p role="alert" className="w-full text-sm text-destructive">{speech.error || saveError}</p>}
      </div>
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !streamingContent ? (
          <WelcomeSection onQuickQuestion={handleQuickQuestion} />
        ) : (
          <>
            {displayMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {/* 流式输出中的消息 */}
            {streamingContent && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  parts: [{ type: 'text', text: streamingContent }],
                }}
              />
            )}
            {/* 加载动画 */}
            {isLoading && !streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-border/50">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 语音输入弹窗 */}
      <AnimatePresence>
        {showVoice && (
          <VoiceInput
            onResult={handleVoiceResult}
            onClose={() => setShowVoice(false)}
          />
        )}
      </AnimatePresence>

      {/* 输入区域 */}
      <div className="border-t border-border/50 bg-background/95 backdrop-blur p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="描述您的健康问题..."
              rows={1}
              className={cn(
                'w-full resize-none rounded-2xl border border-input bg-card px-4 py-3 pr-12',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                'min-h-[48px] max-h-[120px]'
              )}
              style={{ height: 'auto' }}
              disabled={isLoading}
            />
            {/* 语音按钮 */}
            <button
              type="button"
              aria-label="语音输入"
              disabled={isLoading}
              onClick={() => { speech.stop(); setShowVoice(true) }}
              className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
          <Button
            aria-label="发送消息"
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  )
}

function WelcomeSection({ onQuickQuestion }: { onQuickQuestion: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full py-8"
    >
      {/* AI头像 */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl mb-6"
      >
        <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </motion.div>

      <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
        您好，我是AI健康顾问
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-xs">
        我可以为您提供中医养生建议、体质分析、健康咨询等服务
      </p>

      {/* 快捷问题 */}
      <div className="w-full space-y-2">
        <p className="text-sm text-muted-foreground mb-3">试试这些问题：</p>
        {quickQuestions.map((question, index) => (
          <motion.button
            key={question}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onQuickQuestion(question)}
            className="w-full text-left px-4 py-3 rounded-xl bg-card border border-border/50 text-foreground hover:bg-secondary/50 hover:border-primary/30 transition-colors"
          >
            <span className="text-primary mr-2">Q:</span>
            {question}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
