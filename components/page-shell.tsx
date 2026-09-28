import Link from 'next/link'
export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto p-4 pb-24 space-y-5"><header className="flex items-center gap-4 py-3"><Link href="/home/profile" className="border rounded-lg px-3 py-2">返回</Link><h1 className="text-xl font-serif font-bold">{title}</h1></header>{children}</div>
}
