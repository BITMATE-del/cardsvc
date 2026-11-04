# 스시자로 랜딩 · 관리자 CMS

## 고객 페이지
- `/` 고객용 소개 페이지
- 가격표, 패키지, 배송, FAQ, 상담 접수 안내

## 관리자 접속
- `/admin` 접속 → `/staff-login`으로 이동
- Vercel 환경변수 `ADMIN_ACCESS_PIN`에 지정한 PIN을 입력
- 서버 서명 쿠키를 사용하며, PIN은 클라이언트 소스에 포함하지 않음
- `ADMIN_SESSION_SECRET`은 32자 이상 임의 난수로 설정

## 관리자 메뉴
- 홈페이지 문구: 제목, 본문, 가격표, 상단 메뉴, 상담 문구 등 직접 수정
- 안내 카드: 기존 등록·편집
- 상담 내역: 신규/상담중/완료 상태 관리

## 문구 저장 준비 (필수)
현재 소스코드는 기본 문구를 내장합니다. 관리자에서 **변경 내용 저장**을 사용하려면, 이 프로젝트 전용 Supabase 연결이 필요합니다.

1. Supabase 프로젝트 생성
2. `supabase/schema.sql`, `supabase/consultations.sql`, `supabase/landing-texts.sql`을 실행
3. Vercel에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 환경변수 등록
4. 재배포 후 `/admin` 문구 수정과 저장 테스트

기존에 BITMATE 등 다른 서비스에서 사용하는 데이터베이스를 공유하지 마세요. 서비스 역할 키는 서버 환경변수에만 설정합니다.

## 개발
```sh
npm install
npm run typecheck
npm run build
npm run dev
```

> 4자리 관리자 PIN은 추측될 수 있으므로 운영 환경에서는 더 긴 비밀번호와 별도의 접근 제한을 권장합니다.
