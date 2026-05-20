# 005 — 카카오 OAuth 인증

## 목표

카카오 소셜 로그인을 통해 사용자가 가입·로그인할 수 있도록 한다.
Supabase Auth를 OAuth provider로 사용하고, 로그인 후 온보딩 여부에 따라 리다이렉트한다.

## 인수 기준

- [ ] 로그인 버튼 클릭 → 카카오 OAuth 동의 화면으로 이동
- [ ] 동의 완료 → Supabase Auth 세션 생성 (JWT)
- [ ] 신규 사용자 → `/onboarding` 으로 리다이렉트
- [ ] 기존 사용자 (온보딩 완료) → `/` 으로 리다이렉트
- [ ] 로그아웃 → 세션 삭제 후 `/` 으로 이동
- [ ] 회원 탈퇴 후 재로그인 → 온보딩 다시 진행
- [ ] 로그인 상태에서 `/onboarding` 직접 접근 → `/` 리다이렉트
- [ ] 미로그인 상태에서 보호 경로 접근 → 로그인 팝업 표시

## 비목표

- 이메일/비밀번호 로그인
- 카카오 외 다른 OAuth provider
- 세션 갱신 로직 커스텀 (Supabase 자동 처리)

## 흐름

```
[사용자] 로그인 클릭
    ↓
[클라이언트] supabase.auth.signInWithOAuth({ provider: 'kakao' })
    ↓
[카카오] 동의 화면 → 인가 코드 발급
    ↓
[Supabase Auth] 인가 코드 → 액세스 토큰 교환 → JWT 세션 생성
    ↓
[클라이언트] /auth/callback 으로 리다이렉트 (해시 또는 쿼리 파라미터)
    ↓
[서버] GET /api/auth/callback
    - Supabase 세션 확인
    - users 테이블에 upsert (kakao_id 기준)
    - last_login_at 갱신
    ↓
[서버] onboarding_completed_at 여부 판단
    - null → /onboarding
    - 있음 → /
```

## 구현 범위

### 1. Supabase 설정

- Supabase 대시보드 → Authentication → Providers → Kakao 활성화
- 카카오 개발자 콘솔에서 앱 생성 후 REST API 키 입력
- Redirect URL: `{SUPABASE_URL}/auth/v1/callback`

### 2. 클라이언트 Supabase 인스턴스

**`app/plugins/supabase.client.ts`**

- `@supabase/supabase-js` 로 클라이언트 생성
- Nuxt app 전역에 `$supabase` 주입

**`app/composables/useSupabase.ts`**

- `useNuxtApp().$supabase` 를 반환하는 래퍼

**`app/composables/useAuth.ts`**

- `user` (ref), `session` (ref) 상태 관리
- `signInWithKakao()` — OAuth 리다이렉트
- `signOut()` — 로그아웃 후 `/` 이동
- `init()` — 페이지 로드 시 세션 복원 + `onAuthStateChange` 구독

### 3. 서버 콜백 처리

**`server/api/auth/callback.get.ts`**

- Supabase Admin Client로 세션 사용자 확인
- `users` 테이블 upsert:
  ```
  kakao_id, nickname(임시), email, avatar_url, last_login_at
  ```
- `onboarding_completed_at` 체크 → 리다이렉트 URL 결정

**`server/api/auth/me.get.ts`**

- 현재 로그인 사용자 프로필 반환
- `requireAuth` 사용

**`server/api/auth/logout.post.ts`**

- Supabase Admin으로 세션 무효화

### 4. 미들웨어

**`app/middleware/auth.ts`**

- 보호 경로(`definePageMeta({ middleware: 'auth' })`) 접근 시
- 미로그인이면 로그인 팝업 상태 활성화 후 네비게이션 중단

**`app/middleware/onboarding.ts`**

- 전역 미들웨어 (`global: true`)
- 로그인 상태 && `onboarding_completed_at === null` && 현재 경로 !== `/onboarding`
  → `/onboarding` 리다이렉트

### 5. 서버 유틸 완성

**`server/utils/auth.ts`**

- `requireAuth(event)` — Authorization 헤더 또는 쿠키에서 JWT 추출 → Supabase Admin으로 검증 → users 테이블 조회
- `getAuthUser(event)` — 미인증이면 null 반환

### 6. 환경 변수

```
SUPABASE_URL=
SUPABASE_ANON_KEY=        # 클라이언트용
SUPABASE_SERVICE_ROLE_KEY= # 서버용
NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 파일 목록

```
app/
├── plugins/
│   └── supabase.client.ts
├── composables/
│   ├── useSupabase.ts
│   └── useAuth.ts
├── middleware/
│   ├── auth.ts
│   └── onboarding.ts   (global)
server/
├── api/auth/
│   ├── callback.get.ts
│   ├── me.get.ts
│   └── logout.post.ts
└── utils/
    └── auth.ts         (완성)
```

## 보안 체크리스트

- [ ] `SUPABASE_SERVICE_ROLE_KEY` 는 서버 코드에서만 참조
- [ ] 클라이언트에 노출되는 키는 `NUXT_PUBLIC_*` Anon Key만
- [ ] JWT 검증은 항상 서버에서 Supabase Admin으로 수행
- [ ] `state` 파라미터 CSRF 방어는 Supabase SDK가 처리
