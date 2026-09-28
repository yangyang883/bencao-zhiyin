import { z } from 'zod'
import { getKnowledgeGraph } from '@/lib/knowledge-graph'
import { chatURL } from '@/lib/cloud'
import { isOffline } from '@/lib/offline'
export const maxDuration = 60
const messageSchema = z.object({role:z.enum(['user','assistant']),content:z.string().max(12000).optional(),parts:z.array(z.object({type:z.literal('text'),text:z.string().max(12000)})).max(20).optional()})
export async function POST(req: Request) {
 const body = await req.json().catch(()=>null)
 const parsed = z.object({messages:z.array(messageSchema).min(1).max(100)}).safeParse(body)
 if(!parsed.success) return Response.json({error:'无效的对话内容，请缩短输入或重新开始对话'},{status:400})
 const messages=parsed.data.messages.map(m=>({role:m.role,content:m.content||m.parts?.map(p=>p.text).join('')||''}))
 const last=messages[messages.length-1].content.trim()
 if(!last) return Response.json({error:'请输入咨询内容'},{status:400})
 let reason=isOffline()?'离线模式':'未配置在线模型'
 if(isOffline()){
  try{
   const response=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',redirect:'error',signal:AbortSignal.any([req.signal,AbortSignal.timeout(45000)]),headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'qwen3:0.6b',stream:false,think:false,keep_alive:0,messages:[{role:'system',content:'你是本草知音离线助手。用简短中文回答，最多150字。不作诊断，不开处方，不给药物剂量；不确定就说明。以下知识仅供参考：'+getKnowledgeGraph().getEducationalContext(last).slice(0,1800)+' /no_think'},...messages.slice(-6).map(m=>({...m,content:m.content.slice(0,1500)}))],options:{num_ctx:2048,num_predict:220,num_thread:4,temperature:0.3}})})
   if(!response.ok) throw new Error('local model unavailable')
   const data=await response.json(),text=data.message?.content?.trim()
   if(typeof text!=='string'||!text||text.length>5000||text.includes('<think>')||data.done_reason==='length') throw new Error('invalid local reply')
   const reply='【本地通义生成，仅供参考】\n\n'+text
   return new Response(`data: ${JSON.stringify({type:'text-delta',delta:reply})}\n\ndata: [DONE]\n\n`,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Reply-Source':'local-qwen'}})
  }catch{if(req.signal.aborted)return new Response(null,{status:499});reason='本地通义未就绪或超时，使用本地知识库'}
 }
 if(!isOffline() && process.env.DASHSCOPE_API_KEY){
  try{
   const response=await fetch(chatURL,{method:'POST',signal:AbortSignal.any([req.signal,AbortSignal.timeout(45000)]),headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.DASHSCOPE_API_KEY}`},body:JSON.stringify({model:process.env.DASHSCOPE_CHAT_MODEL||'qwen-plus',messages:[{role:'system',content:'你是本草知音健康助手。用简洁清晰的中文回答，支持多轮交流。提供一般健康信息，不作确定诊断，不声称照片或问卷可确诊，不开处方或给出药物剂量；需要时建议就医。'+'\n以下本地知识仅供参考：\n'+getKnowledgeGraph().getEducationalContext(last)},...messages.slice(-20)],stream:true,temperature:0.5,max_tokens:1600})})
   if(response.ok && response.body) return new Response(response.body,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Reply-Source':'cloud'}})
   const failure=await response.json().catch(()=>null)
   reason=failure?.error?.code==='Arrearage'?'阿里云账户欠费或状态异常':`在线服务返回 ${response.status}`
  }catch{if(req.signal.aborted)return new Response(null,{status:499});reason='在线服务连接失败或超时'}
 }
 const graph=getKnowledgeGraph(),context=graph.getEducationalContext(last)
 let reply=`【本地知识库参考：${reason}】\n\n`
 if(context) reply+=context+'\n\n以上为知识条目匹配，不代表诊断。不适持续或加重时请就医。'
 else reply+='暂未匹配到相关条目，可以尝试失眠、反酸、燕麦等关键词。'
 return new Response(`data: ${JSON.stringify({type:'text-delta',delta:reply})}\n\ndata: [DONE]\n\n`,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Reply-Source':'local'}})
}
