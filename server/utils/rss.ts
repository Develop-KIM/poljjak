import Parser from 'rss-parser'

const parser = new Parser({ customFields: { item: ['summary', 'description'] } })

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
}

// rss-parser의 headers 옵션보다 직접 fetch 후 parseString이 더 안정적
async function fetchFeed(url: string) {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  return parser.parseString(xml)
}

export type FeedCategory = 'domestic' | 'international'

interface FeedSource {
  name: string
  url: string
  category: FeedCategory
}

export const FEED_SOURCES: FeedSource[] = [
  // ── 국내 ──────────────────────────────────────────────────
  { name: '네이버 D2', url: 'https://d2.naver.com/d2.atom', category: 'domestic' },
  { name: '네이버 클라우드', url: 'https://navercloudplatform.medium.com/feed', category: 'domestic' },
  { name: '카카오 기술 블로그', url: 'https://tech.kakao.com/feed/', category: 'domestic' },
  { name: '카카오페이 기술 블로그', url: 'https://tech.kakaopay.com/rss', category: 'domestic' },
  { name: '카카오엔터 기술 블로그', url: 'https://kakaoentertainment-tech.tistory.com/rss', category: 'domestic' },
  { name: '라인 기술 블로그', url: 'https://engineering.linecorp.com/ko/feed/', category: 'domestic' },
  { name: '쿠팡 기술 블로그', url: 'https://medium.com/feed/coupang-engineering', category: 'domestic' },
  { name: '우아한형제들 기술 블로그', url: 'https://techblog.woowahan.com/feed/', category: 'domestic' },
  { name: '당근 기술 블로그', url: 'https://medium.com/feed/daangn', category: 'domestic' },
  { name: '토스 기술 블로그', url: 'https://toss.tech/rss.xml', category: 'domestic' },
  { name: '직방 기술 블로그', url: 'https://medium.com/feed/zigbang', category: 'domestic' },
  { name: '야놀자 기술 블로그', url: 'https://medium.com/feed/yanolja', category: 'domestic' },
  { name: '쏘카 기술 블로그', url: 'https://tech.socarcorp.kr/feed', category: 'domestic' },
  { name: 'NHN 기술 블로그', url: 'https://meetup.nhncloud.com/rss', category: 'domestic' },
  { name: '무신사 기술 블로그', url: 'https://medium.com/feed/musinsa-tech', category: 'domestic' },
  { name: '왓챠 기술 블로그', url: 'https://medium.com/feed/watcha', category: 'domestic' },
  { name: '인프런 기술 블로그', url: 'https://tech.inflab.com/feed', category: 'domestic' },
  { name: '리디 기술 블로그', url: 'https://www.ridicorp.com/feed', category: 'domestic' },
  { name: '하이퍼커넥트 기술 블로그', url: 'https://hyperconnect.github.io/feed.xml', category: 'domestic' },
  { name: '올리브영 기술 블로그', url: 'https://oliveyoung.tech/rss.xml', category: 'domestic' },

  // ── 해외 ──────────────────────────────────────────────────
  { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'international' },
  { name: 'dev.to', url: 'https://dev.to/feed', category: 'international' },
  { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'international' },
  { name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: 'international' },
  { name: 'Engineering at Meta', url: 'https://engineering.fb.com/feed/', category: 'international' },
  { name: 'Google Developers', url: 'https://developers.googleblog.com/feeds/posts/default', category: 'international' },
  { name: 'Netflix Tech Blog', url: 'https://netflixtechblog.com/feed', category: 'international' },
  { name: 'Uber Engineering', url: 'https://eng.uber.com/feed/', category: 'international' },
  { name: 'Airbnb Engineering', url: 'https://medium.com/feed/airbnb-engineering', category: 'international' },
  { name: 'Shopify Engineering', url: 'https://shopify.engineering/blog.atom', category: 'international' },
  { name: 'GitHub Blog', url: 'https://github.blog/feed/', category: 'international' },
  { name: 'Stripe Blog', url: 'https://stripe.com/blog/feed.rss', category: 'international' },
  { name: 'Cloudflare Blog', url: 'https://blog.cloudflare.com/rss/', category: 'international' },
  { name: 'Vercel Blog', url: 'https://vercel.com/atom', category: 'international' },
  { name: 'Discord Blog', url: 'https://discord.com/category/engineering/rss.xml', category: 'international' },
  { name: 'Figma Blog', url: 'https://www.figma.com/blog/feed/', category: 'international' },
  { name: 'Notion Blog', url: 'https://www.notion.so/blog/rss.xml', category: 'international' },
  { name: 'Slack Engineering', url: 'https://slack.engineering/feed/', category: 'international' },
  { name: 'Spotify Engineering', url: 'https://engineering.atspotify.com/feed/', category: 'international' },
]

// 키워드 기반 자동 태그
const TAG_RULES: Array<{ tag: string; keywords: string[] }> = [
  { tag: 'Frontend', keywords: ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'css', 'html', 'javascript', 'typescript', '프론트엔드', 'ui', 'ux', '웹', 'web'] },
  { tag: 'Backend', keywords: ['node', 'python', 'java', 'spring', 'django', 'fastapi', 'go', 'rust', 'api', 'rest', 'graphql', '백엔드', '서버', 'server'] },
  { tag: 'DevOps', keywords: ['docker', 'kubernetes', 'k8s', 'ci/cd', 'jenkins', 'terraform', '인프라', '배포', 'deploy', 'cloud', '클라우드', 'aws', 'gcp', 'azure'] },
  { tag: 'AI/ML', keywords: ['ai', 'ml', 'machine learning', 'deep learning', 'gpt', 'llm', 'openai', 'transformer', '인공지능', '머신러닝', '딥러닝', '자연어', 'nlp'] },
  { tag: 'Database', keywords: ['sql', 'mysql', 'postgresql', 'redis', 'mongodb', 'elasticsearch', '데이터베이스', 'db', 'index', '인덱스', 'query', '쿼리'] },
  { tag: 'Architecture', keywords: ['msa', 'microservice', '아키텍처', 'architecture', '설계', 'design pattern', 'ddd', 'event driven', '이벤트'] },
  { tag: 'Mobile', keywords: ['ios', 'android', 'swift', 'kotlin', 'flutter', 'react native', '모바일', 'mobile', 'app'] },
  { tag: 'Security', keywords: ['보안', 'security', 'auth', 'oauth', 'jwt', 'xss', 'csrf', 'ssl', 'https', '인증', '취약점'] },
  { tag: 'Performance', keywords: ['성능', 'performance', '최적화', 'optimization', 'latency', 'throughput', 'cache', '캐시', 'cdn'] },
  { tag: 'Data', keywords: ['data', '데이터', 'pipeline', 'hadoop', 'spark', 'kafka', 'bigquery', 'analytics', '분석', 'batch'] },
]

export function autoTag(title: string, summary: string | null): string[] {
  const text = `${title} ${summary ?? ''}`.toLowerCase()
  const tags: string[] = []
  for (const rule of TAG_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      tags.push(rule.tag)
    }
  }
  return tags
}

export interface ParsedArticle {
  feedName: string
  category: FeedCategory
  title: string
  url: string
  summary: string | null
  tags: string[]
  publishedAt: Date
}

export async function collectAllFeeds(): Promise<ParsedArticle[]> {
  const results: ParsedArticle[] = []

  await Promise.allSettled(
    FEED_SOURCES.map(async (source) => {
      try {
        const feed = await fetchFeed(source.url)
        for (const item of feed.items) {
          if (!item.link || !item.title) continue
          const rawSummary = item.summary ?? item.contentSnippet ?? item.content ?? null
          const summary = rawSummary ? rawSummary.replace(/<[^>]*>/g, '').slice(0, 300) : null
          const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()
          if (isNaN(publishedAt.getTime())) continue
          const title = item.title.trim()
          results.push({
            feedName: source.name,
            category: source.category,
            title,
            url: item.link.trim(),
            summary,
            tags: autoTag(title, summary),
            publishedAt,
          })
        }
      } catch (err) {
        console.error(`[rss] 피드 수집 실패 (${source.name}):`, (err as Error).message)
      }
    }),
  )

  return results
}
