import {NextRequest,NextResponse} from 'next/server';
import {database,isAdmin} from '@/lib/db';
export const dynamic='force-dynamic';
const error=(message:string,status:number)=>NextResponse.json({error:message},{status});
export async function GET(req:NextRequest){const sql=database();if(!sql)return error('후기 게시판을 사용할 수 없습니다.',503);const admin=req.nextUrl.searchParams.get('scope')==='admin';if(admin&&!await isAdmin())return error('관리자 권한 필요',403);try{if(admin){const rows=await sql`select id,nickname,rating,title,body,status,created_at,display_date,coalesce(display_date,(created_at at time zone 'Asia/Seoul')::date)::text as shown_date from customer_reviews order by created_at desc limit 200`;return NextResponse.json(rows)}const rows=await sql`select id,nickname,rating,title,body,created_at,coalesce(display_date,(created_at at time zone 'Asia/Seoul')::date)::text as shown_date from customer_reviews where status='approved' order by created_at desc limit 30`;return NextResponse.json(rows)}catch{return error('후기 조회 실패',503)}}
export async function POST(req:NextRequest){const sql=database();if(!sql)return error('접수 준비 중입니다.',503);let input:Record<string,unknown>;try{input=await req.json()}catch{return error('입력값을 확인해 주세요.',400)}
if(input.website)return NextResponse.json({ok:true});const nickname=typeof input.nickname==='string'?input.nickname.trim():'',title=typeof input.title==='string'?input.title.trim():'',body=typeof input.body==='string'?input.body.trim():'',rating=input.rating;
if(nickname.length<2||nickname.length>30||title.length<3||title.length>80||body.length<15||body.length>1200||!Number.isInteger(rating)||Number(rating)<1||Number(rating)>5)return error('후기 내용을 확인해 주세요.',400);
try{await sql`insert into customer_reviews(nickname,title,body,rating,status) values(${nickname},${title},${body},${rating as number},'pending')`;return NextResponse.json({ok:true},{status:201})}catch{return error('후기 접수 실패',503)}}
export async function PATCH(req:NextRequest){if(!await isAdmin())return error('관리자 권한 필요',403);let input:Record<string,unknown>;try{input=await req.json()}catch{return error('형식 오류',400)}
if(typeof input.id!=='string'||!/^[0-9a-f-]{36}$/i.test(input.id)||!['approved','rejected','pending'].includes(String(input.status)))return error('입력값 오류',400);
const sql=database();if(!sql)return error('DB 연결 실패',503);try{const rows=await sql`update customer_reviews set status=${input.status as string},reviewed_at=now() where id=${input.id as string}::uuid returning id`;return rows.length?NextResponse.json({ok:true}):error('후기를 찾지 못했습니다.',404)}catch{return error('처리 실패',503)}}
export async function PUT(req:NextRequest){
 if(!await isAdmin())return error('관리자 권한 필요',403);
 let input:Record<string,unknown>;try{input=await req.json()}catch{return error('요청 형식 오류',400)}
 const id=input.id, date=input.display_date;
 if(typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id))return error('후기 ID 오류',400);
 if(date!==null&&(typeof date!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))return error('작성일자를 확인해 주세요.',400);
 const sql=database();if(!sql)return error('DB 연결 실패',503);
 try{const rows=await sql`update customer_reviews set display_date=${date as string|null}::date where id=${id}::uuid returning id`;return rows.length?NextResponse.json({ok:true}):error('후기를 찾지 못했습니다.',404)}catch{return error('작성일자 저장 실패',503)}
}
export async function DELETE(req:NextRequest){if(!await isAdmin())return error('관리자 권한 필요',403);const id=req.nextUrl.searchParams.get('id');if(!id||!/^[0-9a-f-]{36}$/i.test(id))return error('ID 오류',400);const sql=database();if(!sql)return error('DB 연결 실패',503);try{await sql`delete from customer_reviews where id=${id}::uuid`;return NextResponse.json({ok:true})}catch{return error('삭제 실패',503)}}
