'use client';
import {useState,type FormEvent} from 'react';
import {ArrowUpRight,CheckCircle2} from 'lucide-react';
import {LANDING_DEFAULTS} from '@/lib/landing-fields';
const doses=[['2.5mg',95000],['5mg',130000],['7.5mg',190000],['10mg',250000],['12.5mg',300000],['15mg',360000]] as const;
export function ConsultationForm({values}:{values:Record<string,string>}){
 const t=(key:string)=>values[key]??LANDING_DEFAULTS[key]??'';
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[deliveryAddress,setDeliveryAddress]=useState(''),[dose,setDose]=useState(''),[agree,setAgree]=useState(false),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent){e.preventDefault();setError('');if(!agree){setError('개인정보 수집·이용 동의가 필요합니다.');return}setBusy(true);
  try{const r=await fetch('/api/consultations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,deliveryAddress,dose,agree,website:''})});const j=await r.json();if(!r.ok)throw Error(j.error||'접수에 실패했습니다.');setDone(true);setName('');setPhone('');setDeliveryAddress('');setDose('');setAgree(false)}
  catch(e){setError(e instanceof Error?e.message:'접수에 실패했습니다.')}finally{setBusy(false)}
 }
 return <div className="sz-consult-grid"><div className="sz-consult-aside"><span>ORDER REQUEST</span><h3>간편하게 작성하는<br/>주문 접수서</h3><p>원하시는 용량과 기본 정보를 남겨주세요. 담당자가 접수 내역을 확인합니다.</p><div className="sz-consult-aside-line"><b>01</b>주문 정보 작성</div><div className="sz-consult-aside-line"><b>02</b>접수 확인</div><div className="sz-consult-aside-line"><b>03</b>결제·진행 안내</div></div><div className="sz-consult-form-panel">{done?<div className="sz-success" role="status"><CheckCircle2 size={39}/><h3>주문서 접수가 완료되었습니다.</h3><p>담당자가 신청 내용을 확인한 후 안내합니다.</p><button type="button" onClick={()=>setDone(false)}>다른 주문서 작성하기</button></div>:<form onSubmit={submit}>
 <div className="sz-form-row"><label>이름 <span>*</span><input required autoComplete="name" maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder="수령인 성함"/></label><label>연락처 <span>*</span><input required type="tel" autoComplete="tel" maxLength={20} pattern="[0-9+() -]{8,20}" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="010-0000-0000"/></label></div>
 <label>배송지 주소 <span>*</span><textarea className="sz-order-address" required minLength={8} maxLength={240} value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} placeholder="도로명 주소와 상세주소를 입력해 주세요."/></label>
 <fieldset className="sz-dose-fieldset"><legend>희망 용량 단계 <span>*</span></legend><div className="sz-dose-options">{doses.map(([item,price],index)=><label key={item} className={dose===item?'sz-dose-option selected':'sz-dose-option'}><input type="radio" required name="dose" value={item} checked={dose===item} onChange={()=>setDose(item)}/><span><strong>{item}</strong>{index===0&&<small>시작 용량</small>}{index===5&&<small>최고 용량</small>}</span><b>{price.toLocaleString('ko-KR')}원</b></label>)}</div><p className="sz-dose-note">가격은 4주 기준이며 배송비 30,000원은 별도입니다.</p></fieldset>
 <p className="sz-order-notice">주문서 접수 후 결제 진행 방법과 링크는 별도로 안내됩니다.</p>
 <label className="sz-privacy"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/><span>주문서 확인 및 연락을 위한 개인정보(이름·연락처·배송지·선택 용량) 수집·이용에 동의합니다. 접수 정보는 90일간 보관합니다.</span></label>
 {error&&<p className="sz-form-error" role="alert">{error}</p>}<button type="submit" className="sz-submit" disabled={busy}>{busy?'접수 중...':'주문서 접수하기'} <ArrowUpRight size={18}/></button></form>}</div></div>
}