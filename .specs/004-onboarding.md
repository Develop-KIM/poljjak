# 스펙: 온보딩

> 기반 스펙: `001-pojjak-mvp.md`, `003-database-schema.md`

## 목표

카카오 OAuth 로그인 직후 신규 사용자 또는 재가입 사용자에게 온보딩 화면을 표시한다.
닉네임·직종·프로필 이미지를 설정하고 나면 서비스 본 화면으로 진입한다.

---

## 온보딩 진입 조건

| 조건                                        | 처리                              |
| ------------------------------------------- | --------------------------------- |
| `users.onboarding_completed_at IS NULL`     | `/onboarding` 으로 리다이렉트     |
| `users.onboarding_completed_at IS NOT NULL` | 이전 방문 경로 또는 홈으로 이동   |
| 탈퇴 신청 후 30일 미경과 재로그인           | 계정 복원 후 홈으로 (온보딩 생략) |
| 탈퇴 30일 경과 후 재가입                    | 신규 계정으로 온보딩 진행         |

**구현 방식**: `server/middleware/onboarding.ts` 또는 `app/middleware/onboarding.ts` 에서
`onboarding_completed_at` 확인 후 미완료 시 `/onboarding` 으로 redirect.

---

## 온보딩 흐름 (2단계)

```
[카카오 로그인 완료]
        ↓
[Step 1] 프로필 설정
  - 프로필 이미지 (기본 이미지 제공, 변경 가능)
  - 닉네임 (카카오 닉네임 pre-fill, 수정 가능)
        ↓
[Step 2] 직종 선택
  - 9개 직종 카드 중 1개 선택
  - "나중에 설정" 옵션 제공 (건너뛰기 가능)
        ↓
[완료] onboarding_completed_at 기록 → 홈 이동
```

---

## 직종 목록

| value       | label                |
| ----------- | -------------------- |
| `frontend`  | 프론트엔드 개발자    |
| `backend`   | 백엔드 개발자        |
| `fullstack` | 풀스택 개발자        |
| `mobile`    | iOS / Android 개발자 |
| `designer`  | UI/UX 디자이너       |
| `data`      | 데이터 엔지니어      |
| `devops`    | DevOps / 인프라      |
| `pm`        | 기획 / PM            |
| `other`     | 기타                 |

---

## DB 변경 사항

`users` 테이블에 아래 2개 컬럼 추가 (→ `003-database-schema.md` 업데이트 반영).

| 컬럼                      | 타입               | 설명                                             |
| ------------------------- | ------------------ | ------------------------------------------------ |
| `job_type`                | enum nullable      | 온보딩 Step 2에서 설정. 마이페이지에서 변경 가능 |
| `onboarding_completed_at` | timestamp nullable | null이면 온보딩 미완료로 판단                    |

직종 enum:

```
'frontend' | 'backend' | 'fullstack' | 'mobile' | 'designer' | 'data' | 'devops' | 'pm' | 'other'
```

---

## 기본 프로필 이미지

- 경로: `/images/default-avatar.svg`
- 신규 가입 시 `avatar_url` 미지정이면 클라이언트에서 기본 이미지로 대체
- 사용자가 이미지를 업로드하면 Supabase Storage에 저장 후 `avatar_url` 업데이트

---

## 유효성 검증

| 필드          | 규칙                                            |
| ------------- | ----------------------------------------------- |
| 닉네임        | 2~20자, 특수문자 제한 (한글·영문·숫자·`_` 허용) |
| 프로필 이미지 | jpg / png / webp, 5MB 이하                      |
| 직종          | 위 9개 중 1개 또는 null (건너뛰기)              |

---

## 화면 구성

### Step 1 — 프로필 설정

- 상단 진행 표시: `1 / 2`
- 프로필 이미지 원형 영역 (클릭 → 파일 선택)
  - 기본값: `/images/default-avatar.svg`
  - 선택 시 미리보기
- 닉네임 입력 필드
  - placeholder: 카카오 닉네임
  - 글자 수 표시 (2~20자)
- 다음 버튼

### Step 2 — 직종 선택

- 상단 진행 표시: `2 / 2`
- 제목: "어떤 분야에서 일하고 계신가요?"
- 부제: "포트폴리오 분석에 더 맞는 피드백을 드릴게요."
- 직종 카드 3열 그리드 (아이콘 + 텍스트)
- 선택 시 카드 강조
- "완료" 버튼 (직종 미선택 시에도 활성)
- "나중에 설정" 텍스트 링크

---

## 인수 기준

- AC-1: 신규 로그인 사용자는 `/onboarding` 으로 자동 리다이렉트된다.
- AC-2: `onboarding_completed_at` 이 설정된 사용자는 온보딩을 건너뛴다.
- AC-3: Step 1에서 닉네임이 2자 미만이면 다음 버튼이 비활성화된다.
- AC-4: Step 2에서 직종 미선택 후 "나중에 설정"을 눌러도 완료 처리된다.
- AC-5: 완료 시 `onboarding_completed_at` 이 기록되고 홈으로 이동한다.
- AC-6: 마이페이지에서 닉네임·직종·프로필 이미지를 다시 변경할 수 있다.

---

## 비목표

- 직종 복수 선택
- 이메일·전화번호 추가 수집
- 관심 기술 스택 선택 (MVP 이후)
- 온보딩 완료율 트래킹
