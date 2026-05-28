# 스펙: 포트폴리오 분석 v2

> 기반 요구사항: requirements-portfolio-analysis-v2.md

## 목표 (한 문장)

포트폴리오 PDF를 업로드하면 직군·연차 맞춤 AI 분석을 수행하고, 원본(Before)과 AI 개선본(After) 분할 뷰어로 우선순위 기반 이슈와 액션 플랜을 제공한다.

---

## 인수 기준

- AC-1: 직군 5가지(FE/BE/풀스택/DevOps/ML) × 연차 3단계(신입/주니어/시니어) 선택 후 분석 요청 가능
- AC-2: 분석 결과 페이지에서 좌측에 원본 PDF, 우측에 AI 개선 HTML이 나란히 표시된다
- AC-3: 우측 After에서 변경된 문장에 hover 시 "무엇이 왜 바뀌었는지" 말풍선이 표시된다
- AC-4: 좌/우 스크롤이 동기화된다
- AC-5: 이슈 목록이 개수 제한 없이 우선순위(높음/중간/낮음) 순으로 표시된다
- AC-6: 액션 플랜 체크리스트가 제공되고 체크 상태가 유지된다
- AC-7: 이전 분석 결과와 현재 결과를 비교하는 뷰가 존재한다
- AC-8: JD URL(원티드·사람인) 입력 시 해당 공고 내용과 포트폴리오를 비교한 리포트가 생성된다
- AC-9: 분석 결과 공개 시 이름·이메일·전화·주소·링크가 자동 마스킹되고, 사용자가 확인 후 공개할 수 있다
- AC-10: 공개 시 포트폴리오 내 이미지에서 얼굴이 감지되면 자동 블러 처리되고, 사용자가 이미지별로 블러 여부를 수동 조정할 수 있다
- AC-11: After 뷰어에서 "PDF로 저장" 버튼 클릭 시 개선본 HTML이 PDF 파일로 다운로드된다

---

## 기술 결정

| 항목                | 선택                          | 이유                                                |
| ------------------- | ----------------------------- | --------------------------------------------------- |
| PDF 렌더링 (Before) | `vue-pdf-embed` (PDF.js 래퍼) | Nuxt/Vue 생태계, SSR 호환, iframe보다 제어 용이     |
| After 렌더링        | AI 응답 JSON → Vue 컴포넌트   | 변경 위치 추적·hover 이벤트 제어 가능               |
| 동기 스크롤         | `scroll` 이벤트 + 비율 계산   | 두 패널 높이가 다를 수 있어 비율 기반 동기화        |
| JD 크롤링           | Nitro server route + cheerio  | 원티드·사람인 HTML 파싱, SSRF 방지 화이트리스트     |
| 익명화 (텍스트)     | 정규식 1차 + CLOVA 2차        | 이메일·전화는 정규식, 이름·주소는 AI 보조           |
| 익명화 (얼굴)       | `face-api.js` + canvas blur   | 클라이언트사이드 얼굴 감지, 이미지별 블러 토글      |
| After PDF 저장      | `html2canvas` + `jsPDF`       | 클라이언트사이드 처리 — Vercel에서 puppeteer 불필요 |
| 분석 AI             | CLOVA HCX-005 (기존 유지)     | 직군·연차별 시스템 프롬프트 분리 관리               |

### DB 스키마 변경

```sql
-- analyses 테이블에 추가
ALTER TABLE analyses ADD COLUMN job_role TEXT;         -- 'frontend' | 'backend' | 'fullstack' | 'devops' | 'ml'
ALTER TABLE analyses ADD COLUMN seniority TEXT;        -- 'junior' | 'mid' | 'senior'
ALTER TABLE analyses ADD COLUMN after_html TEXT;       -- AI 개선본 HTML
ALTER TABLE analyses ADD COLUMN issues JSONB;          -- 우선순위 이슈 배열
ALTER TABLE analyses ADD COLUMN action_plan JSONB;     -- 체크리스트
ALTER TABLE analyses ADD COLUMN checked_items TEXT[];  -- 체크 완료 항목 IDs
ALTER TABLE analyses ADD COLUMN jd_url TEXT;           -- JD 비교 URL
ALTER TABLE analyses ADD COLUMN jd_comparison JSONB;   -- JD 비교 결과
```

### AI 응답 구조 (새 포맷)

```json
{
  "summary": "전반적 총평 2~3문장",
  "totalScore": 78,
  "issues": [
    {
      "id": "issue_1",
      "priority": "high",
      "section": "프로젝트",
      "title": "성과 수치 없음",
      "description": "3개 프로젝트 중 수치화된 성과가 없어 임팩트 전달이 어렵습니다",
      "originalText": "냉장고에 보유한 재료를 기반으로 레시피를 추천하는 웹 서비스 개발",
      "improvedText": "냉장고 재료 기반 레시피 추천 서비스를 개발하여 사용자 만족도 20% 향상"
    }
  ],
  "actionPlan": [
    {
      "id": "action_1",
      "priority": "high",
      "task": "프로젝트마다 수치 성과 추가",
      "linkedIssueIds": ["issue_1"]
    }
  ],
  "afterHtmlSections": [
    {
      "sectionName": "프로젝트",
      "html": "<section>...</section>",
      "changes": [
        {
          "issueId": "issue_1",
          "selector": "#proj-1-desc",
          "tooltip": "성과 수치를 추가해 임팩트를 강조했어요"
        }
      ]
    }
  ]
}
```

---

## 태스크 분해

### T1: 직군·연차 선택 UI + 프롬프트 분리 (1.5h)

- 분석 시작 화면에 직군 5가지 + 연차 3단계 선택 추가
- `server/prompts/` 디렉토리에 직군×연차 조합별 시스템 프롬프트 파일 관리
- DB `analyses` 테이블에 `job_role`, `seniority` 컬럼 추가
- 검증: 각 조합 선택 후 분석 요청 시 해당 프롬프트로 분기되는지 확인
- 의존: 없음

### T2: AI 응답 포맷 재설계 + 프롬프트 재작성 (2h)

- 기존 JSON 스키마 → 새 포맷(issues 배열 + actionPlan + afterHtmlSections)으로 변경
- 뻔한 코멘트 방지: 프롬프트에 "원문 문장을 직접 인용하고 구체적으로 수정" 지시 추가
- `analyses` 테이블에 `issues`, `action_plan`, `after_html` 컬럼 추가
- 검증: 실제 PDF로 새 포맷 응답 확인
- 의존: T1

### T3: Before/After 분할 뷰어 (2h)

- `vue-pdf-embed` 설치 및 좌측 PDF 렌더링
- 우측 After: AI 응답 `afterHtmlSections`를 Vue 컴포넌트로 렌더링
- 변경된 문장에 `data-issue-id` 속성 부여 → hover 시 tooltip 표시
- 좌/우 동기 스크롤 (`scroll` 이벤트 비율 기반)
- 검증: 실제 PDF 업로드 후 분할 뷰어 정상 표시, hover tooltip 확인
- 의존: T2

### T4: 이슈 목록 + 액션 플랜 UI (1h)

- 이슈 목록: 우선순위(높음/중간/낮음) 순 정렬, 개수 제한 없음
- 이슈 클릭 시 After 뷰어의 해당 위치로 스크롤
- 액션 플랜 체크리스트: 체크 상태 DB 저장 (`checked_items` 컬럼)
- 검증: 체크 후 페이지 새로고침해도 상태 유지
- 의존: T2, T3

### T5: 이전 분석 비교 뷰 (1h)

- 분석 이력 목록에서 두 버전 선택 → 점수 변화 + 해결된/신규 이슈 비교
- `totalScore` diff, `issues` 추가/해결 항목 표시
- 검증: 같은 포트폴리오로 2회 분석 후 비교 화면 정상 동작
- 의존: T2

### T6: JD 비교 기능 (1.5h)

- 분석 결과 페이지에 "채용공고와 비교" 버튼 + URL 입력
- `POST /api/analyses/[id]/jd-compare` 엔드포인트
  - 원티드·사람인 URL 화이트리스트 검증
  - cheerio로 JD 텍스트 추출
  - CLOVA에 포트폴리오 요약 + JD 텍스트 넘겨 갭 분석
- 결과: "이 포지션 기준 부족한 항목" 목록
- 검증: 원티드 공고 URL로 비교 요청 시 정상 응답
- 의존: T2

### T7: 공개 시 텍스트 개인정보 익명화 (1h)

- 공개 토글 클릭 시 익명화 미리보기 모달
- 정규식으로 이메일·전화·URL 1차 마스킹
- CLOVA로 이름·주소 등 2차 마스킹
- 사용자가 추가 항목 수동 지정 가능
- 검증: 샘플 PDF에서 이름·이메일·링크 마스킹 확인
- 의존: T3

### T8: 얼굴 사진 감지 마스킹 (1h)

- `face-api.js` 설치 및 클라이언트사이드 얼굴 감지 모델 로드 (`<ClientOnly>`)
- After HTML 내 `<img>` 태그 목록 추출 → 각 이미지에 face detection 실행
- 얼굴 감지된 이미지에 canvas blur 오버레이 적용
- 감지 실패 fallback: 포트폴리오 내 모든 이미지 목록을 사용자에게 보여주고 블러 토글 제공
- 검증: 프로필 사진 포함 포트폴리오에서 얼굴 영역 블러 처리 확인
- 의존: T7

### T9: After HTML → PDF 다운로드 (1h)

- `html2canvas` + `jsPDF` 설치
- After 뷰어 패널 DOM을 canvas로 캡처 → PDF 변환
- 다운로드 파일명: `portfolio-improved-{날짜}.pdf`
- 로딩 상태 표시 (캡처 시간 소요)
- 검증: After 뷰어에서 "PDF로 저장" 클릭 시 PDF 파일 다운로드 확인
- 의존: T3

---

## 비목표

- 원티드·사람인 외 JD 사이트 지원
- 디자이너 직군 세부 분석
- 실시간 스트리밍 분석
- 서버사이드 PDF 생성 (puppeteer / headless Chrome)

---

## 리스크 / 의존성

- `vue-pdf-embed` 가 Nuxt 4 SSR과 호환되지 않을 수 있음 → `<ClientOnly>` 래핑으로 대응
- CLOVA 응답에 `afterHtmlSections` 포함 시 토큰 사용량 대폭 증가 → 응답 길이 모니터링 필요
- 원티드·사람인 HTML 구조 변경 시 크롤러 깨짐 → 파싱 실패 시 텍스트 붙여넣기 fallback 필수

---

## 검증 시나리오

- **시나리오 1**: 프론트엔드/신입 선택 → PDF 업로드 → 분석 완료 → 분할 뷰어에서 원본과 개선본 확인 → 이슈 클릭 시 해당 위치 스크롤
- **시나리오 2**: 분석 2회 후 "이전 분석과 비교" → 점수 변화 및 해결된 이슈 확인
- **시나리오 3**: 원티드 공고 URL 입력 → JD 비교 리포트 생성
- **시나리오 4**: 공개 토글 → 텍스트 익명화 미리보기 + 얼굴 사진 블러 확인 → 확인 후 공개
- **시나리오 5**: After 뷰어 → "PDF로 저장" 클릭 → 개선본 PDF 파일 다운로드
