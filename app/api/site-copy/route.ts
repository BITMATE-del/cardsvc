import {NextRequest,NextResponse} from 'next/server';
import {database,isAdmin} from '@/lib/db';import {LANDING_DEFAULTS} from '@/lib/landing-fields';
export const dynamic='force-dynamic';
const err=(error:string,status:number)=>NextResponse.json({error},{status});
export async function GET(){if(!await isAdmin())return err('접근 권한이 없습니다.',403);const sql=database();if(!sql)return err('Neon 연결이 필요합니다. DATABASE_URL을 설정해 주세요.',503);try{const rows=await sql`select key,value from site_copy order by key limit 1000`;return NextResponse.json(rows)}catch{return err('Neon 테이블을 확인해 주세요.',503)}}
export async function PUT(req:NextRequest){if(!await isAdmin())return err('접근 권한이 없습니다.',403);const sql=database();if(!sql)return err('Neon 연결이 필요합니다.',503);
let body:unknown;try{body=await req.json()}catch{return err('요청 형식 오류',400)}
if(!body||typeof body!=='object'||!('entries' in body)||!Array.isArray(body.entries))return err('형식 오류',400);
const rows=body.entries as Array<{key?:unknown,value?:unknown}>;if(rows.length<1||rows.length>250)return err('항목 수 오류',400);
for(const row of rows){if(!row||typeof row.key!=='string'||typeof row.value!=='string'||!Object.prototype.hasOwnProperty.call(LANDING_DEFAULTS,row.key)||row.value.length>3000)return err('수정 문구를 확인해 주세요.',400)}
try{for(const row of rows)await sql`insert into site_copy(key,value,updated_at) values(${row.key as string},${row.value as string},now()) on conflict (key) do update set value=excluded.value,updated_at=now()`;return NextResponse.json({ok:true,count:rows.length})}catch{return err('저장 실패: Neon 테이블 설정을 확인하세요.',503)}
}
