import {NextRequest,NextResponse} from 'next/server';
import {database,isAdmin} from '@/lib/db';
export const dynamic='force-dynamic';
const bad=(message:string,status:number)=>NextResponse.json({error:message},{status});
const uuid=(id:unknown):id is string=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const validPlace=(value:unknown)=>value==='service'||value==='shipping';
export async function GET(){if(!await isAdmin())return bad('관리자 권한 필요',403);const sql=database();if(!sql)return bad('Neon 연결이 필요합니다.',503);try{return NextResponse.json(await sql`select id,eyebrow,title,body,icon,sort_order,is_published,placement from site_sections order by placement,sort_order,id`)}catch{return bad('카드 목록 조회 실패',503)}}
export async function POST(req:NextRequest){if(!await isAdmin())return bad('관리자 권한 필요',403);const sql=database();if(!sql)return bad('Neon 연결이 필요합니다.',503);
let data:Record<string,unknown>;try{data=await req.json()}catch{return bad('잘못된 요청',400)}
if(data.action==='delete'){if(!uuid(data.id))return bad('카드 ID 오류',400);try{await sql`delete from site_sections where id=${data.id}::uuid`;return NextResponse.json({ok:true})}catch{return bad('삭제 실패',503)}}
if(data.action!=='save'||!data.content||typeof data.content!=='object')return bad('잘못된 요청',400);
const c=data.content as Record<string,unknown>;
if(typeof c.title!=='string'||!c.title.trim()||c.title.length>140||typeof c.body!=='string'||!c.body.trim()||c.body.length>2500||typeof c.eyebrow!=='string'||c.eyebrow.length>100||!Number.isInteger(c.sort_order)||Number(c.sort_order)<0||Number(c.sort_order)>9999||typeof c.is_published!=='boolean'||!validPlace(c.placement))return bad('입력값 오류',400);
try{if(data.id){if(!uuid(data.id))return bad('카드 ID 오류',400);await sql`update site_sections set eyebrow=${c.eyebrow},title=${c.title},body=${c.body},sort_order=${c.sort_order as number},is_published=${c.is_published},placement=${c.placement} where id=${data.id}::uuid`}else await sql`insert into site_sections(eyebrow,title,body,icon,sort_order,is_published,placement) values(${c.eyebrow},${c.title},${c.body},'medical',${c.sort_order as number},${c.is_published},${c.placement})`;return NextResponse.json({ok:true})}catch{return bad('저장 실패',503)}
}