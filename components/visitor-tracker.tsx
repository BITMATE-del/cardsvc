'use client';
import {useEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';
const KEY='sushijaro_session_visitor';
export function VisitorTracker(){
 const pathname=usePathname();
 const sentPath=useRef<string|null>(null);
 useEffect(()=>{
  const path=pathname||'/';
  if(path.startsWith('/admin')||path.startsWith('/staff-login')||path.startsWith('/api')||sentPath.current===path)return;
  if(navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
  sentPath.current=path;
  try{
   let visitorId=sessionStorage.getItem(KEY);
   if(!visitorId){visitorId=crypto.randomUUID();sessionStorage.setItem(KEY,visitorId)}
   const device=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)?'모바일':'PC';
   let referrer='';
   if(document.referrer){const u=new URL(document.referrer);if(u.origin!==location.origin)referrer=u.hostname.slice(0,100)}
   void fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId,path,referrer,device}),keepalive:true,cache:'no-store'}).catch(()=>{});
  }catch{}
 },[pathname]);
 return null;
}
