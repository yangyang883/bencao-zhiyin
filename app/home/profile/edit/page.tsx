'use client'
import { useEffect,useState } from 'react'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { getUserProfile,saveUserProfile,generateUserId } from '@/lib/user-store'
export default function EditProfilePage(){
 const [name,setName]=useState(''),[age,setAge]=useState(''),[gender,setGender]=useState<'male'|'female'>('male'),[phone,setPhone]=useState(''),[message,setMessage]=useState('')
 useEffect(()=>{const user=getUserProfile();if(user){setName(user.name);setAge(String(user.age));setGender(user.gender);setPhone(user.phone||'')}},[])
 return <PageShell title="编辑资料"><form className="space-y-4 bg-card rounded-xl border p-5" onSubmit={e=>{e.preventDefault();const old=getUserProfile();const ok=saveUserProfile({...old,id:old?.id||generateUserId(),createdAt:old?.createdAt||new Date().toISOString(),name:name.trim(),age:Number(age),gender,phone:phone.trim()||undefined});setMessage(ok?'资料已保存':'保存失败，请检查浏览器存储空间')}}><label className="block">姓名<input aria-label="姓名" className="block border rounded p-3 w-full" required maxLength={40} value={name} onChange={e=>setName(e.target.value)}/></label><label className="block">年龄<input aria-label="年龄" className="block border rounded p-3 w-full" type="number" required min={1} max={120} value={age} onChange={e=>setAge(e.target.value)}/></label><label className="block">性别<select className="block border rounded p-3 w-full" value={gender} onChange={e=>setGender(e.target.value as 'male'|'female')}><option value="male">男</option><option value="female">女</option></select></label><label className="block">联系电话（选填）<input aria-label="联系电话" className="block border rounded p-3 w-full" type="tel" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)}/></label><Button type="submit">保存资料</Button><p role="status">{message}</p></form></PageShell>
}
