import {NextRequest,NextResponse} from 'next/server';import {database,isAdmin} from '@/lib/db';
export const dynamic='force-dynamic';const error=(message:string,status:number)=>NextResponse.json({error:message},{status});
export async function POST(req:NextRequest){let data:Record<string,unknown>;try{data=await req.json()}catch{return error('입력 내용을 확인해 주세요.',400)}
if(data.website)return NextResponse.json({ok:true});if(data.agree!==true)return error('개인정보 수집 동의가 필요합니다.',400);
const name=typeof data.name==='string'?data.name.trim():'',phone=typeof data.phone==='string'?data.phone.trim():'',message=typeof data.message==='string'?data.message.trim():'';
if(name.length<2||name.length>40||!/^[-+() 0-9]{8,20}$/.test(phone)||message.length<5||message.length>1000)return error('입력 항목을 확인해 주세요.',400);
const sql=database();if(!sql)return error('상담 접수 서비스가 준비되지 않았습니다.',503);
try{await sql`insert into consultations(name,phone,message,status) values(${name},${phone},${message},'new')`;return NextResponse.json({ok:true},{status:201})}catch{return error('접수에 실패했습니다.',503)}
}
export async function GET(){if(!await isAdmin())return error('접근 권한이 없습니다.',403);const sql=database();if(!sql)return error('Neon 연결이 필요합니다.',503);try{return NextResponse.json(await sql`select id,name,phone,message,status,created_at from consultations order by created_at desc limit 150`)}catch{return error('상담 내역 조회 실패',503)}}
export async function PATCH(req:NextRequest){if(!await isAdmin())return error('접근 권한이 없습니다.',403);let input:Record<string,unknown>;try{input=await req.json()}catch{return error('잘못된 요청',400)}if(typeof input.id!=='string'||!['new','contacted','closed'].includes(String(input.status))||!/^[0-9a-f-]{36}$/i.test(input.id))return error('입력 오류',400);
const sql=database();if(!sql)return error('Neon 연결이 필요합니다.',503);try{const rows=await sql`update consultations set status=${input.status as string} where id=${input.id as string}::uuid returning id`;return rows.length?NextResponse.json({ok:true}):error('접수 내역을 찾지 못했습니다.',404)}catch{return error('상태 저장 실패',503)}
}
