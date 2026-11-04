# 스시자로 · Neon PostgreSQL

## 연결
1. 스시자로 전용 Neon 프로젝트에서 PostgreSQL 데이터베이스 생성
2. Neon SQL Editor에서 `neon/schema.sql` 실행
3. Vercel `cardsvc` 프로젝트의 Production/Preview에 **DATABASE_URL** 환경변수 등록 (Neon의 pooled connection string)
4. Redeploy

## 관리자
- `/admin` : 접속 암호 `ADMIN_ACCESS_PIN` (현재 Vercel에 9292 설정)
- 홈페이지 문구 편집: 178개 항목 검색, 수정, 저장
- 안내 카드 추가·수정·삭제
- 상담 접수 목록 조회 및 신규/상담중/완료 관리
- 기존 관리자 쿠키 인증 유지

## 환경변수
- `DATABASE_URL`: Neon 접속 문자열 (**서버 전용**, NEXT_PUBLIC 접두사 금지)
- `ADMIN_ACCESS_PIN`: 관리자 암호
- `ADMIN_SESSION_SECRET`: 관리자 세션 서명 키

## 개발
```bash
npm install
npm run typecheck
npm run build
```

기존 다른 서비스의 Neon 데이터베이스를 재사용하지 않고, 스시자로 프로젝트에 별도 DB를 연결하는 것이 안전합니다.
