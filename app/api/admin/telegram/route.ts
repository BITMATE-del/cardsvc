import {NextRequest,NextResponse} from 'next/server';
import {randomBytes} from 'node:crypto';
import {database,isAdmin} from '@/lib/db';
export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
const BOT_USERNAME='msgmsgazlk_bot';
type TelegramUpdate={message?:{text?:string;chat?:{id:number;type:string};from?:{username?:string}}};
async function collectPairings(token:string){
 const sql=database();if(!sql)return;
 const res=await fetch('https://api.telegram.org/bot'+token+'/getUpdates?limit=100&timeout=0&allowed_updates=%5B%22message%22%5D',{cache:'no-store',signal:AbortSignal.timeout(5500)});
 if(!res.ok)throw Error('텔레그램 봇 응답 오류');
 const payload:{ok:boolean;result?:TelegramUpdate[]}=await res.json();
 if(!payload.ok||!Array.isArray(payload.result))throw Error('봇 메시지를 확인할 수 없습니다.');
 for(const item of payload.result){
  const msg=item.message;
  if(msg?.chat?.type!=='private'||!Number.isSafeInteger(msg.chat.id))continue;
  const match=msg.text?.trim().match(/^\\/start(?:@msgmsgazlk_bot)?\\s+([a-f0-9]{24})$/i);
  if(!match)continue;
  const code=match[1].toLowerCase();
  const rows=await sql`update admin_telegram_pairings set chat_id=${msg.chat.id}
    where code=${code} and chat_id is null and expires_at>now() returning code`;
  if(rows.length){
   await sql`insert into admin_telegram_chats(chat_id,username,active)
    values(${msg.chat.id},${msg.from?.username||null},true)
    on conflict(chat_id) do update set username=excluded.username,active=true`;
  }
 }
}
export async function GET(req:NextRequest){
 if(!await isAdmin())return response({error:'관리자 권한이 필요합니다.'},403);
 const sql=database();if(!sql)return response({error:'DB 연결 실패'},503);
 const token=process.env.SUSHIJARO_TELEGRAM_BOT_TOKEN?.trim();
 let warning='';
 if(token){try{await collectPairings(token)}catch{warning='텔레그램 연결 상태를 확인할 수 없습니다.'}}
 else warning='Vercel에 텔레그램 봇 토큰이 아직 등록되지 않았습니다.';
 const code=req.nextUrl.searchParams.get('code');
 try{
  const chats=await sql`select chat_id,username,connected_at from admin_telegram_chats where active=true order by connected_at desc limit 30`;
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
