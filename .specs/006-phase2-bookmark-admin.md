# 스펙: 폴짝 2차 개발 — 북마크 + 관리자 페이지

> 기반 요구사항: requirements-phase2.md

## 목표 (한 문장)

커뮤니티 재방문율을 높이는 북마크와, 코드 배포 없이 서비스를 운영할 수 있는 관리자 페이지(대시보드·프롬프트·신고·사용자 관리)를 구축한다.

---

## 인수 기준

### 북마크
- **AC-1**: 로그인 상태에서 게시글 상세·목록 카드의 북마크 아이콘 클릭 시 즉시 색상이 바뀌고(Optimistic UI), 서버 저장 완료 후 유지된다
- **AC-2**: 비로그인 상태에서 북마크 아이콘 클릭 시 페이지 이동 없이 로그인 모달이 표시된다
- **AC-3**: 북마크된 게시글을 재클릭하면 해제되고 아이콘이 원래대로 돌아온다
- **AC-4**: 마이페이지에 "저장한 글" 탭이 존재하며, 북마크한 게시글이 저장 최신순으로 나열된다
- **AC-5**: 북마크한 게시글이 삭제된 경우 목록에 "삭제된 게시글"로 표시되며 클릭 시 이동하지 않는다

### AI 분석 직군 제한
- **AC-6**: jobType이 null인 사용자가 분석 페이지(`/analyze`) 접근 시 "직군을 먼저 설정해주세요" 안내와 함께 마이페이지 프로필 편집으로 유도한다
- **AC-7**: 서버 API(`POST /api/analyses`)도 jobType null 사용자 요청 시 400 에러를 반환한다 (클라이언트 우회 방지)

### 관리자 공통
- **AC-8**: `role = 'user'`인 계정으로 `/admin` 접근 시 홈으로 리다이렉트된다
- **AC-9**: `role = 'admin'`인 계정은 헤더에 "관리자" 링크가 보인다

### 대시보드
- **AC-10**: 대시보드 접속 시 서비스 현황 카드 5개(오늘 가입자·게시글·댓글, 누적 사용자·게시글)가 표시된다
- **AC-11**: AI 현황 카드 6개(오늘 요청·성공·실패·성공률·평균응답시간·오늘토큰·누적토큰)가 표시된다
- **AC-12**: 시간대별(0~23시) 분석 요청 막대 차트가 표시된다
- **AC-13**: 실패한 분석 목록에 사용자 닉네임·요청 시각·재시도 버튼이 표시된다. 재시도 클릭 시 해당 분석이 `processing` 상태로 재실행된다
- **AC-14**: 최근 7일 일별 평균 응답 시간 꺾은선 차트가 표시된다

### 프롬프트 관리
- **AC-15**: developer·designer 2종 탭 전환 시 각 직군의 현재 활성 프롬프트가 텍스트 에디터에 로드된다
- **AC-16**: "저장" 클릭 시 새 버전이 생성되고 버전 이력 목록에 저장 일시와 함께 추가된다
- **AC-17**: 이전 버전 선택 후 "복원" 클릭 시 해당 내용이 활성 프롬프트로 전환된다
- **AC-18**: "테스트 실행" 클릭 시 샘플 텍스트로 현재 에디터 내용 기준 CLOVA 분석이 실행되고 결과가 팝업으로 표시된다 (DB 저장 없음)
- **AC-19**: 프롬프트 저장 직후부터 신규 분석 요청에 새 프롬프트가 적용된다

### 신고 관리
- **AC-20**: 신고 목록에서 미처리/처리됨 필터 전환이 동작한다
- **AC-21**: "콘텐츠 삭제" 클릭 시 해당 게시글·댓글이 소프트 삭제되고 신고 상태가 "처리됨"으로 바뀐다
- **AC-22**: 키워드 검색으로 게시글·댓글을 찾아 신고 없이 직접 삭제할 수 있다

### 사용자 관리
- **AC-23**: 닉네임·이메일 검색으로 사용자를 찾을 수 있다. 목록에 가입일·마지막 로그인이 표시된다
- **AC-24**: role 토글 클릭 시 user ↔ admin 전환이 즉시 반영된다
- **AC-25**: 정지 토글 클릭 시 `suspended_at`이 기록되고, 해당 계정으로 로그인 시 "정지된 계정입니다" 메시지가 표시된다

---

## 기술 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| 차트 | `vue-chartjs` + `chart.js` | Nuxt 4 호환, 막대·꺾은선 모두 지원, 경량 |
| 프롬프트 에디터 | `<textarea>` (plain) | 리치 에디터 비목표 |
| 어드민 레이아웃 | `layouts/admin.vue` 별도 | 헤더·네비 구조가 서비스와 다름 |
| DB 변경 | `npm run db:push` (개발 중) | CLAUDE.md 기준 |

**DB 스키마 변경 요약**

```
bookmarks    신규: id, post_id uuid, user_id uuid, created_at  UNIQUE(post_id, user_id)
prompts      신규: id, job_type enum('developer','designer'), content text,
                   is_active boolean default false, created_by uuid, created_at
users        추가: role enum('user','admin') default 'user'
                   suspended_at timestamp
reports      추가: status enum('pending','resolved') default 'pending'
                   resolved_at timestamp
analyses     추가: token_usage integer (null 허용, 이전 데이터는 null)
```

**제거**
- `server/prompts/analysis-general.txt` — general 프롬프트 삭제
- `clova.ts` — jobType null 분기 제거, null이면 에러 throw

---

## 태스크 분해

### Phase 0: DB 스키마
**T01: DB 스키마 변경 + 시드 (45분)**
- `bookmarks`, `prompts` 테이블 신규 생성
- `users`, `reports`, `analyses` 컬럼 추가
- `prompts` 초기 시드: 기존 `analysis-developer.txt`, `analysis-designer.txt` 내용 삽입
- `prompts.job_type` enum에서 `general` 제거
- 검증: `npm run db:push` 성공, `db:studio`에서 5개 테이블 확인
- 의존: 없음

---

### Phase 1: 북마크
**T02: 북마크 API (45분)**
- `POST /api/posts/[id]/bookmarks` — 토글 (추가/해제), `{ data: { bookmarked: boolean } }` 반환
- `GET /api/users/me/bookmarks` — 저장 최신순 목록, 삭제된 게시글 포함
- 검증: 토글 반복 호출로 추가·해제 교대 확인
- 의존: T01

**T03: 북마크 UI — 카드·상세 아이콘 (1시간)**
- `PostCard`, `community/[id].vue`에 북마크 아이콘(Lucide `Bookmark`) 추가
- Optimistic UI, 비로그인 시 로그인 모달 트리거
- 게시글 목록·상세 초기 로드 시 `isBookmarked` 반영
- 검증: 로그인·비로그인 각각 클릭 동작, 새로고침 후 상태 유지 확인
- 의존: T02

**T04: 마이페이지 "저장한 글" 탭 (45분)**
- `my.vue` 탭 추가, `/api/users/me/bookmarks` 연동
- 삭제된 게시글 → "삭제된 게시글" 텍스트 + 클릭 비활성화
- 검증: 북마크 후 탭 이동, 게시글 삭제 후 표시 확인
- 의존: T02

---

### Phase 2: AI 분석 직군 제한
**T05: 직군 미설정 사용자 분석 차단 (30분)**
- `analyses/index.post.ts`: `user.jobType`이 null이면 `400 '포트폴리오 분석을 위해 직군을 먼저 설정해주세요'` throw
- `clova.ts`: jobType null 분기(`general`) 제거, 파라미터 타입을 `'developer' | 'designer'`로 변경
- `server/prompts/analysis-general.txt` 삭제
- `pages/analyze.vue`: 진입 시 `user.jobType` 확인, null이면 안내 메시지 + 마이페이지 링크 표시 (분석 폼 숨김)
- 검증: jobType null 계정으로 API 직접 호출 → 400, 분석 페이지 진입 → 안내 화면 표시
- 의존: 없음

---

### Phase 3: 관리자 공통
**T06: 어드민 레이아웃 + 미들웨어 + 헬퍼 (45분)**
- `layouts/admin.vue` — 사이드 또는 상단 탭 네비(대시보드·프롬프트·신고·사용자)
- `server/utils/admin.ts` — `requireAdmin(event)`: role 확인, 아니면 403
- `app/middleware/admin.ts` — `/admin/**` 접근 시 role 확인, 아니면 홈 리다이렉트
- `users` 스키마 `role` 반영: `auth/sync.post.ts` 응답에 role 포함, `requireAuth`가 반환하는 user에 role 포함
- `default.vue` 헤더: `authStore.profile?.role === 'admin'`일 때 "관리자" 링크 노출
- 검증: user 계정으로 `/admin` 접근 시 홈 이동, admin 계정은 정상 접근
- 의존: T01

---

### Phase 4: 대시보드
**T07: 대시보드 집계 API (1시간)**
- `GET /api/admin/dashboard` — 서비스 현황 + AI 현황 카드 데이터
  - 오늘 기준: `createdAt >= today 00:00`으로 COUNT
  - 평균 응답시간: `AVG(updatedAt - createdAt)` where `status = 'completed'` and today
  - 토큰: `SUM(token_usage)` (null 제외)
- `GET /api/admin/dashboard/charts` — 시간대별 분포(0~23), 7일 응답시간 추이
- `GET /api/admin/dashboard/failed-analyses` — 실패 분석 목록 (최근 50건)
- 검증: 분석 요청 후 카드 수치 변화 확인
- 의존: T06

**T08: 분석 재시도 API (30분)**
- `POST /api/admin/analyses/[id]/retry`
- `status = 'failed'`인 경우만 허용, `processing`으로 변경 후 백그라운드 재분석 실행
- 검증: 실패 분석 재시도 후 status `processing` → `completed` 전환 확인
- 의존: T06

**T09: 대시보드 UI + 차트 (1.5시간)**
- `pages/admin/index.vue`
- `vue-chartjs` 설치, `ClientOnly` 래퍼로 SSR 이슈 방지
- 서비스 현황 카드 5개 + AI 현황 카드 6개
- 막대 차트(시간대별) + 꺾은선 차트(7일 응답시간) + 실패 목록·재시도 버튼
- 검증: 카드·차트 정상 렌더링, 재시도 버튼 클릭 후 목록에서 해당 항목 사라짐
- 의존: T07, T08

---

### Phase 5: 프롬프트 관리
**T10: 프롬프트 CRUD API (1시간)**
- `GET /api/admin/prompts?jobType=developer` — 활성 프롬프트 + 버전 이력
- `POST /api/admin/prompts` — 신규 버전 저장 (트랜잭션: 기존 active → false, 신규 row 삽입)
- `POST /api/admin/prompts/[id]/restore` — 이전 버전 복원
- `clova.ts` 수정: 파일 대신 DB에서 `is_active = true` 프롬프트 조회
- 검증: 저장 후 즉시 분석 요청 시 새 프롬프트 사용 확인
- 의존: T06

**T11: 프롬프트 테스트 API (30분)**
- `POST /api/admin/prompts/test` — `{ jobType, promptContent, sampleText }` 받아 CLOVA 임시 호출, 결과 반환 (DB 저장 없음)
- 검증: 임의 프롬프트 + 샘플 텍스트로 호출 시 분석 결과 JSON 반환 확인
- 의존: T10

**T12: 프롬프트 관리 UI (1.5시간)**
- `pages/admin/prompts.vue`
- developer·designer 탭 전환, `<textarea>` 에디터, 저장 버튼
- 버전 이력 목록(저장 일시·복원 버튼)
- 테스트 실행 팝업: 샘플 텍스트 입력 → CLOVA 결과 표시
- 검증: 저장·복원·테스트 전체 플로우 수동 확인
- 의존: T10, T11

---

### Phase 6: 신고 관리
**T13: 신고 관리 API (1시간)**
- `GET /api/admin/reports?status=pending|resolved` — 신고 목록
- `POST /api/admin/reports/[id]/resolve` — 처리됨 + 콘텐츠 소프트 삭제 (선택)
- `GET /api/admin/contents?q=키워드&type=post|comment` — 직접 검색
- `DELETE /api/admin/contents/[type]/[id]` — 직접 삭제
- 검증: 신고 처리 후 status 변경, 콘텐츠 삭제 확인
- 의존: T06

**T14: 신고 관리 UI (1시간)**
- `pages/admin/reports.vue`
- 미처리/처리됨 필터 탭, 신고 목록·콘텐츠 미리보기·삭제 버튼
- 직접 검색·삭제 인터페이스
- 검증: 필터 전환, 삭제 후 목록에서 제거 확인
- 의존: T13

---

### Phase 7: 사용자 관리
**T15: 사용자 관리 API (45분)**
- `GET /api/admin/users?q=검색어` — 목록 (닉네임·이메일·가입일·마지막로그인·role·suspended_at)
- `PATCH /api/admin/users/[id]/role` — role 변경
- `PATCH /api/admin/users/[id]/suspend` — 정지·해제 토글
- `auth/sync.post.ts` — 로그인 시 `suspended_at` 확인, 설정돼 있으면 403 반환
- 검증: role 변경 후 해당 계정 어드민 접근 확인, 정지 후 로그인 차단 확인
- 의존: T06

**T16: 사용자 관리 UI (1시간)**
- `pages/admin/users.vue`
- 검색 인풋, 테이블(닉네임·이메일·가입일·마지막로그인·role·정지 여부)
- role·정지 토글 버튼
- 검증: 검색·토글 동작, 정지 계정 표시 확인
- 의존: T15

---

## 의존성 그래프

```
T01 → T02 → T03
           → T04

T05 (독립)

T01 → T06 → T07 → T09
           → T08 → T09
           → T10 → T12
           → T11 → T12
           → T13 → T14
           → T15 → T16
```

---

## 비목표

- 권한 등급 세분화 (슈퍼어드민 등)
- 자동 제재·AI 필터링
- 이메일·알림 발송
- 정지 계정 기존 게시글 자동 숨김
- 프롬프트 diff 뷰어
- 광고·수익 지표
- 북마크 폴더·공개

---

## 리스크 / 의존성

| 리스크 | 대응 |
|---|---|
| `vue-chartjs` Nuxt 4 SSR 이슈 | `ClientOnly` 래퍼로 클라이언트 렌더링 강제 |
| 프롬프트 테스트 CLOVA 응답 지연 | 로딩 스피너 + 30초 타임아웃 설정 |
| 분석 재시도 중복 실행 | 재시도 전 status 체크, `processing` 상태면 버튼 비활성화 |
| 기존 `analyses` 데이터 `token_usage = null` | null 허용, 집계 시 `COALESCE(token_usage, 0)` |
| jobType null 사용자 기존 분석 이력 | 영향 없음 (과거 분석 결과는 그대로 유지) |

---

## 검증 시나리오

**시나리오 1 — 북마크 플로우**
1. 로그인 후 게시글 목록에서 북마크 아이콘 클릭 → 즉시 색상 변경
2. 마이페이지 "저장한 글" 탭에서 확인
3. 해당 게시글 삭제 후 목록에서 "삭제된 게시글" 표시 확인
4. 재클릭으로 해제 확인

**시나리오 2 — 직군 미설정 분석 차단**
1. jobType null 계정으로 `/analyze` 진입 → 안내 화면 표시
2. API 직접 호출 → 400 에러 확인
3. 마이페이지에서 직군 설정 후 분석 페이지 재진입 → 폼 정상 표시

**시나리오 3 — 프롬프트 수정 → 분석 반영**
1. 관리자 → 프롬프트 관리, developer 프롬프트 수정 후 저장
2. 버전 이력 추가 확인
3. 새 분석 요청 → 수정된 프롬프트 적용 확인
4. 이전 버전 복원 → 다음 분석에 이전 프롬프트 적용 확인

**시나리오 4 — 신고 처리**
1. 일반 계정으로 게시글 신고
2. 관리자 → 신고 관리 미처리 목록 확인
3. "콘텐츠 삭제" → 게시글 삭제 + 처리됨 전환 확인

**시나리오 5 — 사용자 정지**
1. 관리자 → 사용자 관리에서 특정 계정 정지
2. 해당 계정 로그인 → "정지된 계정입니다" 확인
3. 관리자가 정지 해제 → 로그인 정상 동작 확인
