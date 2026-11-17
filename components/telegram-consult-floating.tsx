import {MessageCircle} from 'lucide-react';
export function TelegramConsultFloating({url,label}:{url:string;label:string}){
 let target='';
 try{
  const parsed=new URL(url);
  if(parsed.protocol==='https:'&&['t.me','telegram.me','www.t.me','www.telegram.me'].includes(parsed.hostname.toLowerCase())
   &&parsed.pathname.startsWith('/')&&parsed.pathname.length>1&&parsed.pathname.slice(1).split('/').every(part=>/^[A-Za-z0-9_+-]+$/.test(part))&&!parsed.search&&!parsed.hash)
    target=parsed.href;
 }catch{}
 if(!target)return null;
 const buttonLabel=label.trim().slice(0,25)||'텔레그램 상담';
 return <a className="sz-floating-telegram" href={target} target="_blank" rel="noopener noreferrer" aria-label={buttonLabel+' 바로 연결'}>
   <span className="sz-floating-telegram-circle" aria-hidden="true"><MessageCircle size={28} strokeWidth={2.4}/></span>
   <strong>{buttonLabel}</strong>
 </a>;
}
