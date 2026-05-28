import { eq, max, sql } from 'drizzle-orm'
import { db } from '../../db'
import { articles } from '../../db/schema'
import { FEED_SOURCES } from '../../utils/rss'
import { getArticleSourceLabel } from '../../utils/article-sources'

export default defineEventHandler(async () => {
  // DB에 실제로 글이 있는 피드 + 마지막 게시일
  const rows = await db
    .select({
      feedName: articles.feedName,
      category: articles.category,
      lastPublishedAt: max(articles.publishedAt),
    })
    .from(articles)
    .groupBy(articles.feedName, articles.category)

  const feedMap = new Map(rows.map((r) => [r.feedName, r.lastPublishedAt?.toISOString() ?? null]))
  const domesticInDb = new Set(rows.filter((r) => r.category === 'domestic').map((r) => r.feedName))
  const internationalInDb = new Set(rows.filter((r) => r.category === 'international').map((r) => r.feedName))

  type FeedItem = { name: string; lastPublishedAt: string | null }

  const seen = new Set<string>()
  const domestic: FeedItem[] = []
  for (const f of FEED_SOURCES.filter((f) => f.category === 'domestic' && domesticInDb.has(f.name))) {
    const label = getArticleSourceLabel(f.name)
    if (seen.has(label)) continue
    seen.add(label)
    domestic.push({ name: label, lastPublishedAt: feedMap.get(f.name) ?? null })
  }

  seen.clear()
  const international: FeedItem[] = []
  for (const f of FEED_SOURCES.filter((f) => f.category === 'international' && internationalInDb.has(f.name))) {
    const label = getArticleSourceLabel(f.name)
    if (seen.has(label)) continue
    seen.add(label)
    international.push({ name: label, lastPublishedAt: feedMap.get(f.name) ?? null })
  }

  return { data: { domestic, international } }
})
