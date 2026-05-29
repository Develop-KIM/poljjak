# 스펙: 공개 갤러리

> 기반 요구사항: requirements-gallery.md

## 목표 (한 문장)

`isPublic = true`인 포트폴리오 분석 결과를 카드 갤러리로 노출해, 비회원 포함 누구나 타인의 AI 분석 결과를 탐색할 수 있게 한다.

## 인수 기준

- AC-1: `/gallery` 페이지는 비로그인 상태에서 접근 가능하다.
- AC-2: 카드가 20개씩 로드되고, 스크롤이 하단에 닿으면 다음 20개가 자동 추가된다.
- AC-3: 직군 필터 클릭 시 해당 직군 분석만 표시된다. "전체" 클릭 시 초기화.
- AC-4: 연차 필터 클릭 시 해당 연차 분석만 표시된다.
- AC-5: 카드에 PDF 첫 페이지 썸네일, 직군/연차 뱃지, AI 총평 2줄, 이슈 개수가 표시된다.
- AC-6: 카드 클릭 시 `/analysis/share/:token` 으로 이동한다.
- AC-7: `shareToken`이 null이거나 `isPublic = false`인 분석은 API가 반환하지 않는다.
- AC-8: 네비게이션에 "갤러리" 메뉴가 추가된다 (데스크탑 + 모바일 햄버거 메뉴 둘 다).
- AC-9: 랜딩 페이지에 최신 공개 분석 6개 프리뷰 섹션이 추가된다.
- AC-10: 데스크탑 3열 · 태블릿 2열 · 모바일 1열 그리드로 표시된다.

## 기술 결정

- API: Nitro server route `GET /api/gallery` — 커서 기반 페이지네이션
- 무한 스크롤: IntersectionObserver 직접 구현
- PDF 썸네일: vue-pdf-embed `:page="1"` + ClientOnly + lazy 렌더링
- DB 스키마 변경: 없음

## 태스크 분해

### T1: 갤러리 API 라우트 (45분)

- server/api/gallery/index.get.ts
- 의존: 없음

### T2: GalleryCard 컴포넌트 (60분)

- app/components/product/gallery-card.vue
- 의존: T1

### T3: 갤러리 페이지 (90분)

- app/pages/gallery.vue
- 의존: T1, T2

### T4: 네비게이션 메뉴 추가 (20분)

- app/layouts/default.vue
- 의존: T3

### T5: 랜딩 페이지 갤러리 섹션 (60분)

- app/pages/index.vue
- 의존: T1, T2

## 비목표

- 갤러리 전용 좋아요, 댓글
- 키워드 검색
- 조회수 카운트
- PDF 썸네일 서버사이드 생성
- isPublic과 별도 갤러리 노출 옵션
