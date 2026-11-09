'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowUpRight,CheckCircle2,MapPin,Search,X} from 'lucide-react';

type AddressResult={zonecode:string;roadAddress:string;address:string};
declare global {
 interface Window {kakao?:{Postcode:new(options:{oncomplete:(data:AddressResult)=>void;theme?:{searchBgColor:string;queryTextColor:string}})=>{embed:(element:HTMLElement)=>void}}}
}
const postcodeSrc='https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
let postcodeLoading:Promise<void>|null=null;
function ensurePostcode():Promise<void>{
 if(window.kakao?.Postcode)return Promise.resolve();
 if(!postcodeLoading)postcodeLoading=new Promise<void>((resolve,reject)=>{
   const script=document.createElement('script');script.src=postcodeSrc;script.async=true;
   script.onload=()=>window.kakao?.Postcode?resolve():reject(new Error('주소 검색을 불러올 수 없습니다.'));
   script.onerror=()=>{script.remove();reject(new Error('주소 검색 서비스 연결에 실패했습니다.'));};
   document.head.appendChild(script);
 }).catch(e=>{postcodeLoading=null;throw e});
 return postcodeLoading;
}
const doses=[['2.5mg',95000],['5mg',130000],['7.5mg',190000],['10mg',250000],['12.5mg',300000],['15mg',360000]] as const;
const DELIVERY_FEE=30000;
export function ConsultationForm({values}:{values:Record<string,string>}){
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[zip,setZip]=useState(''),[road,setRoad]=useState(''),[detail,setDetail]=useState(''),[dose,setDose]=useState(''),[agree,setAgree]=useState(false),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState(''),[addressOpen,setAddressOpen]=useState(false),[addressError,setAddressError]=useState('');
 const addressHost=useRef<HTMLDivElement>(null),detailInput=useRef<HTMLInputElement>(null);
 const selected=doses.find(([item])=>item===dose);
 useEffect(()=>{
   if(!addressOpen)return;
   let canceled=false;
   ensurePostcode().then(()=>{
     if(canceled||!addressHost.current||!window.kakao?.Postcode)return;
     addressHost.current.replaceChildren();
     new window.kakao.Postcode({
       oncomplete:data=>{
         setZip(data.zonecode);setRoad(data.roadAddress||data.address);setDetail('');
         setAddressOpen(false);setAddressError('');
         window.setTimeout(()=>detailInput.current?.focus(),0);
       },
       theme:{searchBgColor:'#102B40',queryTextColor:'#FFFFFF'}
     }).embed(addressHost.current);
   }).catch(e=>{if(!canceled)setAddressError(e instanceof Error?e.message:'주소 검색 서비스 오류');});
   return()=>{canceled=true};
 },[addressOpen]);
 useEffect(()=>{
   if(!addressOpen)return;
   const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setAddressOpen(false)};
   window.addEventListener('keydown',onKey);
   return()=>window.removeEventListener('keydown',onKey);
 },[addressOpen]);
 async function submit(e:FormEvent){
   e.preventDefault();setError('');
   if(!zip||!road||!detail.trim()){setError('주소 검색 후 상세주소까지 입력해 주세요.');return}
   if(!dose){setError('희망 용량을 선택해 주세요.');return}
   if(!agree){setError('개인정보 수집·이용 동의가 필요합니다.');return}
   setBusy(true);
   try{
     const deliveryAddress='('+zip+') '+road+' '+detail.trim();
     const res=await fetch('/api/consultations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,phone,deliveryAddress,dose,agree,website:''})});
     const j=await res.json();
     if(!res.ok)throw new Error(j.error||'접수에 실패했습니다.');
     setDone(true);setName('');setPhone('');setZip('');setRoad('');setDetail('');setDose('');setAgree(false);
   }catch(e){setError(e instanceof Error?e.message:'접수에 실패했습니다.')}finally{setBusy(false)}
 }
 return <>
  <div className="sz-consult-grid">
   <div className="sz-consult-aside">
    <span>ORDER REQUEST</span>
    <h3>간편하게 작성하는<br/>주문 접수서</h3>
    <p>희망 용량과 배송 정보를 입력해 주세요. 담당자가 접수 내용을 확인합니다.</p>
    <div className="sz-consult-aside-line"><b>01</b>주문 정보 작성</div>
    <div className="sz-consult-aside-line"><b>02</b>접수 확인</div>
    <div className="sz-consult-aside-line"><b>03</b>결제·진행 안내</div>
   </div>
   <div className="sz-consult-form-panel">
    {done?<div className="sz-success" role="status"><CheckCircle2 size={39}/><h3>주문서 접수가 완료되었습니다.</h3><p>담당자가 신청 내용을 확인한 후 안내합니다.</p><button type="button" onClick={()=>setDone(false)}>다른 주문서 작성하기</button></div>:
    <form onSubmit={submit}>
     <div className="sz-form-row">
      <label>이름 <span>*</span><input required autoComplete="name" maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder="수령인 성함"/></label>
      <label>연락처 <span>*</span><input required type="tel" autoComplete="tel" maxLength={20} pattern="[0-9+() -]{8,20}" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="010-0000-0000"/></label>
     </div>
     <div className="sz-order-address-group">
      <label>배송지 주소 <span>*</span></label>
      <div className="sz-address-search-row">
       <input aria-label="우편번호" readOnly value={zip} placeholder="우편번호"/>
       <button type="button" className="sz-postcode-btn" onClick={()=>{setAddressError('');setAddressOpen(true)}}><Search size={16}/> 주소 검색</button>
      </div>
      <input aria-label="도로명주소" readOnly required value={road} placeholder="주소 검색 버튼으로 도로명주소를 선택하세요." onClick={()=>setAddressOpen(true)}/>
      <input ref={detailInput} aria-label="상세주소" required maxLength={100} autoComplete="address-line2" value={detail} onChange={e=>setDetail(e.target.value)} placeholder="상세주소 (동·호수, 건물명 등)"/>
     </div>
     <label className="sz-dose-select-label" htmlFor="sz-dose-select">희망 용량 단계 <span>*</span>
      <select required id="sz-dose-select" value={dose} onChange={e=>setDose(e.target.value)}>
       <option value="" disabled>용량을 선택해 주세요.</option>
       {doses.map(([item,price],i)=><option key={item} value={item}>{item}{i===0?' (시작 용량)':i===5?' (최고 용량)':''} — {price.toLocaleString('ko-KR')}원</option>)}
      </select>
     </label>
     {selected&&<div className="sz-selected-price" aria-live="polite">
      <span>선택한 용량 <strong>{selected[0]}</strong></span>
      <span>4주 기준 <strong>{selected[1].toLocaleString('ko-KR')}원</strong></span>
      <span>별도 배송비 <strong>{DELIVERY_FEE.toLocaleString('ko-KR')}원</strong></span>
     </div>}
     <p className="sz-dose-note">표시 금액은 4주 기준이며, 배송비 30,000원은 별도입니다.</p>
     <p className="sz-order-notice">주문서 접수 후 결제 진행 방법과 링크는 별도로 안내됩니다.</p>
     <label className="sz-privacy"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/><span>주문서 확인 및 연락을 위한 개인정보(이름·연락처·배송지·선택 용량) 수집·이용에 동의합니다. 접수 정보는 90일간 보관합니다.</span></label>
     <p className="sz-pg-notice" role="note">PG 카드결제 링크는 결제사 자동발송 연동 완료 후 주문서 접수와 동시에 발송됩니다.</p>
     {error&&<p className="sz-form-error" role="alert">{error}</p>}
     <button type="submit" className="sz-submit" disabled={busy}>{busy?'접수 중...':'주문서 접수하기'} <ArrowUpRight size={18}/></button>
    </form>}
   </div>
  </div>
  {addressOpen&&<div className="sz-address-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setAddressOpen(false)}}>
   <div className="sz-address-modal" role="dialog" aria-modal="true" aria-label="도로명주소 검색">
    <header><div><MapPin size={19}/><strong>도로명주소 검색</strong></div><button type="button" aria-label="닫기" onClick={()=>setAddressOpen(false)}><X size={21}/></button></header>
    {addressError?<p className="sz-form-error">{addressError} 주소 검색을 다시 시도해 주세요.</p>:null}
    <div ref={addressHost} className="sz-postcode-embed"/>
   </div>
  </div>}
 </>;
}
