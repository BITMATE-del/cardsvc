/** Normalize a Telegram username or public t.me link; reject external hosts. */
export function normalizeTelegramLink(input:string):string|null{
 const raw=input.trim();
 if(!raw)return null;
 const user=raw.startsWith('@')?raw.slice(1):raw;
 if(/^[A-Za-z0-9_]{5,32}$/.test(user))return 'https://t.me/'+user;
 const candidate=/^(?:t\.me|telegram\.me)\//i.test(raw)?'https://'+raw:raw;
 try{
  const url=new URL(candidate);
  if(url.protocol!=='https:'||!['t.me','telegram.me','www.t.me','www.telegram.me'].includes(url.hostname.toLowerCase())||url.username||url.password||url.port||url.search||url.hash)return null;
  const name=url.pathname.replace(/^\//,'').replace(/\/$/,'');
  if(!/^[A-Za-z0-9_]{5,32}$/.test(name))return null;
  return 'https://t.me/'+name;
 }catch{return null}
}
