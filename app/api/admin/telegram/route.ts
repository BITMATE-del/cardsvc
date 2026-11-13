import {NextRequest,NextResponse} from 'next/server';
import {randomBytes} from 'node:crypto';
import {database,isAdmin} from '@/lib/db';
export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
const BOT_USERNAME='postmemenu_bot';
type TelegramUpdate={message?:{text?:string;chat?:{id:number;type:string};from?:{username?:string}}};
async function telegramCall<T>(token:string,method:string):Promise<T>{
 let res:Response;
 try{res=await fetch('https://api.telegram.org/bot'+token+'/'+method,{cache:'no-store',signal:AbortSignal.timeout(6500)})}
 catch{throw Error('텔레그램 서버 통신이 실패했습니다. 잠시 후 다시 확인해 주세요.')}
 if(res.status===401||res.status===404)throw Error('설정된 봇 토큰을 인증할 수 없습니다. Vercel 환경변수와 재배포 여부를 확인해 주세요.');
 if(res.status===409)throw Error('다른 프로그램이 이 봇의 메시지를 받고 있거나 웹훅이 연결되어 있습니다. 동일 봇의 중복 연결을 확인해 주세요.');
 if(res.status===429)throw Error('텔레그램 요청이 너무 많습니다. 잠시 후 새로고침해 주세요.');
 if(!res.ok)throw Error('텔레그램 연결 오류 (HTTP '+res.status+')');
 const result:{ok:boolean;result?:T;description?:string}=await res.json();
 if(!result.ok||result.result===undefined)throw Error('텔레그램 응답 오류');
 return result.result;
}
async function collectPairings(token:string){
 const me=await telegramCall<{username?:string}>(token,'getMe');
 if(me.username?.toLowerCase()!==BOT_USERNAME)throw Error('현재 설정된 토큰의 봇(@'+(me.username||'알 수 없음')+')이 @'+BOT_USERNAME+'과 다릅니다.');
 const sql=database();if(!sql)throw Error('DB 연결 실패');
 const updates=await telegramCall<TelegramUpdate[]>(token,'getUpdates?limit=100&timeout=0&allowed_updates=%5B%22message%22%5D');
 if(!Array.isArray(updates))throw Error('봇 메시지 응답 형식 오류');
 for(const item of updates){
  const msg=item.message;
  if(msg?.chat?.type!=='private'||!Number.isSafeInteger(msg.chat.id))continue;
  const tokens=(msg.text||'').trim().split(' ');
  const command=tokens[0]?.split('@')[0];
  const code=tokens.length===2&&command==='/start'&&/^[a-f0-9]{24}$/i.test(tokens[1])?tokens[1].toLowerCase():null;
  if(!code)continue;
  const rows=await sql`update admin_telegram_pairings set chat_id=${msg.chat.id}
    where code=${code} and chat_id is null and expires_at>now() returning code`;
  if(rows.length){
   await sql`insert into admin_telegram_chats(chat_id,username,active,bot_username)
    values(${msg.chat.id},${msg.from?.username||null},true,${BOT_USERNAME})
    on conflict(chat_id) do update set username=excluded.username,active=true,bot_username=excluded.bot_username`;
  }
 }
}
export async function GET(req:NextRequest){
 if(!await isAdmin())return response({error:'관리자 권한이 필요합니다.'},403);
 const sql=database();if(!sql)return response({error:'DB 연결 실패'},503);
 const token=process.env.SUSHIJARO_TELEGRAM_BOT_TOKEN?.trim();
 let warning='';
 if(token){try{await collectPairings(token)}catch(e){warning=e instanceof Error?e.message:'텔레그램 연결 확인에 실패했습니다.'}}
 else warning='Vercel에 텔레그램 봇 토큰이 아직 등록되지 않았습니다.';
 const code=req.nextUrl.searchParams.get('code');
 try{
  const chats=await sql`select chat_id,username,connected_at from admin_telegram_chats where active=true and bot_username=${BOT_USERNAME} order by connected_at desc limit 30`;
  const pairing=code&&/^[a-f0-9]{24}$/.test(code)
   ?await sql`select chat_id,expires_at from admin_telegram_pairings where code=${code} limit 1`:[];
  return response({configured:!!token,chats:chats.map(row=>({chat_id:String(row.chat_id),username:row.username,connected_at:row.connected_at})),paired:!!pairing.length&&!!pairing[0].chat_id,warning});
 }catch{return response({error:'등록된 관리자 확인 실패'},503)}
}
export async function POST(){
 if(!await isAdmin())return response({error:'관리자 권한이 필요합니다.'},403);
 const token=process.env.SUSHIJARO_TELEGRAM_BOT_TOKEN?.trim();
 if(!token)return response({error:'텔레그램 봇 토큰이 연결되지 않았습니다. Vercel 환경변수를 먼저 설정해 주세요.'},503);
 const sql=database();if(!sql)return response({error:'DB 연결 실패'},503);
 const code=randomBytes(12).toString('hex');
 try{
  await sql`insert into admin_telegram_pairings(code) values(${code})`;
  return response({code,url:'https://t.me/'+BOT_USERNAME+'?start='+code,expiresInMinutes:15});
 }catch{return response({error:'연결 링크 발급 실패'},503)}
}
export async function DELETE(req:NextRequest){
 if(!await isAdmin())return response({error:'관리자 권한이 필요합니다.'},403);
 let data:Record<string,unknown>;try{data=await req.json()}catch{return response({error:'형식 오류'},400)}
 const chatId=String(data.chat_id||'');
 if(!/^-?[0-9]{5,20}$/.test(chatId))return response({error:'대상 오류'},400);
 const sql=database();if(!sql)return response({error:'DB 연결 실패'},503);
 try{await sql`update admin_telegram_chats set active=false where chat_id=${chatId}::bigint`;return response({ok:true})}
 catch{return response({error:'연결 해제 실패'},503)}
}
