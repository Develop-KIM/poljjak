# 폴짝 (poljjak)

> Claude Code와 Codex가 이 프로젝트에서 작업할 때 참고하는 가이드입니다.
> AGENTS.md도 이 파일과 동일한 내용을 유지하세요.

## 프로젝트 개요

AI가 포트폴리오를 분석하고 개선해주는 서비스. 부가로 사용자 간 커뮤니티(게시글, 댓글, 좋아요, 1:1 채팅) 기능 포함.

- **단계**: MVP 개발 중 (팀원 시연 목적)
- **개발자**: 1인 사이드 프로젝트 (백엔드 1년차)
- **디자인 컨셉**: 토스 스타일 (미니멀, 깔끔)
- **이름 의미**: 포트폴리오로 한 단계 폴짝
- **학습 목적**: AI 자동화 개발 워크플로우 정착 → 양산 가능한 파이프라인 구축

## 주요 기능 (MVP)

### 핵심

1. AI 포트폴리오 분석 (CLOVA Studio)
2. 회원가입 / 로그인 (카카오·구글 OAuth)
3. 게시판 3종 (피드백 / 프로젝트 모집 / 스터디 모집)
4. 게시글 / 댓글 / 좋아요 / 공유
5. 1:1 실시간 채팅
6. 웹 내 실시간 알림
7. 신고 기능
8. 반응형 UI

### 비목표 (NOT to build)

- 결제 기능
- 단체 채팅 (1:1만)
- 모바일 앱 (Capacitor로 나중에)
- 푸시 알림 (앱 배포 이후 OneSignal)
- 다국어 (한국어만)
- 이메일/비밀번호 회원가입 (OAuth만)
- 리치 에디터 (평문 텍스트 + 이미지 갤러리만)
- 게시글 본문 중간 이미지 삽입
- OG 미리보기
- 관리자 페이지 (신고는 MVP에서 DB 저장만, 처리 UI는 나중에)

## 기술 스택

### 프론트엔드

- Nuxt 4 (Vue 3 기반)
- TypeScript (strict 모드)
- Tailwind CSS
- shadcn-vue
- Pinia
- VeeValidate + Zod
- Lucide Icons

### 백엔드 (Supabase 기반)

- Supabase Auth (카카오·구글 OAuth)
- Supabase Database (PostgreSQL)
- Supabase Storage (파일 업로드)
- Supabase Realtime (1:1 채팅, 알림)
- Drizzle ORM (Supabase Postgres에 직접 연결)
- Nuxt server routes (Nitro, 비즈니스 로직)

### AI

- CLOVA Studio HCX-005 (HyperCLOVA X)

### 배포

- Vercel (앱)
- Supabase (인프라)
- 도메인: 가비아

## 코딩 규칙

### 언어 / 스타일

- 주석은 모두 한국어
- 변수/함수명은 영어 (camelCase)
- 컴포넌트명은 PascalCase
- 파일명은 kebab-case
- TypeScript strict 모드
- any 타입 금지

### Vue / Nuxt

- 함수형 컴포넌트만 (script setup lang ts)
- Composables는 use 접두사
- 서버 API는 server/api/ 안에 RESTful

### 데이터베이스

- Drizzle 스키마는 server/db/schema/ 안에 도메인별 분리
- Supabase 콘솔에서 직접 스키마 수정 금지
- 개발 중: `npm run db:push` / 프로덕션 배포 전: `npm run db:generate`
- 엔티티 테이블(users, posts, analyses, comments 등)에 createdAt updatedAt 포함
- 이벤트성·불변 테이블(likes, messages, notifications, reports, chatRooms, postImages 등)은 createdAt만
- **FK 제약 조건 사용 안 함 (DDD 원칙)**
  - DB 스키마에 `.references()` 사용 금지
  - 집계 간 관계는 ID만 저장, 앱 레이어(서비스)에서 조회
  - CASCADE 삭제 없음 — 삭제 로직은 서비스 코드로 처리
  - 예외: 같은 집계 내 unique 제약(likes 중복 방지 등)은 허용

### 보안

- env 파일 절대 커밋 금지
- Supabase Service Role Key는 서버에서만
- Anon Key는 클라이언트에서
- 사용자 입력은 Zod 검증
- Row Level Security (RLS) 적극 활용

## 아키텍처 패턴

### API 응답 포맷

모든 server/api/ 라우트는 아래 형태를 유지한다.

```typescript
// 성공 — 데이터를 data 키로 감싸서 반환
return { data: result }

// 에러 — createError 사용, 한국어 메시지
throw createError({ statusCode: 404, statusMessage: '리소스를 찾을 수 없어요' })
throw createError({ statusCode: 401, statusMessage: '로그인이 필요해요' })
throw createError({ statusCode: 403, statusMessage: '권한이 없어요' })
```

### 서버 라우트 파일명 컨벤션

Nitro 메서드 suffix를 사용한다.

```
server/api/
├── analyses/
│   ├── index.get.ts       # GET  /api/analyses
│   ├── index.post.ts      # POST /api/analyses
│   └── [id]/
│       ├── index.get.ts   # GET  /api/analyses/:id
│       └── index.delete.ts
├── posts/
│   ├── index.get.ts
│   ├── index.post.ts
│   └── [id]/
│       ├── index.get.ts
│       ├── comments.get.ts
│       ├── comments.post.ts
│       └── likes.post.ts
└── auth/
    └── me.get.ts
```

### 서버 라우트 내부 구조

```typescript
// server/api/posts/index.post.ts
import { postCreateSchema } from '~/server/validation/posts'

export default defineEventHandler(async (event) => {
  // 1. 인증 확인
  const user = await requireAuth(event)

  // 2. 입력 검증 (Zod)
  const body = await readValidatedBody(event, postCreateSchema.parse)

  // 3. 비즈니스 로직
  const result = await db
    .insert(posts)
    .values({ ...body, userId: user.id })
    .returning()

  // 4. 응답
  return { data: result[0] }
})
```

### Zod 스키마 위치

- 서버 검증 스키마: `server/validation/{도메인}.ts`
- 클라이언트 폼 스키마: `app/validation/{도메인}.ts`

```typescript
// server/validation/posts.ts
import { z } from 'zod'

export const postCreateSchema = z.object({
  category: z.enum(['feedback', 'project', 'study']),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(5000),
  analysisId: z.string().uuid().optional(),
})
```

### Composable 구조

데이터 fetch composable은 아래 틀을 따른다.

```typescript
export function useXxx() {
  const data = ref<T | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetch() {
    pending.value = true
    error.value = null
    try {
      const res = await $fetch('/api/...')
      data.value = res.data
    } catch (e) {
      error.value = '데이터를 불러오지 못했어요'
    } finally {
      pending.value = false
    }
  }

  return { data, pending, error, fetch }
}
```

### 인증 헬퍼

서버 라우트에서 로그인 확인은 `server/utils/auth.ts`의 헬퍼를 사용한다.

```typescript
// 로그인 필수 — 미인증 시 401 자동 throw
const user = await requireAuth(event)

// 로그인 선택 — 비로그인이면 null
const user = await getAuthUser(event)
```

## 작업 흐름

### SDD (Spec-Driven Development)

1. 새 기능 구현 전 .specs/{번호}-{기능명}.md 작성
2. 스펙에 인수 기준 명시
3. 비목표 명확히
4. 사용자 승인 후 구현 시작

### 검증

- npm run lint
- npm run typecheck
- npm run test
- npm run build

### 커밋

- Conventional Commits 형식
- 한국어 커밋 메시지
- husky + commitlint 자동 검증
- 예: feat(auth): 카카오 로그인 추가

## 절대 금지 사항

- env 파일 git 커밋
- Supabase Service Role Key 클라이언트 노출
- 마이그레이션 파일 임의 수정
- main 브랜치 직접 푸시
- 비목표 기능 임의 추가
- 영어 주석 / 영어 커밋 메시지

## 디렉터리 구조

```
poljjak/
├── CLAUDE.md
├── AGENTS.md
├── .specs/
├── .claude/
│   ├── commands/
│   └── agents/
├── nuxt.config.ts
├── package.json
├── drizzle.config.ts
├── server/
│   ├── api/
│   ├── db/schema/
│   ├── middleware/
│   └── utils/
├── pages/
├── components/
├── composables/
├── layouts/
└── public/
```

## 환경 변수 (.env)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
CLOVA_STUDIO_API_KEY=
CLOVA_STUDIO_API_URL=
NUXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

## 자주 쓰는 명령어

```bash
# 개발 서버
npm run dev

# DB
npm run db:generate
npm run db:push
npm run db:studio

# 검증
npm run lint
npm run typecheck
npm run test
npm run build
```

## Claude Code / Codex 역할 분담

- Claude Code: 기획, 스펙 작성, 코드 리뷰, 복잡한 리팩토링
- Codex: 빠른 구현, 명확한 단위 작업, 자율 실행

스펙은 항상 Claude로 작성 → Codex로 구현 → Claude로 리뷰

## 슬래시 커맨드

.claude/commands/ 에 정의:

- /discover {주제} — 요구사항 인터뷰
- /plan — requirements를 구현 스펙으로
- /review {스펙파일} — 코드 리뷰
- /commit — Conventional Commit 작성
- /test — 테스트 코드 작성
- /validate — 린트 + 타입체크 + 테스트
