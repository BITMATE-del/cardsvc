'use client';
import {useEffect,useRef,useState} from 'react';
import {Bell,BellOff,X} from 'lucide-react';
type OrderSignal={id:string;created_at:string};
const SOUND_KEY='sz-order-buzzer-enabled-v1';
const SEEN_KEY='sz-order-buzzer-last-seen-v1';
const CLAIM_KEY='sz-order-buzzer-last-alert-v1';
function playBuzzer(ctx:AudioContext){
 if(ctx.state==='suspended')void ctx.resume();
 const now=ctx.currentTime;
 for(const [i,frequency] of [740,590,740].entries()){
  const start=now+.02+i*.21;
  const oscillator=ctx.createOscillator(),gain=ctx.createGain();
  oscillator.type='square';oscillator.frequency.setValueAtTime(frequency,start);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.095,start+.018);
  gain.gain.setValueAtTime(.095,start+.12);gain.gain.exponentialRampToValueAtTime(.0001,start+.18);
  oscillator.connect(gain);gain.connect(ctx.destination);
  oscillator.start(start);oscillator.stop(start+.185);
 }
}
export function AdminOrderAlerts(){
 const [enabled,setEnabled]=useState(false),[ready,setReady]=useState(false),[newOrders,setNewOrders]=useState(0),[notice,setNotice]=useState('');
 const audio=useRef<AudioContext|null>(null);
 const seen=useRef<string|null>(null);
 const inFlight=useRef(false);
 const first=useRef(true);
 const enabledRef=useRef(false);
 const readyRef=useRef(false);
 useEffect(()=>{
  const configured=localStorage.getItem(SOUND_KEY)==='on';
  const last=localStorage.getItem(SEEN_KEY);
  seen.current=last;
  setEnabled(configured);enabledRef.current=configured;
  const poll=async()=>{
   if(inFlight.current)return;
   inFlight.current=true;
   try{
    const r=await fetch('/api/admin/order-alerts',{cache:'no-store',credentials:'same-origin'});
    if(!r.ok)return;
    const data:{orders:OrderSignal[]}=await r.json();
    const orders=data.orders||[];
    if(first.current){
     first.current=false;
     if(!seen.current && orders.length){seen.current=orders[0].created_at;localStorage.setItem(SEEN_KEY,seen.current)}
     else if(!seen.current){seen.current=new Date().toISOString();localStorage.setItem(SEEN_KEY,seen.current)}
     // On initial load, avoid a noisy backlog; still show any orders since last visit.
    }
    const latest=orders[0]?.created_at;
    if(!latest||!seen.current)return;
    const count=orders.filter(x=>x.created_at>seen.current!).length;
    if(count<=0)return;
    setNewOrders(count);setNotice(count===1?'새 주문서가 접수되었습니다.':`새 주문서 ${count}건이 접수되었습니다.`);
    seen.current=latest;localStorage.setItem(SEEN_KEY,latest);
    // Share last alerted order across multiple admin tabs to avoid repeated buzzer sounds.
    if(enabledRef.current&&readyRef.current&&localStorage.getItem(CLAIM_KEY)!==latest){
     localStorage.setItem(CLAIM_KEY,latest);
     if(audio.current){try{playBuzzer(audio.current)}catch{}}
    }
   }catch{}finally{inFlight.current=false}
  };
  void poll();
  const interval=window.setInterval(()=>{void poll()},8000);
  const onVisible=()=>{if(document.visibilityState==='visible')void poll()};
  document.addEventListener('visibilitychange',onVisible);
  return()=>{window.clearInterval(interval);document.removeEventListener('visibilitychange',onVisible);void audio.current?.close();audio.current=null};
 },[]);
 async function toggle(){
  const next=!(enabled&&ready);
  setEnabled(next);enabledRef.current=next;
  localStorage.setItem(SOUND_KEY,next?'on':'off');
  if(next){
   try{
    if(!audio.current)audio.current=new AudioContext();
    await audio.current.resume();
    playBuzzer(audio.current);
    setReady(true);readyRef.current=true;setNotice('부저음 알림이 켜졌습니다. 새 주문이 접수되면 소리가 납니다.');
   }catch{setReady(false);readyRef.current=false;setNotice('브라우저 소리 재생이 차단되었습니다. 다시 눌러 활성화해 주세요.')}
  }else{setReady(false);readyRef.current=false;setNotice('부저음 알림을 껐습니다.');}
 }
 return <div className="sz-order-alert-widget" aria-live="polite">
  <button className="sz-order-alert-toggle" type="button" onClick={()=>void toggle()} title="주문 접수 부저음 켜기·끄기">
   {enabled?<Bell size={17}/>:<BellOff size={17}/>}
   <span>{enabled?(ready?'주문 알림 켜짐':'소리 활성화'):'주문 알림 꺼짐'}</span>
  </button>
  {newOrders>0&&<a className="sz-order-alert-new" href="/admin/consultations" onClick={()=>setNewOrders(0)}>새 주문 {newOrders}건 확인</a>}
  {notice&&<div className="sz-order-alert-toast" role="status"><span>{notice}</span><button type="button" onClick={()=>setNotice('')} aria-label="알림 닫기"><X size={15}/></button></div>}
 </div>;
}
