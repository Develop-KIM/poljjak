# 폴짝 (poljjak)

> Claude Code와 Codex가 이 프로젝트에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

AI가 포트폴리오를 분석하고 개선해주는 서비스. 부가로 사용자 간 커뮤니티(게시글, 댓글, 좋아요, 1:1 채팅) 기능 포함.

- **단계**: MVP 개발 중 (팀원 시연 목적)
- **개발자**: 1인 사이드 프로젝트
- **디자인 컨셉**: 토스 스타일 (미니멀, 깔끔)
- **이름의 의미**: 포트폴리오로 한 단계 폴짝

## 주요 기능 (MVP)

### 핵심
1. AI 포트폴리오 분석 (Claude API)
2. 회원가입 / 로그인 (구글 + 카카오 OAuth)
3. 게시글 / 댓글 / 좋아요
4. 1:1 실시간 채팅
5. 웹 내 실시간 알림
6. 반응형 UI

### 비목표 (NOT to build, 적어도 MVP에선)
- 결제 기능
- 단체 채팅 (1:1만)
- 모바일 앱 (웹 우선, 앱은 나중에 Capacitor)
- 푸시 알림 (앱 배포 이후)
- 다국어 (한국어만)

## 기술 스택

### 프론트엔드
- Nuxt 4 (Vue 3 기반)
- TypeScript (strict 모드)
- Tailwind CSS
- shadcn-vue (컴포넌트)
- Pinia (상태 관리)
- VeeValidate + Zod (폼 검증)
- Lucide Icons

### 백엔드
- Nuxt server routes (Nitro)
- Drizzle ORM
- PostgreSQL 16 (로컬은 Docker)
- Better Auth (구글 + 카카오 OAuth)

### AI / 실시간
- Anthropic Claude API
- Nitro WebSocket (1:1 채팅, 알림)

### 인프라 (배포 시)
- 도메인: 가비아
- 서버: 오라클 클라우드 Always Free (ARM)
- 리버스 프록시: Nginx
- SSL: Let's Encrypt
- 프로세스 관리: PM2

## 코딩 규칙

### 언어 / 스타일
- 주석은 모두 **한국어**로
- 변수/함수명은 영어 (camelCase)
- 컴포넌트명은 PascalCase
- 파일명은 kebab-case (예: `user-profile.vue`)
- 모든 코드는 TypeScript strict 모드

### Vue / Nuxt
- 함수형 컴포넌트만 사용 (Options API 금지)
- `<script setup lang="ts">` 형식
- Composables는 `composables/` 폴더에 `use` 접두사
- 페이지는 `pages/`, 레이아웃은 `layouts/`
- 서버 API는 `server/api/` 안에 RESTful하게

### 데이터베이스
- Drizzle 스키마는 `server/db/schema/` 안에 도메인별로 분리
- 마이그레이션은 항상 `npm run db:generate`로 생성
- 마이그레이션 파일은 절대 수동 수정 X
- 모든 외래 키 명시
- 모든 timestamp는 `createdAt`, `updatedAt` 포함

### API 설계
- RESTful 컨벤션 (GET/POST/PUT/PATCH/DELETE)
- 응답은 항상 `{ data, error }` 형식
- 에러는 createError로 일관되게 처리
- 인증 필요한 라우트는 미들웨어로 일괄 처리

### 보안
- `.env` 절대 커밋 금지
- 모든 비밀번호/토큰은 환경변수로
- 사용자 입력은 Zod로 무조건 검증
- SQL 인젝션 방지 (Drizzle 사용 시 기본 안전)
- XSS 방지 (Vue 기본 escape)

## 작업 흐름

### 변경 전 항상
1. 관련 파일 먼저 읽기
2. 영향 범위 파악
3. 큰 변경은 작은 커밋으로 쪼개기

### SDD (Spec-Driven Development)
- 새 기능 구현 전 `.specs/{번호}-{기능명}.md` 작성
- 스펙에는 인수 기준 명시
- 비목표 명확히 (시키지 않은 거 만들지 말 것)
- 사용자 승인 후 구현 시작

### 검증
- 코드 변경 후 `npm run lint`
- 타입 체크 `npm run typecheck`
- 테스트 작성 (인수 기준 기반)
- 빌드 확인 `npm run build`

### 커밋
- Conventional Commits 형식
- 한국어 커밋 메시지
- 예: `feat(auth): 카카오 로그인 추가`
- 타입: feat, fix, refactor, docs, style, test, chore

## 절대 금지 사항

- `.env` 파일 git 커밋
- 마이그레이션 파일 임의 수정
- main 브랜치에 직접 푸시 (반드시 PR)
- 미목표에 있는 기능 임의로 추가
- 사용자 데이터를 외부 서비스로 전송 (Claude API 제외)
- 한국어 주석 / 변수명 / DB 컬럼명

## 디렉터리 구조

```
poljjak/
├── CLAUDE.md              # 이 파일
├── AGENTS.md              # Codex용 (같은 내용)
├── .specs/                # 기능 스펙 문서
├── .claude/
│   ├── commands/          # 슬래시 커맨드
│   └── agents/            # 서브 에이전트
├── docker-compose.yml     # 로컬 PostgreSQL
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── server/
│   ├── api/               # API 엔드포인트
│   ├── db/
│   │   ├── schema/        # Drizzle 스키마
│   │   └── migrations/
│   ├── middleware/
│   └── utils/
├── pages/                 # 라우트
├── components/            # UI 컴포넌트
├── composables/           # 재사용 로직
├── layouts/
├── assets/
└── public/
```

## 환경 변수 (.env 예시)

```
# Database
DATABASE_URL=postgresql://dev:dev_password@localhost:5432/poljjak

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# OAuth - Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth - Kakao
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# Anthropic API
ANTHROPIC_API_KEY=

# App
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

## 자주 쓰는 명령어

```bash
# 개발 서버
npm run dev

# DB
docker compose up -d        # PostgreSQL 시작
docker compose down         # 중지
npm run db:generate         # 마이그레이션 생성
npm run db:migrate          # 마이그레이션 실행
npm run db:studio           # Drizzle Studio (GUI)

# 검증
npm run lint
npm run typecheck
npm run test
npm run build
```

## Claude Code / Codex 역할 분담

- **Claude Code**: 기획, 스펙 작성, 코드 리뷰, 복잡한 리팩토링
- **Codex**: 빠른 구현, 명확한 단위 작업, 자율 실행

스펙은 항상 Claude로 작성 → Codex로 구현 → Claude로 리뷰.
