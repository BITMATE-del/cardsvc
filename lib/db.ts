import {neon} from '@neondatabase/serverless';
import type {Section} from './data';
import {isPinAdmin} from './admin-session';
export const isAdmin=async (_token='')=>isPinAdmin();
export function database(){const url=process.env.DATABASE_URL;return url?neon(url):null}
export async function sections():Promise<Section[]>{const sql=database();if(!sql)return [];try{return await sql`select id,eyebrow,title,body,icon,sort_order,is_published from site_sections where is_published = true order by sort_order,id` as Section[]}catch{return []}}
