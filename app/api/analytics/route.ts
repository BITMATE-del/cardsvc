import {NextRequest,NextResponse} from 'next/server';
import {database,isAdmin} from '@/lib/db';
export const dynamic='force-dynamic';
const respond=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store, max-age=0'}});
const validUUID=(x:unknown):x is string=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
export async function POST(req:NextRequest){
 let data:Record<string,unknown>;
 try{data=await req.json()}catch{return respond({error:'잘못된 요청'},400)}
 const id=data.visitorId,path=data.path,referrer=data.referrer,device=data.device;
 if(!validUUID(id)||typeof path!=='string'||path.length>120||!/^\/[a-zA-Z0-9\-/_]*$/.test(path)||typeof referrer!=='string'||referrer.length>100||typeof device!=='string'||!['PC','모바일'].includes(device))return respond({error:'잘못된 방문 정보'},400);
 if(path.startsWith('/admin')||path.startsWith('/staff-login')||path.startsWith('/api'))return respond({ok:true});
 const sql=database();if(!sql)return respond({error:'DB 연결 오류'},503);
 try{
  // Suppress repeated events from one visitor on one page within 10 seconds.
  const repeated=await sql`select 1 from site_pageviews where visitor_id=${id}::uuid and path=${path} and visited_at>now()-interval '10 seconds' limit 1`;
  if(!repeated.length)await sql`insert into site_pageviews(visitor_id,path,referrer,device) values(${id}::uuid,${path},${referrer||null},${device})`;
  return respond({ok:true});
 }catch{return respond({error:'기록 저장 실패'},503)}
}
export async function GET(){
 if(!await isAdmin())return respond({error:'접근 권한이 없습니다.'},403);
 const sql=database();if(!sql)return respond({error:'Neon 연결이 필요합니다.'},503);
 try{
  const [summary,days,visitors,referrers]=await Promise.all([
   sql`select count(*)::int as total_views,count(distinct visitor_id)::int as total_visitors,
    count(*) filter(where (visited_at at time zone 'Asia/Seoul')::date=(now() at time zone 'Asia/Seoul')::date)::int as today_views,
    count(distinct visitor_id) filter(where (visited_at at time zone 'Asia/Seoul')::date=(now() at time zone 'Asia/Seoul')::date)::int as today_visitors,
    count(*) filter(where visited_at>=now()-interval '7 days')::int as week_views,
    count(distinct visitor_id) filter(where visited_at>=now()-interval '7 days')::int as week_visitors
    from site_pageviews`,
   sql`with d as(select generate_series((now() at time zone 'Asia/Seoul')::date-6,(now() at time zone 'Asia/Seoul')::date,interval '1 day')::date as day)
    select to_char(d.day,'MM-DD') as day,count(p.id)::int as views,count(distinct p.visitor_id)::int as visitors
    from d left join site_pageviews p on (p.visited_at at time zone 'Asia/Seoul')::date=d.day group by d.day order by d.day`,
   sql`select left(visitor_id::text,8) as visitor,visited_at,path,device,coalesce(referrer,'직접 방문') as referrer
    from site_pageviews order by visited_at desc limit 100`,
   sql`select coalesce(nullif(referrer,''),'직접 방문') as source,count(*)::int as views
    from site_pageviews where visited_at>=now()-interval '30 days' group by 1 order by views desc limit 8`
  ]);
  return respond({summary:summary[0],days,visitors,referrers});
 }catch{return respond({error:'방문 통계 조회 실패'},503)}
}
