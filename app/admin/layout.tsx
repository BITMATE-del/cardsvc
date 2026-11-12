import {redirect} from 'next/navigation';
import {isPinAdmin} from '@/lib/admin-session';
import {AdminOrderAlerts} from '@/components/admin-order-alerts';
export const dynamic='force-dynamic';
export default async function AdminLayout({children}:{children:React.ReactNode}){
 if(!await isPinAdmin())redirect('/staff-login');
 return <><AdminOrderAlerts/>{children}</>;
}