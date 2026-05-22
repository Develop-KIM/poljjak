# 스펙: 기술 블로그 & IT 아티클 자동 수집

> 기반 요구사항: requirements-articles.md

## 목표 (한 문장)

RSS 피드를 Supabase pg_cron으로 6시간마다 자동 수집해 아티클 탭에서 국내·해외 기술 글을 북마크와 함께 제공한다.

## 인수 기준

- AC-1: 헤더에 "아티클" 탭이 있고, 클릭 시 `/articles`로 이동한다
- AC-2: `/articles` 페이지에 "국내" / "해외" 탭이 있고, 각 탭은 최신순 아티클 카드를 보여준다
- AC-3: 카드에 블로그명, 제목, 발행일이 표시된다
- AC-4: 카드 클릭 시 원문 URL이 새 탭으로 열린다
- AC-5: 로그인 사용자는 카드의 북마크 버튼으로 저장·해제할 수 있다
- AC-6: 마이페이지에 "저장한 아티클" 섹션이 생기고, 북마크한 아티클 목록이 나온다
- AC-7: `POST /api/cron/articles`를 호출하면 RSS 피드 10개를 순회해 새 아티클을 DB에 저장한다
- AC-8: 이미 존재하는 URL은 중복 삽입하지 않는다
- AC-9: RSS 파싱 실패 시 해당 피드만 건너뛰고 나머지는 계속 수집한다
- AC-10: 90일 이상 된 아티클은 크론 실행 시 자동 삭제된다
- AC-11: 비로그인 사용자도 아티클 목록을 볼 수 있다

## 기술 결정

- RSS 파싱: `rss-parser` (RSS + Atom 모두 지원)
- 크론 실행: Supabase pg_cron + pg_net (Vercel 무료 플랜 일 1회 제한 우회)
- 크론 보안: 기존 `requireCronAuth()` 재사용
- 페이지네이션: 오프셋 기반 (posts와 동일)
- 캐시: 비로그인 요청만 HTTP 캐시

**DB 스키마 추가:**

```
articles: id, feedName, category(domestic|international), title, url(UNIQUE), summary, publishedAt, collectedAt
article_bookmarks: id, articleId, userId, createdAt / UNIQUE(articleId, userId)
```

## 태스크 분해

### T1: DB 스키마 (30분) — 의존: 없음
### T2: RSS 수집 유틸 + 크론 API (90분) — 의존: T1
### T3: 아티클 목록 API (45분) — 의존: T1
### T4: 아티클 북마크 API (30분) — 의존: T1
### T5: 아티클 페이지 UI (90분) — 의존: T3, T4
### T6: 헤더 + 마이페이지 연동 (30분) — 의존: T5
### T7: Supabase pg_cron 설정 안내 (30분) — 의존: T2

## 비목표

- 번역 기능
- 아티클 본문 크롤링·저장
- 좋아요 / 댓글
- 관리자 피드 소스 관리 UI
- 아티클 내 검색
- 개인화 추천

## 검증 시나리오

1. 크론 API 수동 호출 → DB에 국내·해외 아티클 삽입 확인
2. 비로그인으로 `/articles` 접속 → 국내 탭에 카드 표시, 클릭 시 새 탭 이동
3. 로그인 후 북마크 → 새로고침 후 유지 → 마이페이지 목록 확인
4. 크론 두 번 실행 → 아티클 수 동일 (중복 없음)
5. 유효하지 않은 피드 URL → 나머지 피드 정상 수집
