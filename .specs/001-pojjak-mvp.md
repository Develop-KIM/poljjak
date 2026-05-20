# 스펙: 폴짝 MVP 전체 구현

> 기반 요구사항: requirements-poljjak-mvp.md

## 목표 (한 문장)

카카오 로그인으로 가입한 개발자·디자이너가 PDF 포트폴리오를 AI에게 분석받고,
커뮤니티에서 사람 피드백·프로젝트·스터디 모집까지 이어지는 MVP를 팀원 시연 가능 수준으로 완성한다.

---

## 인수 기준

### 인증
- AC-1: 카카오 로그인 버튼 클릭 → 카카오 동의 → 계정 생성 및 로그인 완료
- AC-2: 이메일 동의 불가 시 카카오 닉네임만으로 가입 진행
- AC-3: 비로그인 상태에서 쓰기 액션 시도 시 페이지 이동 없이 로그인 모달 표시

### AI 포트폴리오 분석
- AC-4: PDF 이외 파일 선택 시 업로드 차단 + "PDF 파일만 가능합니다" 메시지
- AC-5: 10MB 초과 또는 51페이지 이상 PDF 업로드 시도 시 구체적 에러 메시지. 업로드 UI에 제한 조건 사전 표시
- AC-6: 이미지 스캔 PDF 업로드 시 "텍스트를 추출할 수 없습니다. 텍스트 PDF로 업로드해 주세요" 안내
- AC-7: 분석 중 스트리밍으로 결과가 실시간 표시됨 (빈 화면 X)
- AC-8: 분석 결과 페이지에 점수+코멘트 / 종합 피드백 / Before-After 제안 세 섹션이 노출됨
- AC-9: 마이페이지에서 이전 분석 결과 목록 조회 및 개별 결과 열람 가능
- AC-10: 공유 링크 생성 → 비로그인 브라우저에서 열람 가능, 작성자 이름 노출
- AC-11: 작성자가 "비공개 전환" 시 공유 링크 접근 차단 (404 또는 비공개 안내)
- AC-12: 분석 결과 → 커뮤니티 피드백 탭 게시글로 1클릭 공유

### 커뮤니티
- AC-13: 피드백 / 프로젝트 모집 / 스터디 모집 3개 탭 전환 가능
- AC-14: 비로그인 시 프로젝트·스터디 탭 목록·상세·댓글 열람 가능. 피드백 탭은 로그인 모달
- AC-15: 게시글 본문 5000자 초과 시 저장 불가 + 글자 수 카운터 표시
- AC-16: 본문 내 http/https URL이 클릭 가능한 링크로 렌더링됨. XSS 방지 확인 (script 태그 이스케이프)
- AC-17: 게시글에 jpg/png/webp/gif 이미지 최대 10장 첨부 가능. 5MB 초과 시 개별 에러
- AC-18: 댓글 작성·삭제, 좋아요 토글 정상 동작
- AC-19: 신고 버튼 클릭 → 신고 접수 → 운영자 이메일 수신 확인

### 1:1 채팅
- AC-20: 게시글 작성자에게 "DM 보내기" 클릭 시 채팅방 생성 또는 기존 채팅방으로 이동
- AC-21: 메시지 입력 후 전송 시 상대방 화면에 실시간으로 표시
- AC-22: 내 메시지 삭제 시 상대방 화면에 "삭제된 메시지" 표시
- AC-23: 채팅 목록에서 참여 중인 대화방 확인 가능

### 실시간 알림
- AC-24: 내 게시글에 댓글 달리면 알림 벨에 뱃지 + 알림 목록에 노출
- AC-25: 내 게시글 좋아요 받으면 알림 노출
- AC-26: DM 수신 시 알림 노출

### 프로필 / 탈퇴
- AC-27: 마이페이지에서 프로필 사진 업로드·변경 가능
- AC-28: 탈퇴 신청 시 "30일 후 영구 삭제" 안내. 유예 기간 내 재로그인 시 복구

---

## 기술 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Nuxt 4 + Nitro | CLAUDE.md 기준 |
| DB | PostgreSQL 16 + Drizzle ORM | CLAUDE.md 기준 |
| 인증 | Better Auth (카카오 OAuth) | CLAUDE.md 기준, 카카오 소셜 지원 |
| 파일 저장 | Cloudflare R2 | PDF + 이미지 저장, S3 호환 API |
| AI | Anthropic Claude API (claude-sonnet-4-6) | CLAUDE.md 기준, 스트리밍 지원 |
| PDF 파싱 | `pdf-parse` | 경량, Node.js 서버에서 텍스트 추출 |
| 실시간 | Nitro WebSocket | CLAUDE.md 기준, 채팅 + 알림 공용 |
| 이메일 | Resend | 신고 알림 발송, 간단한 API |
| UI | Tailwind CSS + shadcn-vue + Lucide | CLAUDE.md 기준 |

### DB 스키마 (신규 테이블)

```
users                  - Better Auth 기본 + profile_image_url
portfolio_analyses     - 분석 결과 (userId, pdfUrl, prompt, result JSON, isPublic, shareToken)
posts                  - 게시글 (userId, category, title, body, analysisId?)
post_images            - 게시글 이미지 (postId, url, order)
comments               - 댓글 (postId, userId, body)
likes                  - 좋아요 (postId, userId) UNIQUE
chat_rooms             - 채팅방 (id)
chat_participants      - 참가자 (roomId, userId, leftAt)
chat_messages          - 메시지 (roomId, senderId, body, deletedAt)
notifications          - 알림 (userId, type, targetId, isRead)
reports                - 신고 (reporterId, targetType, targetId, reason)
```

---

## 태스크 분해

### Phase 0: 프로젝트 셋업

#### T01: Nuxt 4 초기화 + TypeScript + 린트 설정 (30분)
- `npx nuxi@latest init`, strict TS, eslint, prettier
- 검증: `npm run lint`, `npm run typecheck` 에러 없음
- 의존: 없음

#### T02: Docker + PostgreSQL + Drizzle ORM 설정 (45분)
- `docker-compose.yml`, `server/db/` 구조, `DATABASE_URL` 환경변수
- 검증: `npm run db:studio` 접속 성공
- 의존: T01

#### T03: Tailwind CSS + shadcn-vue 설정 (30분)
- Tailwind 설치, shadcn-vue init, Lucide 설치
- 검증: 샘플 Button 컴포넌트 렌더링 확인
- 의존: T01

#### T04: 레이아웃 + 기본 페이지 구조 (1시간)
- `layouts/default.vue` (헤더, 네비), `pages/index.vue`, 반응형 확인
- 검증: 모바일·데스크탑 레이아웃 깨짐 없음
- 의존: T03

---

### Phase 1: 인증

#### T05: Better Auth + 카카오 OAuth 설정 (1.5시간)
- `server/utils/auth.ts`, 카카오 앱 설정, 환경변수
- 이메일 없을 시 닉네임 폴백 로직
- 검증: 카카오 로그인 → DB users 테이블에 row 생성
- 의존: T02

#### T06: 로그인 모달 컴포넌트 (1시간)
- `components/auth/login-modal.vue`, Pinia authStore
- 쓰기 액션 시도 시 모달 트리거 로직 (composable)
- 검증: 비로그인으로 좋아요 클릭 → 모달 표시, 로그인 완료 → 모달 닫힘
- 의존: T05

#### T07: 인증 미들웨어 (30분)
- `server/middleware/auth.ts` — 보호 라우트 일괄 처리
- 검증: 비인증 요청 시 401 반환
- 의존: T05

---

### Phase 2: AI 포트폴리오 분석

#### T08: Cloudflare R2 연동 유틸 (45분)
- `server/utils/r2.ts` — 업로드/삭제 헬퍼
- 검증: 테스트 파일 업로드 후 URL 접근 성공
- 의존: T02

#### T09: PDF 업로드 + 파일 검증 API (1시간)
- `server/api/portfolio/upload.post.ts`
- 형식(PDF만), 용량(10MB), 페이지 수(50) 검증
- 이미지 스캔 PDF 감지 (텍스트 추출 0자면 에러)
- 검증: 각 에러 케이스별 명확한 메시지 반환
- 의존: T08, T07

#### T10: Claude API 스트리밍 분석 (1.5시간)
- `server/api/portfolio/analyze.post.ts`
- 점수+코멘트 / 종합 피드백 / Before-After 구조화 프롬프트
- SSE 스트리밍 응답
- 검증: 실제 PDF 업로드 시 스트리밍으로 결과 수신
- 의존: T09

#### T11: 분석 결과 저장 + 마이페이지 목록 (1시간)
- `server/api/portfolio/` — 결과 저장, 목록 GET
- `pages/my/analyses.vue` — 목록 UI
- 검증: 분석 후 마이페이지에서 결과 목록 조회
- 의존: T10

#### T12: 분석 결과 상세 페이지 (1시간)
- `pages/analysis/[id].vue`
- 세 섹션 렌더링 (점수/종합/BeforeAfter)
- 검증: 세 섹션 모두 정상 표시, 재분석 버튼 동작
- 의존: T11

#### T13: 공유 링크 생성 + 공개/비공개 전환 (45분)
- `server/api/portfolio/[id]/share.ts`
- `shareToken` UUID, `isPublic` 토글
- 검증: 비로그인 브라우저에서 공유 링크 열람. 비공개 전환 후 차단 확인
- 의존: T12

#### T14: 분석 결과 → 커뮤니티 공유 (30분)
- 결과 페이지 "커뮤니티에 공유" 버튼 → 피드백 탭 게시글 작성 폼에 결과 ID 연결
- 검증: 공유 클릭 → 게시글 작성 폼에 분석 결과 미리보기 표시
- 의존: T12, T15

---

### Phase 3: 커뮤니티

#### T15: 게시글 DB 스키마 + CRUD API (1.5시간)
- `server/db/schema/posts.ts`, `post_images.ts`, `comments.ts`, `likes.ts`
- `server/api/posts/` — 목록, 상세, 작성, 수정, 삭제
- 검증: API 수동 테스트, 카테고리 필터 동작
- 의존: T02, T07

#### T16: 커뮤니티 목록 + 탭 UI (1시간)
- `pages/community/index.vue` — 3개 탭, 페이지네이션
- 비로그인 접근 권한 처리 (피드백 탭 → 모달)
- 검증: 비로그인으로 피드백 탭 클릭 시 모달. 나머지 탭은 목록 표시
- 의존: T15, T06

#### T17: 게시글 작성 폼 (45분)
- `pages/community/write.vue`
- 제목 + textarea (5000자 카운터) + 카테고리 선택
- 검증: 5001자 입력 시 저장 불가. 줄바꿈 유지 확인
- 의존: T15, T07

#### T18: 게시글 이미지 업로드 (1.5시간)
- `server/api/posts/images.post.ts` — R2 업로드
- 클라이언트: 드래그앤드롭 + 미리보기, 10장 제한, 5MB 개별 검증
- 검증: 11장 시도 시 차단. 5MB 초과 파일 개별 에러 메시지
- 의존: T08, T17

#### T19: 게시글 상세 + 댓글 (1시간)
- `pages/community/[id].vue`
- 본문 링크 자동 변환 (XSS 처리), 댓글 CRUD
- 검증: `<script>` 태그 이스케이프 확인. http 링크 클릭 가능
- 의존: T15, T07

#### T20: 좋아요 토글 (30분)
- `server/api/posts/[id]/like.post.ts`
- Optimistic update UI
- 검증: 로그인 상태에서 토글 → 카운트 변경. 비로그인 → 모달
- 의존: T15, T06

#### T21: 신고 기능 + 이메일 알림 (45분)
- `server/api/reports.post.ts` — 신고 저장
- Resend로 운영자 이메일 발송
- 검증: 신고 제출 → DB reports 테이블 row 생성 + 이메일 수신
- 의존: T15, T07

---

### Phase 4: 1:1 채팅

#### T22: 채팅 DB 스키마 (30분)
- `chat_rooms`, `chat_participants`, `chat_messages` 테이블
- 검증: 마이그레이션 성공, 스키마 확인
- 의존: T02

#### T23: WebSocket 서버 (Nitro) (1.5시간)
- `server/routes/_ws.ts` — 연결, 메시지 라우팅, 인증
- 채팅방 join/leave, 메시지 저장 + 실시간 전송
- 검증: 두 브라우저에서 메시지 전송 시 실시간 수신
- 의존: T22, T07

#### T24: 채팅 목록 페이지 (45분)
- `pages/chat/index.vue` — 참여 중인 대화방 목록, 최근 메시지 미리보기
- 검증: DM 보낸 후 채팅 목록에 대화방 표시
- 의존: T23

#### T25: 채팅방 UI (1.5시간)
- `pages/chat/[roomId].vue` — 메시지 목록, 입력창, 실시간 수신
- 메시지 삭제 (본인만), 대화방 나가기
- 검증: 삭제 시 상대방 화면 "삭제된 메시지". 나가기 시 상대방 화면 유지
- 의존: T23

---

### Phase 5: 실시간 알림

#### T26: 알림 DB 스키마 + 생성 로직 (45분)
- `notifications` 테이블, 댓글/좋아요/DM 이벤트 트리거 시 알림 생성
- 검증: 댓글 작성 → notifications 테이블 row 생성
- 의존: T15, T22

#### T27: WebSocket 알림 전송 (1시간)
- 알림 생성 시 해당 유저 WebSocket 커넥션으로 push
- 검증: 다른 계정으로 내 게시글에 댓글 → 실시간 알림 수신
- 의존: T23, T26

#### T28: 알림 UI (1시간)
- 헤더 벨 아이콘 + 미읽음 뱃지 + 드롭다운 목록
- 클릭 시 읽음 처리 + 해당 게시글/채팅방 이동
- 검증: 알림 수신 → 뱃지 표시. 클릭 → 이동 + 뱃지 감소
- 의존: T27

---

### Phase 6: 부가 기능

#### T29: 프로필 사진 업로드 (45분)
- `server/api/user/profile-image.post.ts` — R2 업로드
- `pages/my/profile.vue` — 사진 변경 UI
- 검증: 업로드 후 헤더 아바타에 반영
- 의존: T08, T07

#### T30: 회원 탈퇴 플로우 (1시간)
- 탈퇴 신청 → `deletedAt` 기록, 30일 유예 안내
- 30일 후 배치: 개인정보 삭제, AI 분석 결과 삭제, 게시글 익명화
- 검증: 탈퇴 신청 후 재로그인 시 복구 확인. 탈퇴 계정 게시글 "탈퇴한 사용자" 표시
- 의존: T05

---

## 의존성 그래프 요약

```
T01 → T02 → T05 → T07
           ↓         ↓
          T08      T09 → T10 → T11 → T12 → T13
           ↓                              ↓
T01 → T03 → T04                          T14 → T15 → T16
                                               ↓       ↓
                                     T17 → T18  T19  T20  T21
                                     T02 → T22 → T23 → T24
                                                   ↓
                                               T25  T26 → T27 → T28
                                     T08 → T29
                                     T05 → T30
```

---

## 비목표

- 결제 기능
- 단체 채팅
- 이메일/비밀번호 회원가입
- 구글 OAuth
- 모바일 앱
- 푸시 알림
- PDF 외 파일 분석
- 포트폴리오 자동 재작성
- 관리자 페이지
- 리치 에디터 (Tiptap 등)
- 링크 OG 미리보기

---

## 리스크 / 의존성

| 리스크 | 대응 |
|--------|------|
| 카카오 이메일 동의 검수 지연 | 닉네임만으로 가입 폴백 구현 |
| `pdf-parse` 특정 PDF 파싱 실패 | 텍스트 0자 감지 → 사용자 안내 |
| Cloudflare R2 설정 복잡성 | T08에서 선행 검증 후 T09 진행 |
| WebSocket 인증 처리 | JWT 토큰 기반 핸드셰이크 |
| AI 분석 응답 지연 (10초+) | 스트리밍 + 로딩 상태 UI 필수 |

---

## 검증 시나리오

**시나리오 1 — AI 분석 전체 플로우**
1. 카카오 로그인 → 업로드 페이지 이동
2. PDF 업로드 (10MB 이하, 50페이지 이하)
3. 분석 방향 텍스트 입력 (선택)
4. 분석 시작 → 스트리밍으로 결과 표시
5. 결과 저장 확인 (마이페이지)
6. 공유 링크 생성 → 비로그인 브라우저에서 열람

**시나리오 2 — 커뮤니티 + DM**
1. 프로젝트 모집 게시글 작성 (이미지 3장 첨부)
2. 다른 계정으로 게시글 열람 + 댓글
3. 게시글 작성자에게 DM 전송
4. 작성자 화면에 실시간 알림 수신 + 채팅 확인

**시나리오 3 — 비로그인 제한**
1. 비로그인으로 피드백 탭 접근 → 로그인 모달
2. 프로젝트 탭 열람은 가능
3. 좋아요 클릭 → 로그인 모달 (CTA "로그인하고 좋아요 누르기")
