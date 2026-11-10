'use client';
import {useCallback,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowLeft,RefreshCcw,BarChart3} from 'lucide-react';
type Stat={total_views:number;total_visitors:number;today_views:number;today_visitors:number;week_views:number;week_visitors:number};
type Day={day:string;views:number;visitors:number};
type Recent={visitor:string;visited_at:string;path:string;device:string;referrer:string};
type Source={source:string;views:number};
type Result={summary:Stat;days:Day[];visitors:Recent[];referrers:Source[]};
const asNum=(n:number|undefined)=>Number(n||0).toLocaleString('ko-KR');
export function AdminAnalytics(){
 const router=useRouter(),[data,setData]=useState<Result|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{
  setLoading(true);setError('');
  try{const r=await fetch('/api/analytics',{credentials:'same-origin',cache:'no-store'});if(r.status===403){router.replace('/staff-login');return}const result=await r.json();if(!r.ok)throw Error(result.error||'통계 조회 실패');setData(result)}
  catch(e){setError(e instanceof Error?e.message:'조회 실패')}finally{setLoading(false)}
 },[router]);
 useEffect(()=>{void refresh()},[refresh]);
 const max=Math.max(1,...(data?.days||[]).map(x=>x.views));
 return <main className="admin"><div className="panel">
  <div className="admin-toolbar"><div><span className="section-kicker">SUSHIJARO ANALYTICS</span><h1>방문 통계</h1><p className="small">조회수(PV)와 방문 세션 수(UV)를 확인할 수 있습니다. IP 주소는 저장하지 않습니다.</p></div><div><a className="sz-analytics-back" href="/admin"><ArrowLeft size={15}/> 관리자 홈</a><button className="mutedBtn" onClick={()=>void refresh()} disabled={loading}><RefreshCcw size={15}/> 새로고침</button></div></div>
  {error&&<p className="alert" role="alert">{error}</p>}
  {loading&&!data&&<p>방문 현황을 불러오는 중...</p>}
  {data&&<><div className="sz-analytics-stats">{[
   ['오늘 조회수',data.summary.today_views],['오늘 방문자',data.summary.today_visitors],
   ['최근 7일 조회수',data.summary.week_views],['최근 7일 방문자',data.summary.week_visitors],
   ['누적 조회수',data.summary.total_views],['누적 방문자',data.summary.total_visitors]
  ].map(([title,n])=><div key={String(title)}><small>{title}</small><strong>{asNum(Number(n))}</strong></div>)}</div>
  <section className="sz-analytics-section"><h2><BarChart3 size={21}/> 최근 7일 방문 추이</h2><div className="sz-analytics-bars">{data.days.map(row=><div className="sz-analytics-day" key={row.day}><strong>{row.views}</strong><div className="sz-analytics-bar-track"><div style={{height:Math.max(row.views?4:0,Math.round(row.views/max*100))+'%'}}/></div><small>{row.day}</small><small>UV {row.visitors}</small></div>)}</div></section>
  <section className="sz-analytics-section"><h2>유입 경로 · 최근 30일</h2><div className="sz-analytics-referrers">{data.referrers.length?data.referrers.map(s=><div key={s.source}><span>{s.source}</span><strong>{asNum(s.views)} PV</strong></div>):<p>수집된 데이터가 없습니다.</p>}</div></section>
  <section className="sz-analytics-section"><h2>최근 방문 목록</h2><p className="small">익명 방문 세션 식별자와 방문 시각·기기·유입 경로를 표시합니다. 한 명이 여러 번 방문하면 각각 기록됩니다.</p>
  <div className="sz-analytics-table-scroll"><table className="sz-analytics-table"><thead><tr><th>방문 시각 (한국)</th><th>방문자</th><th>기기</th><th>페이지</th><th>유입 경로</th></tr></thead><tbody>{data.visitors.length?data.visitors.map((v,i)=><tr key={i}><td>{new Date(v.visited_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</td><td>{v.visitor}…</td><td>{v.device}</td><td>{v.path}</td><td>{v.referrer}</td></tr>):<tr><td colSpan={5}>아직 방문 기록이 없습니다.</td></tr>}</tbody></table></div></section>
  <p className="small">※ 통계는 기능 적용 이후부터 누적되며 과거 방문 수는 소급할 수 없습니다. UV는 브라우저 탭 세션 기준의 추정치입니다.</p></>}
 </div></main>
}
