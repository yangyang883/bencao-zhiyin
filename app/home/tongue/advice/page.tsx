import { TongueAdvicePanel } from '@/components/tongue-advice'

export default function AdvicePage() {
  return <main className="mx-auto max-w-3xl px-4 py-6 space-y-4"><h1 className="text-xl font-semibold">离线健康建议</h1>
    <p className="text-sm text-muted-foreground">没有照片也可先补充不适；完成舌象分析后，结果页会自动带入模型观察项。</p>
    <TongueAdvicePanel />
  </main>
}
