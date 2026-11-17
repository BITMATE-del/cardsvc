import {normalizeTelegramLink} from '@/lib/telegram-link';
export function TelegramConsultFloating({url,label}:{url:string;label:string}){
 const target=normalizeTelegramLink(url);
 if(!target)return null;
 const buttonLabel=label.trim().slice(0,25)||'텔레그램 상담';
 return <a className="sz-floating-telegram" href={target} target="_blank" rel="noopener noreferrer" aria-label={buttonLabel+' 바로 연결'}>
   <span className="sz-floating-telegram-circle" aria-hidden="true"><svg className="sz-telegram-icon" viewBox="0 0 64 64" fill="none" focusable="false"><rect width="64" height="64" rx="15" fill="url(#sushijaroTelegramBlue)"/><circle cx="32" cy="32" r="25.8" fill="#FFFFFF"/><path d="M49.1 17.5 14.6 31c-1.8.7-1.8 1.6-.3 2.1l8.8 2.7 3.4 10.3c.4 1.1.7 1.5 1.3 1.5.5 0 .8-.2 1.5-.9l4.3-4.2 8.9 6.6c1.6.9 2.8.5 3.2-1.5l5.8-27.4c.5-2.2-.8-3.3-2.4-2.7ZM26.8 43.1l-2.3-7.8 22.1-13.9c.9-.5 1.6-.2 1 .4l-18 16.3-.8 5Z" fill="#2666EF"/><defs><linearGradient id="sushijaroTelegramBlue" x1="2" y1="60" x2="63" y2="3" gradientUnits="userSpaceOnUse"><stop stopColor="#2F93E7"/><stop offset="1" stopColor="#2555F3"/></linearGradient></defs></svg></span>
   <strong>{buttonLabel}</strong>
 </a>;
}
