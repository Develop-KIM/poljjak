# 요구사항: 기술 블로그 & IT 아티클 자동 수집

## 개요

RSS 피드를 6시간마다 자동으로 수집해 국내 기술 블로그와 해외 IT 아티클을 한곳에서 볼 수 있는 "아티클" 탭을 제공한다.
포트폴리오 준비 중인 취준생·주니어 개발자가 별도 탭 없이 폴짝 안에서 최신 기술 트렌드를 소비할 수 있도록 한다.
클릭 시 원문 사이트로 이동하며, 북마크로 나중에 다시 볼 수 있다.

## 사용자 스토리

- As a 취준 개발자, I want to 국내외 기술 블로그 글을 한 곳에서 보고 싶다, So that 여러 사이트를 돌아다니지 않아도 된다.
- As a 로그인 사용자, I want to 마음에 드는 아티클을 북마크하고 싶다, So that 나중에 마이페이지에서 다시 볼 수 있다.
- As a 비로그인 사용자, I want to 아티클 목록을 볼 수 있다, So that 서비스의 가치를 먼저 경험할 수 있다.

## 수집 대상 RSS 피드

### 국내 (domestic)
| 이름 | RSS URL |
|------|---------|
| 카카오 기술 블로그 | https://tech.kakao.com/feed/ |
| 토스 기술 블로그 | https://toss.tech/rss.xml |
| 우아한형제들 기술 블로그 | https://techblog.woowahan.com/feed/ |
| 네이버 D2 | https://d2.naver.com/d2.atom |
| 라인 기술 블로그 | https://engineering.linecorp.com/ko/feed/ |
| 쿠팡 기술 블로그 | https://medium.com/feed/coupang-engineering |

### 해외 (international)
| 이름 | RSS URL |
|------|---------|
| Hacker News (Best) | https://news.ycombinator.com/rss |
| dev.to | https://dev.to/feed |
| CSS-Tricks | https://css-tricks.com/feed/ |
| Smashing Magazine | https://www.smashingmagazine.com/feed/ |

## 기능 요구사항

- FR-1: 헤더 네비게이션에 "아티클" 탭이 추가된다 (분석 / 커뮤니티 / 아티클)
- FR-2: 아티클 목록 페이지는 "국내" / "해외" 탭으로 구분된다
- FR-3: 각 탭은 최신순으로 정렬된 아티클 카드 목록을 보여준다 (무한 스크롤 또는 페이지네이션)
- FR-4: 아티클 카드에는 출처(블로그명), 제목, 발행일이 표시된다
- FR-5: 아티클 카드 클릭 시 원문 사이트로 새 탭에서 이동한다
- FR-6: 로그인 사용자는 아티클에 북마크를 토글할 수 있다
- FR-7: 마이페이지 "저장한 아티클" 섹션에서 북마크한 아티클 목록을 볼 수 있다
- FR-8: 크론 잡이 6시간마다 모든 피드를 순회하며 새 아티클을 수집한다
- FR-9: 동일한 URL이 이미 존재하면 중복 삽입하지 않는다 (upsert 또는 URL unique 제약)
- FR-10: 피드 소스는 코드에 하드코딩으로 관리한다 (관리자 UI 없음)
- FR-11: 비로그인 사용자도 아티클 목록을 열람할 수 있다

## 비기능 요구사항

- NFR-1 (성능): 아티클 목록 API는 비로그인 요청에 한해 HTTP 캐시 적용 (posts와 동일 패턴)
- NFR-2 (안정성): RSS 파싱 실패 시 해당 피드만 건너뛰고 나머지 피드는 계속 수집한다
- NFR-3 (보안): 크론 엔드포인트는 CRON_SECRET Bearer 인증으로 보호한다
- NFR-4 (용량): 아티클은 최근 90일치만 보관, 크론 실행 시 오래된 항목 정리

## 비목표 (NOT to build)

- 번역 기능 (제목·본문 한국어 번역 없음)
- 아티클 본문 저장 (제목·URL·메타정보만 저장, 본문 크롤링 없음)
- 좋아요 / 댓글
- 관리자 피드 소스 관리 UI
- 아티클 내 검색
- 알림 (새 아티클 도착 알림)
- 개인화 추천

## 가정 (Assumptions)

- 수집 대상 블로그들은 유효한 RSS/Atom 피드를 제공한다
- Vercel 크론 잡으로 6시간 주기 실행이 가능하다 (무료 플랜 기준 일 1회 → 유료 또는 Supabase Edge Function 크론 대체 고려)
- 아티클 본문은 저장하지 않으므로 저작권 이슈가 없다
- 피드당 최신 20개 항목만 파싱한다 (초기 수집 포함)

## 미해결 질문 (Open Questions)

- Vercel 무료 플랜의 크론 주기 제한(일 1회)으로 인해 6시간 주기가 불가능할 수 있음 → Supabase pg_cron 또는 유료 플랜 검토 필요
- 피드 URL이 변경되거나 서비스 종료 시 모니터링 방법
- 90일 이상 된 북마크 아티클 삭제 시 사용자 북마크 처리 정책
