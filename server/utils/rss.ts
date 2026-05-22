import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 10000,
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
  // 국내
  { name: '카카오 기술 블로그', url: 'https://tech.kakao.com/feed/', category: 'domestic' },
  { name: '토스 기술 블로그', url: 'https://toss.tech/rss.xml', category: 'domestic' },
  { name: '우아한형제들 기술 블로그', url: 'https://techblog.woowahan.com/feed/', category: 'domestic' },
  { name: '네이버 D2', url: 'https://d2.naver.com/d2.atom', category: 'domestic' },
  { name: '라인 기술 블로그', url: 'https://engineering.linecorp.com/ko/feed/', category: 'domestic' },
  { name: '쿠팡 기술 블로그', url: 'https://medium.com/feed/coupang-engineering', category: 'domestic' },
  // 해외
  { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'international' },
  { name: 'dev.to', url: 'https://dev.to/feed', category: 'international' },
  { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'international' },
  { name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: 'international' },
]

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
        const items = feed.items.slice(0, 20)

        for (const item of items) {
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
