'use client'
import { useEffect, useState } from 'react'
import { getSettings, localDate, readLocal, writeLocal } from '@/lib/device-store'
export function DeviceNotices() {
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const check = () => {
      if (getSettings().dailyReminder && readLocal('bencao_reminder_day', '') !== localDate()) setNotice('今日养生提醒：规律饮食，适度活动，按时休息。')
    }
    const report = () => { if (getSettings().reportNotice) setNotice('健康报告已更新，可在“报告”中查看。') }
    check(); const timer = setInterval(check, 60000)
    window.addEventListener('deviceDataUpdated', check); window.addEventListener('reportsUpdated', report)
    return () => { clearInterval(timer); window.removeEventListener('deviceDataUpdated', check); window.removeEventListener('reportsUpdated', report) }
  }, [])
  return notice ? <aside role="status" className="fixed top-2 inset-x-3 z-40 max-w-xl mx-auto bg-card border rounded-xl p-3 shadow-lg flex items-center gap-3"><p className="flex-1">{notice}</p><button className="p-2 border rounded" onClick={() => { setNotice(''); writeLocal('bencao_reminder_day', localDate()) }}>知道了</button></aside> : null
}
