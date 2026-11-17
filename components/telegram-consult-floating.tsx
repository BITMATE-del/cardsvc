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
   <span className="sz-floating-telegram-circle" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M21.5 3.6 2.9 10.8c-1.2.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.7c.2.6.1.8.8.8.5 0 .7-.2 1-.5l2.4-2.4 5 3.7c.9.5 1.6.3 1.8-.8l3.2-15.1c.3-1.3-.5-1.9-1.5-1.4ZM8.2 13.4l11.4-7.2c.5-.3 1-.1.6.3L10.8 15l-.4 3.6-2.2-5.2Z"/></svg></span>
   <strong>{buttonLabel}</strong>
 </a>;
}
