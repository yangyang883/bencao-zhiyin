import { tongueStandard as standard } from '@/lib/knowledge-graph/tongue-standard'

export function TongueStandardSource() {
  return (
    <aside className="mx-4 my-4 rounded-xl border border-primary/20 bg-card p-4 text-sm" aria-label="舌象标准资料">
      <h2 className="font-semibold">舌象标准资料</h2>
      <p className="mt-2">{standard.number} · {standard.title}</p>
      <p className="mt-1 text-muted-foreground">{standard.status} · {standard.effective} 实施 · 信息核对于 {standard.verified}</p>
      <p className="mt-2 text-muted-foreground">{standard.note}</p>
      <p className="mt-2 text-muted-foreground">另已收录30条用户整理的舌象术语，可在知识图谱的“舌象术语”分类检索；内部编码T001–T030，待原文校准。</p>
      <a className="mt-2 block text-primary underline" href="https://www.who.int/publications/i/item/9789240042322" target="_blank" rel="noopener noreferrer">WHO 2022 术语资料（参考文献，未导入全文） ↗</a>
      <a className="mt-3 inline-block text-primary underline" href={standard.url} target="_blank" rel="noopener noreferrer">查看官方标准信息 ↗</a>
    </aside>
  )
}
