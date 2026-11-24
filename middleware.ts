import {NextRequest,NextResponse} from 'next/server';

// Temporary customer-facing maintenance mode. Remove this file to restore the site.
// Admin pages and their APIs remain available; public submissions are disabled.
export function middleware(request:NextRequest){
 const path=request.nextUrl.pathname;
 if(path.startsWith('/admin')||path.startsWith('/staff-login')||
    path.startsWith('/api/admin-')||path.startsWith('/api/admin/')||
    path==='/api/site-copy'||path==='/api/content'||path==='/api/analytics'){
  return NextResponse.next();
 }
 if(path.startsWith('/api/')){
  if((path==='/api/consultations'||path==='/api/reviews')&&request.method==='GET'){
    return NextResponse.next(); // Admin dashboard reads existing submissions.
  }
  if((path==='/api/consultations'||path==='/api/reviews')&&request.method==='PATCH'||
     (path==='/api/consultations'||path==='/api/reviews')&&request.method==='PUT'||
     (path==='/api/consultations'||path==='/api/reviews')&&request.method==='DELETE'){
    return NextResponse.next(); // Admin edits remain available and are auth protected.
  }
  return NextResponse.json({error:'현재 사이트 점검 중입니다. 잠시 후 다시 이용해 주세요.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
 const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex,nofollow"/><title>스시자로 | 서비스 점검 안내</title><style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;font-family:system-ui,-apple-system,'Noto Sans KR',sans-serif;background:#f3f7f7;color:#102b40;padding:24px}.notice{width:min(100%,520px);padding:52px 34px;background:white;border:1px solid #dce5e7;border-radius:12px;text-align:center;box-shadow:0 12px 40px rgba(16,43,64,.05)}.mark{margin:0 auto 24px;width:52px;height:4px;background:#177f82;border-radius:2px}h1{font-size:26px;margin:0 0 16px;letter-spacing:-.045em}p{font-size:15px;line-height:1.9;color:#637782;margin:0}.brand{font-size:12px;font-weight:800;letter-spacing:.12em;color:#177f82;margin-bottom:24px}</style></head><body><main class="notice"><div class="brand">SUSHIJARO</div><div class="mark"></div><h1>서비스 점검 중입니다</h1><p>현재 홈페이지 이용이 일시 중단되었습니다.<br>이용에 불편을 드려 죄송합니다.</p></main></body></html>`;
 return new NextResponse(html,{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, max-age=0','X-Robots-Tag':'noindex, nofollow'}});
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif|css|js|woff|woff2)$).*)']};
