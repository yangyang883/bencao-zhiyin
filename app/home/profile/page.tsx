'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getUserProfile, type UserProfile } from '@/lib/user-store'
import { getAllReports, type Report } from '@/lib/report-store'
const menus = [['编辑资料','edit'],['体质详情','constitution'],['健康档案','health-records'],['养生日历','calendar'],['我的收藏','favorites'],['消息提醒','notifications'],['数据与隐私','privacy'],['设备检测','device'],['使用帮助','help'],['关于作品','about']]
export default function ProfilePage() {
 const [user,setUser]=useState<UserProfile|null>(null)
 const [reports,setReports]=useState<Report[]>([])
 useEffect(()=>{const load=()=>{setUser(getUserProfile());setReports(getAllReports())};load();window.addEventListener('userProfileUpdated',load);window.addEventListener('reportsUpdated',load);return()=>{window.removeEventListener('userProfileUpdated',load);window.removeEventListener('reportsUpdated',load)}},[])
 return <main className="max-w-3xl mx-auto p-5 space-y-6"><header className="bg-card border rounded-2xl p-6"><p className="text-primary">本草知音 · 设备版</p><h1 className="text-2xl font-serif mt-2">{user?.name || '尚未建立个人档案'}</h1><p className="text-muted-foreground mt-2">{user ? '此档案保存在当前设备浏览器中' : '先填写资料与问卷，建立本机健康档案'}</p>{!user && <Link className="inline-block mt-4 underline" href="/login">建立档案</Link>}</header><section className="grid grid-cols-3 gap-3">{[['舌诊',reports.filter(r=>r.type==='tongue').length],['咨询',reports.filter(r=>r.type==='consultation').length],['体质报告',reports.filter(r=>r.type==='constitution').length]].map(([name,count])=><div key={name} className="bg-card border rounded-xl p-4 text-center"><strong className="text-2xl">{count}</strong><p>{name}</p></div>)}</section><section className="bg-card border rounded-xl p-5"><h2 className="font-semibold">我的体质倾向</h2><p className="mt-2">{user?.constitution?.type || '尚未完成问卷'}</p><p className="text-sm text-muted-foreground">问卷结果仅供健康参考，不是医学诊断。</p></section><nav className="grid grid-cols-2 gap-3">{menus.map(([name,path])=><Link key={path} className="border rounded-xl bg-card p-4" href={'/home/profile/'+path}>{name} →</Link>)}</nav></main>
}
