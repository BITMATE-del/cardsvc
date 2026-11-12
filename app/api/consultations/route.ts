import {NextRequest,NextResponse} from 'next/server';import {database,isAdmin} from '@/lib/db';
export const dynamic='force-dynamic';
const error=(message:string,status:number)=>NextResponse.json({error:message},{status});
const prices:Record<string,number>={'2.5mg':95000,'5mg':130000,'7.5mg':190000,'10mg':250000,'12.5mg':300000,'15mg':360000};
type OrderNotification={
 id:string;name:string;phone:string;items:{dose:string;quantity:number}[];totalAmount:number;
};
async function notifyNewOrder(order:OrderNotification):Promise<boolean>{
 const token=process.env.SUSHIJARO_TELEGRAM_BOT_TOKEN?.trim();
 if(!token)return false;
 const sql=database();if(!sql)return false;
 try{
  const chats=await sql`select chat_id from admin_telegram_chats where active=true limit 30`;
  if(!chats.length)return false;
  const lines=[
   '🔔 새 주문서가 도착했습니다!',
   '',
   '🧾 주문번호: '+order.id.slice(0,8).toUpperCase(),
   '👤 주문자: '+order.name,
   '📞 연락처: '+order.phone,
   '📦 주문상품:',
   ...order.items.map(x=>'  · '+x.dose+' × '+x.quantity+'개'),
   '💳 결제 예정금액: '+order.totalAmount.toLocaleString('ko-KR')+'원 (배송비 30,000원 포함)',
   '',
   '🔎 관리자 주문 확인',
   'https://cardsvc.vercel.app/admin/consultations',
   '',
   '💳 결제링크',
   'https://www.dahaepay.com/seller/create'
  ];
  const results=await Promise.allSettled(chats.map(async chat=>{
   const response=await fetch('https://api.telegram.org/bot'+token+'/sendMessage',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:String(chat.chat_id),text:lines.join(String.fromCharCode(10)),disable_notification:false,protect_content:true}),
    cache:'no-store',signal:AbortSignal.timeout(7000)
   });
   return response.ok;
  }));
  return results.some(x=>x.status==='fulfilled'&&x.value===true);
 }catch(e){console.error('SUSHIJARO_TELEGRAM_SEND_ERROR',e instanceof Error?e.name:'unknown');return false;}
}

export async function POST(req:NextRequest){
 let data:Record<string,unknown>;try{data=await req.json()}catch{return error('입력 내용을 확인해 주세요.',400)}
 if(data.website)return NextResponse.json({ok:true});
 if(data.agree!==true)return error('개인정보 수집·이용 동의가 필요합니다.',400);
 const name=typeof data.name==='string'?data.name.trim():'',phone=typeof data.phone==='string'?data.phone.trim():'',address=typeof data.deliveryAddress==='string'?data.deliveryAddress.trim():'';
 if(name.length<2||name.length>40||!/^[-+() 0-9]{8,20}$/.test(phone)||address.length<8||address.length>240)return error('신청 정보를 확인해 주세요.',400);
 if(!Array.isArray(data.items)||data.items.length<1||data.items.length>6)return error('최소 한 가지 용량을 선택해 주세요.',400);
 const seen=new Set<string>();
 const items:{dose:string;quantity:number;unitPrice:number;amount:number}[]=[];
 for(const input of data.items){
  if(!input||typeof input!=='object'||Array.isArray(input))return error('주문 품목 형식을 확인해 주세요.',400);
  const item=input as Record<string,unknown>;
  const dose=item.dose,quantity=item.quantity;
  if(typeof dose!=='string'||!Object.prototype.hasOwnProperty.call(prices,dose)||seen.has(dose)||typeof quantity!=='number'||!Number.isInteger(quantity)||quantity<1||quantity>10)return error('용량 또는 수량을 확인해 주세요.',400);
  seen.add(dose);items.push({dose,quantity:quantity as number,unitPrice:prices[dose],amount:prices[dose]*(quantity as number)});
 }
 const subtotal=items.reduce((sum,item)=>sum+item.amount,0);
 const shippingFee=30000;
 const totalAmount=subtotal+shippingFee;
 const summary=items.map(i=>i.dose+' × '+i.quantity+'개').join(', ');
 const sql=database();if(!sql)return error('주문서 접수 서비스가 준비되지 않았습니다.',503);
 try{
  const inserted=await sql`insert into consultations(name,phone,message,delivery_address,selected_dose,reference_price,request_type,status,order_items,shipping_fee,total_amount)
   values(${name},${phone},${'주문 접수'},${address},${summary},${subtotal},'order','new',${JSON.stringify(items)}::jsonb,${shippingFee},${totalAmount})
   returning id`;
  // Notify only after a successfully saved order; Telegram failure must not cancel the order.
  const notified=await notifyNewOrder({id:String(inserted[0].id),name,phone,items,totalAmount});
  if(!notified)console.warn('SUSHIJARO_ORDER_SAVED_WITHOUT_TELEGRAM_DELIVERY');
  return NextResponse.json({ok:true,totalAmount,shippingFee},{status:201});
 }catch{return error('접수에 실패했습니다.',503)}
}
export async function GET(){if(!await isAdmin())return error('접근 권한이 없습니다.',403);const sql=database();if(!sql)return error('Neon 연결이 필요합니다.',503);try{return NextResponse.json(await sql`select id,name,phone,message,delivery_address,selected_dose,reference_price,request_type,status,created_at,order_items,shipping_fee,total_amount from consultations where deleted_at is null order by created_at desc limit 150`)}catch{return error('접수 내역 조회 실패',503)}}
export async function PATCH(req:NextRequest){if(!await isAdmin())return error('접근 권한이 없습니다.',403);let input:Record<string,unknown>;try{input=await req.json()}catch{return error('잘못된 요청',400)}if(typeof input.id!=='string'||!['new','contacted','closed'].includes(String(input.status))||!/^[0-9a-f-]{36}$/i.test(input.id))return error('입력 오류',400);
const sql=database();if(!sql)return error('Neon 연결이 필요합니다.',503);try{const rows=await sql`update consultations set status=${input.status as string} where id=${input.id as string}::uuid returning id`;return rows.length?NextResponse.json({ok:true}):error('접수 내역을 찾지 못했습니다.',404)}catch{return error('상태 저장 실패',503)}
}

export async function DELETE(req:NextRequest){
 if(!await isAdmin())return error('접근 권한이 없습니다.',403);
 const id=req.nextUrl.searchParams.get('id');
 if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return error('주문 번호가 올바르지 않습니다.',400);
 const sql=database();if(!sql)return error('Neon 연결이 필요합니다.',503);
 try{
  const found=await sql`select id,status,request_type from consultations where id=${id}::uuid and deleted_at is null`;
  if(!found.length)return error('주문을 찾을 수 없습니다.',404);
  if(found[0].request_type!=='order'||found[0].status!=='closed')return error('완료 처리된 주문서만 삭제할 수 있습니다.',409);
  const updated=await sql`update consultations set deleted_at=now() where id=${id}::uuid and request_type='order' and status='closed' and deleted_at is null returning id`;
  return updated.length?NextResponse.json({ok:true}):error('삭제 조건을 확인해 주세요.',409);
 }catch{return error('주문서 삭제 처리에 실패했습니다.',503)}
}
