import {NextResponse} from 'next/server';
import {database,isAdmin} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){
 if(!await isAdmin())return NextResponse.json({error:'관리자 권한 필요'},{status:403,headers:{'Cache-Control':'no-store'}});
 const sql=database();
 if(!sql)return NextResponse.json({error:'DB 연결 실패'},{status:503,headers:{'Cache-Control':'no-store'}});
 try{
  const rows=await sql`select id, created_at from consultations
   where request_type='order' and deleted_at is null
   order by created_at desc,id desc limit 30`;
  return NextResponse.json({orders:rows},{headers:{'Cache-Control':'no-store, max-age=0'}});
 }catch{return NextResponse.json({error:'주문 알림 조회 실패'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
