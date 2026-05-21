# 스펙: 데이터베이스 스키마

> 기반 스펙: `001-pojjak-mvp.md`, `002-design-system-and-wireframes.md`

## 목표

Drizzle ORM으로 Supabase Postgres 스키마를 정의하고, `npm run db:push`로 실제 DB에 반영한다.
모든 테이블은 `server/db/schema/` 아래 도메인별로 분리한다.

---

## 파일 구조

```
server/db/
├── index.ts          # db 클라이언트 (이미 존재)
├── schema/
│   ├── index.ts      # 전체 re-export
│   ├── users.ts
│   ├── analyses.ts
│   ├── posts.ts
│   ├── comments.ts
│   ├── likes.ts
│   ├── chats.ts
│   ├── notifications.ts
│   └── reports.ts
└── migrations/       # drizzle-kit generate 결과물
```

---

## 테이블 상세

### users

카카오·구글 OAuth로 가입한 회원. Supabase Auth의 `auth.users`와 1:1 매핑.

| 컬럼                    | 타입                             | 설명                                       |
| ----------------------- | -------------------------------- | ------------------------------------------ |
| id                      | uuid PK                          | `auth.users.id`와 동일값                   |
| kakao_id                | text UNIQUE NOT NULL             | OAuth provider ID. 기존 컬럼명 유지        |
| nickname                | text NOT NULL                    | OAuth 닉네임 (온보딩에서 변경 가능)        |
| email                   | text                             | OAuth 제공 이메일 (nullable)               |
| avatar_url              | text                             | 프로필 사진 URL. null이면 기본 이미지 사용 |
| job_type                | enum nullable                    | 직종. 온보딩 Step 2에서 설정               |
| onboarding_completed_at | timestamp                        | null이면 미완료 → `/onboarding` 리다이렉트 |
| last_login_at           | timestamp                        | 마지막 로그인 시각. 로그인마다 갱신        |
| created_at              | timestamp NOT NULL DEFAULT now() |                                            |
| updated_at              | timestamp NOT NULL DEFAULT now() |                                            |
| deleted_at              | timestamp                        | 탈퇴 신청일. 30일 후 실제 삭제 처리        |

`job_type` enum: `'developer' | 'designer'`
(개발자·디자이너 2종. 마이페이지에서 변경 가능. 온보딩 건너뛰면 null)

### analyses

AI 포트폴리오 분석 결과.

| 컬럼            | 타입                                                                         | 설명                            |
| --------------- | ---------------------------------------------------------------------------- | ------------------------------- |
| id              | uuid PK DEFAULT gen_random_uuid()                                            |                                 |
| user_id         | uuid FK → users.id NOT NULL                                                  |                                 |
| title           | text NOT NULL DEFAULT '포트폴리오 분석 결과'                                 |                                 |
| pdf_url         | text NOT NULL                                                                | Supabase Storage 경로           |
| additional_note | text                                                                         | 사용자 추가 요청사항            |
| status          | enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending' |                                 |
| result          | jsonb                                                                        | CLOVA Studio 분석 결과 전체     |
| is_public       | boolean NOT NULL DEFAULT false                                               | 공유 링크 공개 여부             |
| share_token     | text UNIQUE                                                                  | 공유 링크용 토큰 (공개 시 생성) |
| created_at      | timestamp NOT NULL DEFAULT now()                                             |                                 |
| updated_at      | timestamp NOT NULL DEFAULT now()                                             |                                 |

`result` jsonb 구조 (참고용):

```json
{
  "scores": [{ "title": "프로젝트 설명 명확성", "score": 7, "comment": "..." }],
  "summary": "종합 피드백 텍스트",
  "suggestions": [{ "before": "...", "after": "..." }]
}
```

### posts

커뮤니티 게시글 (피드백 / 프로젝트 모집 / 스터디 모집).

| 컬럼        | 타입                                        | 설명                                |
| ----------- | ------------------------------------------- | ----------------------------------- |
| id          | uuid PK DEFAULT gen_random_uuid()           |                                     |
| user_id     | uuid FK → users.id NOT NULL                 |                                     |
| category    | enum('feedback','project','study') NOT NULL |                                     |
| title       | text NOT NULL                               | 최대 100자                          |
| body        | text NOT NULL                               | 최대 5000자                         |
| analysis_id | uuid FK → analyses.id                       | 피드백 탭 분석 결과 첨부 (nullable) |
| created_at  | timestamp NOT NULL DEFAULT now()            |                                     |
| updated_at  | timestamp NOT NULL DEFAULT now()            |                                     |
| deleted_at  | timestamp                                   | 소프트 삭제                         |

### post_images

게시글 첨부 이미지 (최대 10장).

| 컬럼       | 타입                              | 설명                  |
| ---------- | --------------------------------- | --------------------- |
| id         | uuid PK DEFAULT gen_random_uuid() |                       |
| post_id    | uuid FK → posts.id NOT NULL       |                       |
| url        | text NOT NULL                     | Supabase Storage 경로 |
| order      | integer NOT NULL DEFAULT 0        | 표시 순서             |
| created_at | timestamp NOT NULL DEFAULT now()  |                       |

### comments

게시글 댓글.

| 컬럼       | 타입                              | 설명                               |
| ---------- | --------------------------------- | ---------------------------------- |
| id         | uuid PK DEFAULT gen_random_uuid() |                                    |
| post_id    | uuid FK → posts.id NOT NULL       |                                    |
| user_id    | uuid FK → users.id NOT NULL       |                                    |
| content    | text NOT NULL                     |                                    |
| created_at | timestamp NOT NULL DEFAULT now()  |                                    |
| updated_at | timestamp NOT NULL DEFAULT now()  |                                    |
| deleted_at | timestamp                         | 소프트 삭제 (삭제된 메시지 표시용) |

### likes

게시글 좋아요. 중복 방지를 위해 (post_id, user_id) UNIQUE 제약.

| 컬럼       | 타입                              | 설명 |
| ---------- | --------------------------------- | ---- |
| id         | uuid PK DEFAULT gen_random_uuid() |      |
| post_id    | uuid FK → posts.id NOT NULL       |      |
| user_id    | uuid FK → users.id NOT NULL       |      |
| created_at | timestamp NOT NULL DEFAULT now()  |      |

UNIQUE INDEX: (post_id, user_id)

### chat_rooms

1:1 채팅방. initiator_id < participant_id 로 정렬하여 중복 방지.

| 컬럼                | 타입                              | 설명                         |
| ------------------- | --------------------------------- | ---------------------------- |
| id                  | uuid PK DEFAULT gen_random_uuid() |                              |
| initiator_id        | uuid FK → users.id NOT NULL       | 정렬된 첫 번째 사용자        |
| participant_id      | uuid FK → users.id NOT NULL       | 정렬된 두 번째 사용자        |
| source_post_id      | uuid FK → posts.id                | DM 시작 게시글 (nullable)    |
| source_post_title   | text                              | DM 시작 게시글 제목 스냅샷   |
| initiator_left_at   | timestamp                         | 첫 번째 사용자의 나가기 시각 |
| participant_left_at | timestamp                         | 두 번째 사용자의 나가기 시각 |
| created_at          | timestamp NOT NULL DEFAULT now()  |                              |

UNIQUE INDEX: (initiator_id, participant_id)

### messages

1:1 채팅 메시지.

| 컬럼       | 타입                              | 설명                 |
| ---------- | --------------------------------- | -------------------- |
| id         | uuid PK DEFAULT gen_random_uuid() |                      |
| room_id    | uuid FK → chat_rooms.id NOT NULL  |                      |
| sender_id  | uuid FK → users.id NOT NULL       |                      |
| content    | text NOT NULL                     |                      |
| is_deleted | boolean NOT NULL DEFAULT false    | 삭제된 메시지 표시용 |
| created_at | timestamp NOT NULL DEFAULT now()  |                      |

### notifications

댓글·좋아요·DM 알림.

| 컬럼         | 타입                                 | 설명                                  |
| ------------ | ------------------------------------ | ------------------------------------- |
| id           | uuid PK DEFAULT gen_random_uuid()    |                                       |
| user_id      | uuid FK → users.id NOT NULL          | 수신자                                |
| type         | enum('comment','like','dm') NOT NULL |                                       |
| reference_id | uuid NOT NULL                        | 관련 리소스 ID (comment/like/message) |
| is_read      | boolean NOT NULL DEFAULT false       |                                       |
| created_at   | timestamp NOT NULL DEFAULT now()     |                                       |

### reports

신고 접수. MVP에서는 DB 저장만 수행하고, 관리자 페이지는 MVP 이후로 둔다.

| 컬럼        | 타입                              | 설명         |
| ----------- | --------------------------------- | ------------ |
| id          | uuid PK DEFAULT gen_random_uuid() |              |
| reporter_id | uuid FK → users.id NOT NULL       | 신고자       |
| target_type | enum('post','comment') NOT NULL   |              |
| target_id   | uuid NOT NULL                     | 신고 대상 ID |
| reason      | text NOT NULL                     |              |
| created_at  | timestamp NOT NULL DEFAULT now()  |              |

UNIQUE INDEX: (reporter_id, target_type, target_id)

---

## ERD (간략)

```
users
 ├─< analyses        (user_id)
 ├─< posts           (user_id)
 │    ├─< post_images (post_id)
 │    ├─< comments   (post_id)
 │    └─< likes      (post_id)
 ├─< comments        (user_id)
 ├─< likes           (user_id)
 ├─< chat_rooms      (initiator_id / participant_id)
 │    └─< messages   (room_id)
 ├─< notifications   (user_id)
 └─< reports         (reporter_id)

posts ──> analyses   (analysis_id, nullable)
```

---

## Drizzle 구현 규칙

- `pgTable`, `pgEnum` 사용
- 모든 테이블에 `createdAt`, `updatedAt` 포함
- 소프트 삭제 테이블(users, posts, comments)은 `deletedAt` 포함
- enum은 파일 상단에 `pgEnum`으로 먼저 정의
- FK는 `.references(() => table.column, { onDelete: 'cascade' })` 명시
- `server/db/schema/index.ts`에서 모든 테이블·enum re-export

---

## RLS 정책 요약

> Supabase RLS는 `npm run db:push` 이후 Supabase 대시보드 또는 SQL로 별도 적용.

| 테이블        | SELECT                               | INSERT               | UPDATE | DELETE        |
| ------------- | ------------------------------------ | -------------------- | ------ | ------------- |
| users         | 본인만 전체 조회, 타인은 공개 필드만 | auth.uid() 일치      | 본인만 | 소프트 삭제만 |
| analyses      | 본인 전체 + is_public=true 공개      | 본인만               | 본인만 | 본인만        |
| posts         | 전체 (피드백은 로그인 유저만)        | 로그인 유저          | 본인만 | 소프트 삭제   |
| comments      | 전체                                 | 로그인 유저          | 본인만 | 소프트 삭제   |
| likes         | 전체                                 | 로그인 유저          | -      | 본인만        |
| chat_rooms    | 참여 유저만                          | 로그인 유저          | -      | -             |
| messages      | 해당 room 참여자만                   | 참여 유저            | -      | -             |
| notifications | 본인만                               | 시스템(service role) | 본인만 | -             |
| reports       | 본인만                               | 로그인 유저          | -      | -             |

---

## 인수 기준

- AC-1: `npm run db:push` 실행 시 에러 없이 Supabase DB에 테이블이 생성된다.
- AC-2: `npm run db:generate` 실행 시 `server/db/migrations/` 에 마이그레이션 파일이 생성된다.
- AC-3: 모든 FK에 `onDelete: 'cascade'` 또는 적절한 정책이 명시된다.
- AC-4: `server/db/schema/index.ts`에서 모든 테이블과 enum을 import할 수 있다.
- AC-5: TypeScript strict 모드에서 타입 에러 없이 컴파일된다.

---

## 비목표

- RLS SQL 직접 작성 (이 스펙 범위 외, 별도 진행)
- Supabase Storage 버킷 설정
- 실제 데이터 시딩
