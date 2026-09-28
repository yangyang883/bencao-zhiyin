import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '本草知音 - 智能中医健康管理平台',
  description: '融合传统中医智慧与现代AI技术，为您提供智能舌诊、健康咨询、个性化养生建议的专业中医健康管理平台。',
  keywords: ['中医', '健康管理', '智能舌诊', 'AI健康', '养生', '本草'],
  authors: [{ name: '本草知音' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 3,
  userScalable: true,
  themeColor: '#8B5A2B',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="bg-background">
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
