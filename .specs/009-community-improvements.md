# 요구사항: 커뮤니티 개선 v1

## 개요

기존 커뮤니티의 UX 완성도를 높이고, 피드백 탭을 포트폴리오 서비스에 맞게 세분화한다.
MVP 시연 완성도를 올리기 위한 개선·추가·제거 항목을 포함한다.

---

## 사용자 스토리

- As a 방문자, I want to 게시글 목록에서 본문 발췌를 미리 볼 수 있도록, So that 클릭 전에 내용을 가늠할 수 있다.
- As a 로그인 사용자, I want to 내가 쓴 글과 북마크한 글을 모아볼 수 있도록, So that 내 활동을 한눈에 관리할 수 있다.
- As a 글 작성자, I want to 게시글에 이미지를 여러 장 첨부할 수 있도록, So that 포트폴리오를 충분히 보여줄 수 있다.
- As a 프로젝트/스터디 모집자, I want to 모집 상태를 직접 토글할 수 있도록, So that 모집이 끝났음을 알릴 수 있다.
- As a 커뮤니티 탐색자, I want to 인기순으로 글을 정렬하고 피드백 탭에서 직군·연차·AI분석 여부로 필터링할 수 있도록, So that 내게 맞는 글을 빠르게 찾을 수 있다.
- As a 댓글 작성자, I want to 내 댓글을 수정할 수 있도록, So that 오타나 잘못된 내용을 고칠 수 있다.
- As a 채팅 참여자, I want to 읽은 메시지가 정확히 처리되도록, So that 읽지 않은 메시지 배지가 올바르게 표시된다.

---

## 기능 요구사항

### FR-0: 마이페이지 레이아웃 개선

**문제**: 현재 7개 탭이 가로 스크롤(`overflow-x-auto`)로 나열되어 있어 메뉴가 한눈에 들어오지 않음

**변경 방향**: 아티클 페이지와 동일한 사이드바 레이아웃으로 교체

- **데스크탑 (lg+)**: 좌측 사이드바 (`w-48 shrink-0`) + 우측 콘텐츠 (`flex gap-6`)
  - 사이드바 상단에 프로필 카드 축약본 (아바타 + 닉네임 + 직군)
  - 각 메뉴 항목을 세로 nav 버튼으로 표시 (아티클의 feed 목록과 동일한 스타일)
  - 메뉴 순서: 분석 기록 / 내가 쓴 글 / 내 댓글 / 좋아요한 글 / 저장한 글 / 저장한 아티클 / 최근 본 아티클
- **모바일**: 가로 스크롤 탭 유지 (현재 방식), 프로필 카드는 상단 풀 너비 유지

**프로필 카드**

- 데스크탑: 사이드바 상단에 아바타 + 닉네임 + 직군 배지 + "프로필 수정" 버튼 배치
- 모바일: 현재처럼 페이지 상단 풀 너비 카드 유지

### FR-1: 본문 발췌 표시

- `GET /api/posts` 응답에 `excerpt` 필드 포함 (본문 앞 80자, 이미 `createPostExcerpt()` 유틸 존재)
- `community/index.vue`에서 `post-card`에 `excerpt` prop 전달
- 카드에 최대 2줄 표시 (`line-clamp-2`)

### FR-3: 게시글 이미지 업로드 정책

**카테고리별 이미지 정책**

- `feedback` (피드백): 최대 5장 (포트폴리오 전체를 보여줄 수 있도록)
- `project` (프로젝트 모집): 1장 유지
- `study` (스터디 모집): 1장 유지

**업로드 (write.vue)**

- 카테고리가 `feedback`일 때만 다중 업로드 UI 표시 (최대 5장)
- 카테고리가 `project`·`study`일 때는 기존 단일 업로드 유지
- 장당 5MB, jpg·png·gif·webp
- 피드백 다중 업로드: 업로드된 이미지 썸네일 나열 + 개별 삭제 버튼

**목록 (community/index.vue)**

- 첫 번째 이미지만 썸네일로 카드에 표시 (선택적, 현재 prop 존재)

**상세 (community/[id].vue)**

- `post-image-grid.vue` 그대로 사용 (이미 최대 10장 그리드 구현됨)
- 이미지 클릭 시 라이트박스 모달 (전체화면 확대, 좌우 화살표 탐색)

### FR-4: 모집 상태 토글

- 프로젝트·스터디 게시글 상세 페이지에서 작성자에게만 토글 버튼 표시
- `PATCH /api/posts/[id]` 에 `recruitmentStatus` 필드 추가
- 상태: `open` ↔ `closed`
- 토글 즉시 배지 반영 (Optimistic UI)

### FR-5: 인기순 정렬

- 커뮤니티 목록 상단에 정렬 옵션 추가: **최신순** (기본) / **인기순**
- 인기순 기준: `likeCount DESC, viewCount DESC`
- 쿼리 파라미터: `sort=popular`
- `GET /api/posts` 서버 라우트에 `sort` 파라미터 처리 추가

### FR-6: 피드백 탭 필터 개편

**DB 스키마 변경**

- `posts` 테이블에 필드 추가:
  - `jobType`: `text` (nullable, 피드백 게시글에만 사용)
  - `careerLevel`: `enum('entry', 'junior', 'mid', 'senior')` (nullable)

**직군 값 목록 (jobType)**

```
개발: frontend, backend, ios, android, fullstack, data, ai, devops
디자인: ux_ui, brand, motion
기획: pm
```

**연차 값 목록 (careerLevel)**

```
entry  → 신입 (0-1년)
junior → 주니어 (1-3년)
mid    → 미드 (3-5년)
senior → 시니어 (5년+)
```

**게시글 작성 (write.vue)**

- 카테고리가 `feedback`일 때 직군·연차 선택 드롭다운 표시 (필수)

**필터 UI (community/index.vue — 피드백 탭)**

- 기존 `개발자 / 디자이너` 필터 제거
- 직군 드롭다운 (전체 + 직군별)
- 연차 드롭다운 (전체 + 연차별)
- AI 분석 첨부 여부 토글: `hasAnalysis=true`
- 쿼리 파라미터: `jobType`, `careerLevel`, `hasAnalysis`

**서버 라우트**

- `GET /api/posts` 에 `jobType`, `careerLevel`, `hasAnalysis` 파라미터 처리 추가

### FR-7: 댓글 수정

- 댓글 아이템에 **수정** 버튼 추가 (본인 댓글만)
- 인라인 편집 UI: 댓글 내용이 textarea로 전환, 저장/취소 버튼
- `PATCH /api/posts/[id]/comments/[commentId]` 신규 엔드포인트
  - 본문: `{ content: string }`
  - 작성자 본인만 가능
  - `updatedAt` 갱신
- 수정된 댓글에 "(수정됨)" 표시

### FR-8: 채팅 읽음 처리 확인 및 수정

- `chat.vue` 진입 시 또는 채팅방 열 때 해당 방의 미읽음 메시지 `isRead = true` 일괄 처리
- `PATCH /api/chats/[id]/read` 신규 엔드포인트 (또는 메시지 목록 조회 시 자동 처리)
- 채팅방 목록의 읽지 않은 메시지 배지가 읽음 처리 후 즉시 사라지도록

### FR-9: 채팅 UX 개선

**메시지 날짜 구분선**

- 날짜가 바뀌는 지점마다 구분선 + 날짜 표시 (오늘 / 어제 / 5월 27일 형식)
- 클라이언트에서 메시지 리스트 렌더링 시 날짜 그룹핑 처리

**보낸 메시지 읽음 표시**

- 내가 보낸 메시지에 `isRead = true`가 되면 "읽음" 텍스트 표시 (우측 하단, 카카오톡 스타일)
- 실시간 반영: 상대방이 읽는 순간 업데이트

**DM 알림 딥링크**

- DM 알림 클릭 시 `/chat`으로 이동하면서 해당 채팅방 자동 선택
- 현재는 `/chat`만 이동하고 방 선택은 수동 — linkUrl에 `roomId` 쿼리 파라미터 포함 (`/chat?roomId=xxx`)
- `chat.vue` 진입 시 쿼리 파라미터 감지해 해당 방 자동 선택

### FR-10: 알림 전체 페이지

**현재 문제**: 팝오버(`max-h-80`)에 4~5개만 표시, 오래된 알림 확인 불가

**변경**

- 팝오버 하단에 "전체 알림 보기" 링크 추가 → `/notifications`
- `/notifications` 페이지 신규 추가 (로그인 필수)
  - 전체 알림 목록 (무한 스크롤 or 페이지네이션)
  - 알림 타입별 아이콘 (댓글/좋아요/분석/아티클)
  - "모두 읽음" 버튼
  - DM 알림은 제외 (채팅 아이콘으로 분리된 기존 구조 유지)
- 또는 마이페이지(`/my`) 탭에 "알림" 추가 — 어느 쪽이든 기술적 차이 없음

### FR-11: 커뮤니티 상세 페이지 모집 상태 배지

- 프로젝트/스터디 게시글 상세 페이지에 모집 상태 배지 표시 (현재 카드에만 있고 상세엔 없음)
- FR-4(모집 상태 토글)와 같이 구현

---

## 비기능 요구사항

- NFR-1 (성능): 이미지 업로드는 Supabase Storage 사용, 클라이언트에서 직접 업로드 후 URL만 서버 저장
- NFR-2 (보안): 댓글 수정·모집 상태 변경은 서버에서 작성자 본인 확인 필수
- NFR-3 (UX): 모든 상태 변경은 Optimistic UI 적용, 실패 시 롤백

---

## 비목표 (NOT to build)

- 게시글 본문 중간 이미지 삽입 (이미지는 하단 갤러리만)
- 이미지 순서 드래그 정렬
- 댓글 좋아요
- 피드백 탭 직군 태그 다중 선택 (단일 선택만)
- D 옵션 (게시글 태그 다중 선택 시스템) — 나중에 재검토
- 인기순 기간 필터 (오늘/주간/전체) — 나중에

---

## 가정 (Assumptions)

- 이미지 라이트박스는 신규 컴포넌트로 구현 (`image-lightbox.vue`)
- `jobType` / `careerLevel`은 피드백 게시글 작성 시 필수값
- 채팅 읽음 처리는 채팅방 진입 시 자동으로 일괄 처리 (개별 메시지 단위 아님)
- `내 활동` 페이지 진입은 헤더 유저 메뉴에서 추가

---

### FR-12: 버그 수정 및 소규모 UX 개선

**DM 알림 linkUrl 버그 (버그)**

- `server/api/chats/[id]/messages.post.ts` 에서 DM 알림 생성 시 `linkUrl: '/chat'` 으로만 설정됨
- `chat.vue`에는 `route.query.roomId` 처리 코드가 이미 있어 딥링크 준비 완료
- 수정: `linkUrl: '/chat?roomId=${roomId}'` 로 변경 (roomId는 채팅방 id)

**댓글 삭제 확인 (UX)**

- 현재 댓글 삭제 버튼 클릭 시 즉시 삭제 — 되돌릴 수 없음
- 수정: 간단한 인라인 확인 ("삭제할까요? [확인] [취소]") 또는 소형 confirm 다이얼로그

**채팅방 나가기 확인 (UX)**

- LogOut 버튼 클릭 시 확인 없이 즉시 채팅방 나감
- 수정: 현재 게시글 삭제처럼 확인 모달 추가 ("채팅방을 나가면 대화 내용이 사라져요")

**채팅 입력창 멀티라인 (UX)**

- 현재 단일 라인 `<input>` — 긴 메시지 입력 시 불편
- 수정: `<textarea>` (최대 3줄 자동 높이 조절), Enter 전송 / Shift+Enter 줄바꿈

**프로필 직군 세분화 (FR-6 연계)**

- `my.vue` 프로필 수정 모달의 직군 선택이 developer/designer 2개뿐
- DB `users.jobType` enum도 2개뿐 — FR-6의 세분화된 직군(frontend/backend/ios/android 등)으로 확장 필요
- FR-6 구현 시 함께 처리: users 테이블 jobType enum 확장 + 프로필 수정 UI 업데이트
- 연차(careerLevel)도 프로필에 추가 (FR-6의 posts.careerLevel과 동일한 값 사용)

**게시글 수정 시 다중 이미지 (FR-3 연계)**

- `community/[id].vue` 수정 모드에서 `PostImageUploader`(단일)를 사용
- 피드백 카테고리인 경우 다중 업로더로 교체 필요 (FR-3과 함께 처리)

---

## 결정된 사항

- 이미지 라이트박스: 외부 라이브러리 없이 shadcn-vue Dialog 활용해 직접 구현 (`image-lightbox.vue`)
- 내 활동 페이지: `/my` 이미 존재 — FR-2 불필요
- 기존 피드백 글 `jobType`/`careerLevel` 없는 경우: 목록에는 표시, 필터 적용 시 해당 필드 없는 글은 제외 (필터 선택 안 하면 전체 표시)
