'use client';
import {useCallback,useEffect,useState} from 'react';
import {Bell,Link2,RefreshCw,Trash2} from 'lucide-react';
type Chat={chat_id:string;username:string|null;connected_at:string};
type Status={configured:boolean;chats:Chat[];paired:boolean;warning:string};
export function AdminTelegramSettings(){
 const [status,setStatus]=useState<Status|null>(null),[code,setCode]=useState(''),[link,setLink]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const refresh=useCallback(async()=>{
  try{
   const r=await fetch('/api/admin/telegram'+(code?'?code='+code:''),{cache:'no-store'});
   const result=await r.json();if(!r.ok)throw Error(result.error||'조회 실패');
   setStatus(result);
   if(code&&result.paired){setNotice('텔레그램 알림 연결이 완료되었습니다.');setCode('');setLink('')}
  }catch(e){setError(e instanceof Error?e.message:'조회 실패')}
 },[code]);
 useEffect(()=>{void refresh();const id=window.setInterval(()=>{void refresh()},5000);return()=>window.clearInterval(id)},[refresh]);
 async function connect(){
  setBusy(true);setError('');setNotice('');
  try{const r=await fetch('/api/admin/telegram',{method:'POST'});const j=await r.json();if(!r.ok)throw Error(j.error||'연결 실패');setCode(j.code);setLink(j.url)}
  catch(e){setError(e instanceof Error?e.message:'연결 실패')}finally{setBusy(false)}
 }
 async function remove(chatId:string){
  if(!window.confirm('이 관리자에게 주문 알림 전송을 중지할까요?'))return;
  setBusy(true);setError('');
  try{const r=await fetch('/api/admin/telegram',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId})});if(!r.ok)throw Error('연결 해제 실패');await refresh()}
  catch(e){setError(e instanceof Error?e.message:'연결 해제 실패')}finally{setBusy(false)}
 }
 return <main className="admin"><div className="panel">
  <div className="admin-toolbar"><div><span className="section-kicker">SUSHIJARO ADMIN</span><h1>텔레그램 주문 알림</h1><p className="small">승인된 관리자에게만 새 주문서 접수 알림을 발송합니다.</p></div><a href="/admin" className="mutedBtn">관리자 홈</a></div>
  {error&&<p className="alert" role="alert">{error}</p>}{notice&&<p className="admin-badge" role="status">{notice}</p>}
  {status?.warning&&<p className="alert" role="alert">{status.warning}</p>}
  <section className="sz-tg-settings"><div className="sz-tg-settings-head"><Bell size={20}/><h2>봇 알림 받을 관리자 등록</h2></div>
   <p>채팅 ID를 직접 입력할 필요 없이, 관리자 전용 연결 링크를 발급해 봇에서 시작하면 연결됩니다. 15분 뒤 링크는 만료됩니다.</p>
   <button type="button" disabled={busy||!status?.configured} onClick={()=>void connect()}><Link2 size={16}/> 관리자 봇 연결하기</button>
   {link&&<div className="sz-tg-connect"><a href={link} target="_blank" rel="noopener noreferrer">텔레그램 봇에서 연결 승인</a><p className="small">버튼을 누른 후 텔레그램에서 시작을 누르면 자동 등록됩니다.</p></div>}
  </section>
  <section className="sz-tg-settings"><div className="sz-tg-settings-head"><h2>알림 수신 관리자 ({status?.chats.length||0})</h2><button type="button" className="mutedBtn" onClick={()=>void refresh()}><RefreshCw size={15}/> 확인</button></div>
   {status?.chats.length?status.chats.map(x=><div className="sz-tg-chat" key={x.chat_id}><span>{x.username?'@'+x.username:'텔레그램 관리자'} <small>· {x.chat_id.slice(-4)}번</small></span><button className="mutedBtn" disabled={busy} onClick={()=>void remove(x.chat_id)}><Trash2 size={15}/> 해제</button></div>):<p className="small">아직 연결된 알림 수신 관리자가 없습니다.</p>}
  </section>
 </div></main>;
}
