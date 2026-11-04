import {createHmac,timingSafeEqual} from 'node:crypto';import {cookies} from 'next/headers';
export const ADMIN_COOKIE='sushijaro_admin';
const TTL=60*60*24;
const digest=(payload:string)=>{const secret=process.env.ADMIN_SESSION_SECRET;return secret&&secret.length>=32?createHmac('sha256',secret).update(payload).digest('hex'):''};
export const makeAdminSession=()=>{const payload='admin.'+(Math.floor(Date.now()/1000)+TTL);return payload+'.'+digest(payload)};
export async function isPinAdmin(){const token=(await cookies()).get(ADMIN_COOKIE)?.value;if(!token)return false;const parts=token.split('.');if(parts.length!==3||parts[0]!=='admin')return false;const expiry=Number(parts[1]);if(!Number.isSafeInteger(expiry)||expiry<Math.floor(Date.now()/1000)||expiry>Math.floor(Date.now()/1000)+TTL+30)return false;const d=digest(parts[0]+'.'+parts[1]);if(!d||d.length!==parts[2].length)return false;return timingSafeEqual(Buffer.from(d),Buffer.from(parts[2]))}
