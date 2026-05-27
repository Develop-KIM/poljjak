import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 8000,
  customFields: {
    item: ['summary', 'description'],
  },
})

export type FeedCategory = 'domestic' | 'international'

interface FeedSource {
  name: string
  url: string
  category: FeedCategory
}

export const FEED_SOURCES: FeedSource[] = [
  // ── 국내 ──────────────────────────────────────────────────
  // 네이버
  { name: '네이버 D2', url: 'https://d2.naver.com/d2.atom', category: 'domestic' },
  { name: '네이버 클라우드', url: 'https://navercloudplatform.medium.com/feed', category: 'domestic' },
  // 카카오
  { name: '카카오 기술 블로그', url: 'https://tech.kakao.com/feed/', category: 'domestic' },
  { name: '카카오페이 기술 블로그', url: 'https://tech.kakaopay.com/rss', category: 'domestic' },
  { name: '카카오엔터 기술 블로그', url: 'https://kakaoentertainment-tech.tistory.com/rss', category: 'domestic' },
  { name: '카카오뱅크 기술 블로그', url: 'https://kakaobank.github.io/feed.xml', category: 'domestic' },
  // 라인
  { name: '라인 기술 블로그', url: 'https://engineering.linecorp.com/ko/feed/', category: 'domestic' },
  // 쿠팡
  { name: '쿠팡 기술 블로그', url: 'https://medium.com/feed/coupang-engineering', category: 'domestic' },
  // 배달의민족
  { name: '우아한형제들 기술 블로그', url: 'https://techblog.woowahan.com/feed/', category: 'domestic' },
  // 당근
  { name: '당근 기술 블로그', url: 'https://medium.com/feed/daangn', category: 'domestic' },
  // 토스
  { name: '토스 기술 블로그', url: 'https://toss.tech/rss.xml', category: 'domestic' },
  // 직방
  { name: '직방 기술 블로그', url: 'https://medium.com/feed/zigbang', category: 'domestic' },
  // 야놀자
  { name: '야놀자 기술 블로그', url: 'https://medium.com/feed/yanolja', category: 'domestic' },
  // 컬리
  { name: '컬리 기술 블로그', url: 'https://helloworld.kurly.com/feed', category: 'domestic' },
  // 뱅크샐러드
  { name: '뱅크샐러드 기술 블로그', url: 'https://blog.banksalad.com/feed', category: 'domestic' },
  // 쏘카
  { name: '쏘카 기술 블로그', url: 'https://tech.socarcorp.kr/feed', category: 'domestic' },
  // 올리브영
  { name: '올리브영 기술 블로그', url: 'https://oliveyoung.tech/feed', category: 'domestic' },
  // NHN
  { name: 'NHN 기술 블로그', url: 'https://meetup.nhncloud.com/rss', category: 'domestic' },
  // 11번가
  { name: '11번가 기술 블로그', url: 'https://11st-tech.github.io/feed.xml', category: 'domestic' },
  // 리디
  { name: '리디 기술 블로그', url: 'https://ridicorp.com/story/feed/', category: 'domestic' },
  // 하이퍼커넥트
  { name: '하이퍼커넥트 기술 블로그', url: 'https://hyperconnect.github.io/feed.xml', category: 'domestic' },
  // 오늘의집
  { name: '오늘의집 기술 블로그', url: 'https://www.bucketplace.com/post/rss/', category: 'domestic' },
  // 무신사
  { name: '무신사 기술 블로그', url: 'https://medium.com/feed/musinsa-tech', category: 'domestic' },
  // 왓챠
  { name: '왓챠 기술 블로그', url: 'https://medium.com/feed/watcha-engineering', category: 'domestic' },
  // 인프랩(인프런)
  { name: '인프런 기술 블로그', url: 'https://tech.inflab.com/feed', category: 'domestic' },

  // ── 해외 ──────────────────────────────────────────────────
  { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'international' },
  { name: 'dev.to', url: 'https://dev.to/feed', category: 'international' },
  { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'international' },
  { name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: 'international' },
  { name: 'Netflix Tech Blog', url: 'https://netflixtechblog.com/feed', category: 'international' },
  { name: 'Uber Engineering', url: 'https://eng.uber.com/feed/', category: 'international' },
  { name: 'Engineering at Meta', url: 'https://engineering.fb.com/feed/', category: 'international' },
  { name: 'Google Developers', url: 'https://developers.googleblog.com/feeds/posts/default', category: 'international' },
  { name: 'Airbnb Engineering', url: 'https://medium.com/feed/airbnb-engineering', category: 'international' },
]

export const DOMESTIC_FEED_NAMES = FEED_SOURCES
  .filter((f) => f.category === 'domestic')
  .map((f) => f.name)

export interface ParsedArticle {
  feedName: string
  category: FeedCategory
  title: string
  url: string
  summary: string | null
  publishedAt: Date
}

export async function collectAllFeeds(): Promise<ParsedArticle[]> {
  const results: ParsedArticle[] = []

  await Promise.allSettled(
    FEED_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url)

        for (const item of feed.items) {
          if (!item.link || !item.title) continue

          const rawSummary = item.summary ?? item.contentSnippet ?? item.content ?? null
          const summary = rawSummary ? rawSummary.replace(/<[^>]*>/g, '').slice(0, 300) : null
          const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()

          if (isNaN(publishedAt.getTime())) continue

          results.push({
            feedName: source.name,
            category: source.category,
            title: item.title.trim(),
            url: item.link.trim(),
            summary,
            publishedAt,
          })
        }
      } catch (err) {
        console.error(`[rss] 피드 수집 실패 (${source.name}):`, err)
      }
    }),
  )

  return results
}
