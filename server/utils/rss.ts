import Parser from 'rss-parser'

type MediaContent = { $?: { url?: string; medium?: string } }
type CustomItem = {
  summary?: string
  description?: string
  'media:content'?: MediaContent | MediaContent[]
  'media:thumbnail'?: MediaContent
}

const parser = new Parser<object, CustomItem>({
  customFields: { item: ['summary', 'description', 'media:content', 'media:thumbnail'] },
})

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
}

async function fetchFeed(url: string) {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const raw = await res.text()
  // 이스케이프되지 않은 & 문자를 &amp;로 치환 (일부 피드의 잘못된 XML 처리)
  const xml = raw.replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, '&amp;')
  return parser.parseString(xml)
}

// RSS item에서 이미지 URL 추출
function extractImageUrl(
  item: CustomItem & { enclosure?: { url?: string; type?: string }; content?: string }
): string | null {
  // 1. enclosure (팟캐스트/미디어 첨부)
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url
  }
  // 2. media:thumbnail
  const thumb = item['media:thumbnail']
  if (thumb?.$?.url) return thumb.$.url

  // 3. media:content
  const mc = item['media:content']
  if (mc) {
    const candidates = Array.isArray(mc) ? mc : [mc]
    const img = candidates.find((c) => !c.$?.medium || c.$?.medium === 'image')
    if (img?.$?.url) return img.$.url
  }

  // 4. content/description에서 첫 <img src="..."> 추출
  const html = (item as { content?: string }).content ?? ''
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (match?.[1]) {
    const src = match[1]
    // data URI 및 1x1 트래킹 픽셀 제외
    if (!src.startsWith('data:') && !src.includes('1x1') && !src.includes('pixel')) return src
  }
  return null
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
  {
    name: '네이버 클라우드',
    url: 'https://navercloudplatform.medium.com/feed',
    category: 'domestic',
  },
  { name: '카카오 기술 블로그', url: 'https://tech.kakao.com/feed/', category: 'domestic' },
  { name: '카카오페이 기술 블로그', url: 'https://tech.kakaopay.com/rss', category: 'domestic' },
  {
    name: '카카오엔터 기술 블로그',
    url: 'https://kakaoentertainment-tech.tistory.com/rss',
    category: 'domestic',
  },
  {
    name: '라인 기술 블로그',
    url: 'https://engineering.linecorp.com/ko/feed/',
    category: 'domestic',
  },
  {
    name: '쿠팡 기술 블로그',
    url: 'https://medium.com/feed/coupang-engineering',
    category: 'domestic',
  },
  {
    name: '우아한형제들 기술 블로그',
    url: 'https://techblog.woowahan.com/feed/',
    category: 'domestic',
  },
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
  {
    name: '하이퍼커넥트 기술 블로그',
    url: 'https://hyperconnect.github.io/feed.xml',
    category: 'domestic',
  },
  { name: '올리브영 기술 블로그', url: 'https://oliveyoung.tech/rss.xml', category: 'domestic' },

  // ── 해외 ──────────────────────────────────────────────────
  { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'international' },
  { name: 'dev.to', url: 'https://dev.to/feed', category: 'international' },
  {
    name: 'Smashing Magazine',
    url: 'https://www.smashingmagazine.com/feed/',
    category: 'international',
  },
  { name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: 'international' },
  {
    name: 'Engineering at Meta',
    url: 'https://engineering.fb.com/feed/',
    category: 'international',
  },
  {
    name: 'Google Developers',
    url: 'https://developers.googleblog.com/feeds/posts/default',
    category: 'international',
  },
  { name: 'Netflix Tech Blog', url: 'https://netflixtechblog.com/feed', category: 'international' },
  {
    name: 'Airbnb Engineering',
    url: 'https://medium.com/feed/airbnb-engineering',
    category: 'international',
  },
  { name: 'GitHub Blog', url: 'https://github.blog/feed/', category: 'international' },
  { name: 'Stripe Blog', url: 'https://stripe.com/blog/feed.rss', category: 'international' },
  { name: 'Cloudflare Blog', url: 'https://blog.cloudflare.com/rss/', category: 'international' },
  { name: 'Vercel Blog', url: 'https://vercel.com/atom', category: 'international' },
  { name: 'Discord Blog', url: 'https://discord.com/blog/rss.xml', category: 'international' },
  { name: 'Slack Engineering', url: 'https://slack.engineering/feed/', category: 'international' },
  {
    name: 'Spotify Engineering',
    url: 'https://engineering.atspotify.com/feed/',
    category: 'international',
  },
]

// 개선된 태그 규칙 — 과도하게 광범위한 키워드 제거, 더 명확한 기술 용어로 교체
const TAG_RULES: Array<{ tag: string; keywords: string[] }> = [
  {
    tag: 'Frontend',
    keywords: [
      'react',
      'vue',
      'angular',
      'svelte',
      'next.js',
      'nuxt',
      'remix',
      'astro',
      'css',
      'sass',
      'scss',
      'tailwind',
      'styled-components',
      'emotion',
      'html',
      'dom',
      'javascript',
      'typescript',
      'webpack',
      'vite',
      'esbuild',
      'rollup',
      'storybook',
      'pwa',
      'spa',
      'ssr',
      'hydration',
      'web component',
      '프론트엔드',
      '프론트',
      'ui 컴포넌트',
      '웹 퍼블',
      '웹 접근성',
      'animation',
      '애니메이션',
      'canvas',
      'webgl',
      'three.js',
    ],
  },
  {
    tag: 'Backend',
    keywords: [
      'node.js',
      'nodejs',
      'express',
      'fastify',
      'nestjs',
      'hono',
      'python',
      'django',
      'flask',
      'fastapi',
      'sqlalchemy',
      'java',
      'spring boot',
      'spring framework',
      'jvm',
      'gradle',
      'maven',
      'go',
      'golang',
      'rust',
      'actix',
      'axum',
      'graphql',
      'grpc',
      'protobuf',
      'rest api',
      'openapi',
      'swagger',
      '백엔드',
      '서버사이드',
      'server-side',
      '서비스 레이어',
      'middleware',
      '미들웨어',
      'webhook',
      '웹훅',
    ],
  },
  {
    tag: 'DevOps',
    keywords: [
      'docker',
      'container',
      'kubernetes',
      'k8s',
      'helm',
      'istio',
      'ci/cd',
      'jenkins',
      'github actions',
      'gitlab ci',
      'circleci',
      'terraform',
      'ansible',
      'infrastructure as code',
      'iac',
      'aws',
      'ec2',
      's3',
      'lambda',
      'eks',
      'ecs',
      'rds',
      'gcp',
      'gke',
      'cloud run',
      'azure',
      '인프라',
      '배포',
      'deployment',
      'release',
      '릴리스',
      'monitoring',
      '모니터링',
      'prometheus',
      'grafana',
      'datadog',
      'elk',
      'nginx',
      'load balancer',
      '로드 밸런서',
    ],
  },
  {
    tag: 'AI/ML',
    keywords: [
      'machine learning',
      'deep learning',
      'neural network',
      '신경망',
      'gpt',
      'llm',
      'large language model',
      'openai',
      'claude',
      'gemini',
      'transformer',
      'bert',
      'diffusion',
      'stable diffusion',
      'midjourney',
      'rag',
      'fine-tuning',
      'embedding',
      'vector',
      '인공지능',
      '머신러닝',
      '딥러닝',
      '자연어처리',
      'nlp',
      'computer vision',
      '컴퓨터 비전',
      'object detection',
      'reinforcement learning',
      '강화학습',
      'pytorch',
      'tensorflow',
      'hugging face',
      'ai agent',
      'mcp',
      'function calling',
    ],
  },
  {
    tag: 'Database',
    keywords: [
      'mysql',
      'postgresql',
      'sqlite',
      'mariadb',
      'mongodb',
      'dynamodb',
      'firestore',
      'couchdb',
      'redis',
      'memcached',
      'valkey',
      'elasticsearch',
      'opensearch',
      'solr',
      'clickhouse',
      'bigquery',
      'snowflake',
      'redshift',
      'orm',
      'prisma',
      'drizzle',
      'hibernate',
      'jpa',
      '데이터베이스',
      'schema',
      '스키마',
      'migration',
      '마이그레이션',
      'index',
      '인덱스',
      'query optimization',
      '쿼리 최적화',
      'transaction',
      '트랜잭션',
      'replication',
      '복제',
      'sharding',
      '샤딩',
    ],
  },
  {
    tag: 'Architecture',
    keywords: [
      'microservice',
      'msa',
      'monolith',
      '모놀리스',
      '아키텍처',
      'architecture',
      'system design',
      '시스템 설계',
      'design pattern',
      'ddd',
      'domain driven',
      'hexagonal',
      'event driven',
      'event sourcing',
      'cqrs',
      'saga',
      'clean architecture',
      'solid',
      'dependency injection',
      'message queue',
      '메시지 큐',
      'kafka',
      'rabbitmq',
      'sqs',
      'api gateway',
      'service mesh',
      'circuit breaker',
    ],
  },
  {
    tag: 'Mobile',
    keywords: [
      'ios',
      'swift',
      'swiftui',
      'uikit',
      'xcode',
      'android',
      'kotlin',
      'jetpack compose',
      'android studio',
      'flutter',
      'dart',
      'react native',
      'expo',
      '모바일',
      'mobile app',
      '앱 개발',
      'app store',
      'play store',
      'capacitor',
      'cordova',
      'pwa',
    ],
  },
  {
    tag: 'Security',
    keywords: [
      '보안',
      'security',
      'vulnerability',
      '취약점',
      'exploit',
      'cve',
      'oauth',
      'oauth2',
      'jwt',
      'token',
      'session',
      'cookie',
      'xss',
      'csrf',
      'sql injection',
      'injection',
      'ssl',
      'tls',
      'https',
      'certificate',
      '인증서',
      'zero trust',
      'sso',
      'saml',
      'mfa',
      '2fa',
      'encryption',
      '암호화',
      'hashing',
      '해시',
      'penetration testing',
      '침투 테스트',
      'waf',
    ],
  },
  {
    tag: 'Performance',
    keywords: [
      '성능',
      'performance',
      '최적화',
      'optimization',
      'latency',
      'throughput',
      'response time',
      'tps',
      'qps',
      'rps',
      'cache',
      '캐시',
      'cdn',
      'edge',
      'lazy loading',
      'profiling',
      '프로파일링',
      'bottleneck',
      '병목',
      'memory leak',
      '메모리 누수',
      'gc',
      'garbage collection',
      'load test',
      '부하 테스트',
      'stress test',
      'benchmark',
      'web vitals',
      'lighthouse',
      'core web vitals',
      'lcp',
      'cls',
      'fid',
    ],
  },
  {
    tag: 'Data',
    keywords: [
      'data engineering',
      'data pipeline',
      '데이터 파이프라인',
      'etl',
      'elt',
      'data warehouse',
      '데이터 웨어하우스',
      'data lake',
      'hadoop',
      'spark',
      'flink',
      'airflow',
      'dbt',
      'kafka',
      'kinesis',
      'pubsub',
      'streaming',
      'analytics',
      '데이터 분석',
      'bi',
      'dashboard',
      '대시보드',
      'a/b test',
      'a/b 테스트',
      'experiment',
      '실험',
      'feature engineering',
      'feature store',
    ],
  },
]

export function autoTag(title: string, summary: string | null): string[] {
  const text = `${title} ${summary ?? ''}`.toLowerCase()
  const tags: string[] = []
  for (const rule of TAG_RULES) {
    // 단어 경계 또는 한국어 포함 여부로 매칭 (영어는 단어 단위, 한국어는 포함 여부)
    const matched = rule.keywords.some((kw) => {
      const kwLower = kw.toLowerCase()
      // 한국어 키워드는 그냥 포함 여부
      if (/[ㄱ-ㅎ가-힣]/.test(kwLower)) return text.includes(kwLower)
      // 영어는 단어 경계로 매칭 (부분 일치 방지)
      return new RegExp(
        `(?<![a-z0-9])${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`,
        'i'
      ).test(text)
    })
    if (matched) tags.push(rule.tag)
  }
  return tags
}

export interface ParsedArticle {
  feedName: string
  category: FeedCategory
  title: string
  url: string
  summary: string | null
  imageUrl: string | null
  tags: string[]
  publishedAt: Date
}

export interface FeedCollectStatus {
  feedName: string
  category: FeedCategory
  url: string
  checkedAt: Date
  success: boolean
  itemCount: number
  error: string | null
}

export interface FeedCollectResult {
  articles: ParsedArticle[]
  statuses: FeedCollectStatus[]
}

export async function collectFeedsWithStatus(): Promise<FeedCollectResult> {
  const results: ParsedArticle[] = []
  const statuses: FeedCollectStatus[] = []

  await Promise.allSettled(
    FEED_SOURCES.map(async (source) => {
      const checkedAt = new Date()
      try {
        const feed = await fetchFeed(source.url)
        let itemCount = 0
        for (const item of feed.items) {
          if (!item.link || !item.title) continue
          const rawSummary = item.summary ?? item.contentSnippet ?? item.content ?? null
          const summary = rawSummary ? rawSummary.replace(/<[^>]*>/g, '').slice(0, 300) : null
          const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()
          if (isNaN(publishedAt.getTime())) continue
          const title = item.title.trim()
          const imageUrl = extractImageUrl(item as Parameters<typeof extractImageUrl>[0])
          results.push({
            feedName: source.name,
            category: source.category,
            title,
            url: item.link.trim(),
            summary,
            imageUrl,
            tags: autoTag(title, summary),
            publishedAt,
          })
          itemCount++
        }
        statuses.push({
          feedName: source.name,
          category: source.category,
          url: source.url,
          checkedAt,
          success: true,
          itemCount,
          error: null,
        })
      } catch (err) {
        const message = (err as Error).message
        statuses.push({
          feedName: source.name,
          category: source.category,
          url: source.url,
          checkedAt,
          success: false,
          itemCount: 0,
          error: message,
        })
        console.error(`[rss] 피드 수집 실패 (${source.name}):`, message)
      }
    })
  )

  return { articles: results, statuses }
}

export async function collectAllFeeds(): Promise<ParsedArticle[]> {
  const result = await collectFeedsWithStatus()
  return result.articles
}
