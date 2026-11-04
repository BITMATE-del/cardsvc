# 스시자로 | SUSHIJARO

고급형 반응형 의료정보 랜딩과 관리자 콘텐츠 관리용 Next.js 프로젝트입니다.

## 화면
- `/` 고객용 안내 랜딩
- `/admin` 관리자 로그인 및 안내 카드 등록·수정·삭제·노출 설정

## 실행
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase 준비
1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행합니다.
3. Authentication > Users에서 관리자를 이메일/비밀번호로 생성합니다.
4. 해당 사용자 UUID로 아래 SQL을 실행합니다.

```sql
insert into public.site_admins(user_id) values ('관리자-사용자-UUID');
```

5. `.env.local` 또는 Vercel 환경변수에 다음을 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**중요:** `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 비밀값입니다. 외부에 공개하거나 `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

## Vercel 배포
GitHub 저장소 `BITMATE-del/cardsvc`를 Vercel로 Import하고, 위 환경변수 세 가지를 등록한 후 배포합니다. 실제 배포 도메인과 운영 환경의 관리자 로그인은 별도로 검증해야 합니다.

## 운영 안내
이 프로젝트는 일반 의료정보 제공 목적입니다. 처방의약품의 직구 판매·공동구매 접수·결제·배송지 수집을 제공하지 않습니다. 치료 결정은 의료진 상담을, 해외 의약품 반입은 관계기관 안내를 따르세요. 의료·법률 및 광고 규제 검토 후 운영하세요.
