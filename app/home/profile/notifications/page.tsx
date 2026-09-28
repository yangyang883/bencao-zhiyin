'use client'
import { useEffect,useState } from 'react'
import { PageShell } from '@/components/page-shell'
import { defaultSettings,getSettings,writeLocal } from '@/lib/device-store'
export default function NotificationsPage(){const [settings,setSettings]=useState(defaultSettings),[error,setError]=useState('');useEffect(()=>setSettings(getSettings()),[]);return <PageShell title="消息提醒"><p>提醒在本程序打开时显示；关闭程序后不发送系统推送。</p>{([['dailyReminder','每日养生提醒'],['reportNotice','报告生成提醒']] as const).map(([key,label])=><label key={key} className="flex justify-between bg-card border rounded-xl p-5">{label}<input type="checkbox" checked={settings[key]} onChange={e=>{const next={...settings,[key]:e.target.checked};if(writeLocal('bencao_settings',next)){setSettings(next);setError('')}else setError('设置保存失败')}}/></label>)}{error&&<p role="alert">{error}</p>}</PageShell>}
