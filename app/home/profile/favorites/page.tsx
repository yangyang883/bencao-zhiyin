'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { PageShell } from '@/components/page-shell'
import { getFavorites,toggleFavorite,type Favorite } from '@/lib/device-store'
export default function FavoritesPage(){const [items,setItems]=useState<Favorite[]>([]),[error,setError]=useState('');useEffect(()=>setItems(getFavorites()),[]);return <PageShell title="我的收藏"><Link href="/home/knowledge" className="underline">前往知识库添加收藏</Link>{error&&<p role="alert">{error}</p>}{items.length===0?<p>暂无收藏。</p>:items.map(item=><article className="border rounded-xl bg-card p-4 space-y-2" key={item.id}><h2 className="font-semibold">{item.name}</h2><p>{item.description}</p>{Object.entries(item.properties||{}).map(([key,value])=><p key={key}>{key}：{Array.isArray(value)?value.join('、'):value}</p>)}<button className="border rounded p-2" onClick={()=>{if(toggleFavorite(item)){setItems(getFavorites());setError('')}else setError('保存失败')}}>取消收藏</button></article>)}</PageShell>}
