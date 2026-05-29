import { and, count, desc, eq, gte, ilike, inArray, or, sql, arrayContains } from 'drizzle-orm'
import { getAuthUser } from '../../utils/auth'
import { db } from '../../db'
import { articleBookmarks, articleClicks, articles } from '../../db/schema'
import { getArticleSourceNames } from '../../utils/article-sources'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = query.category === 'international' ? 'international' : 'domestic'
  const feedName = typeof query.feedName === 'string' && query.feedName ? query.feedName : null
  const feedNames = feedName ? getArticleSourceNames(feedName) : []
  const q = typeof query.q === 'string' && query.q.trim() ? query.q.trim() : null
  const tag = typeof query.tag === 'string' && query.tag.trim() ? query.tag.trim() : null
  const period = query.period as string | undefined
  const sort = query.sort === 'trending' ? 'trending' : 'latest'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 21))
  const offset = (page - 1) * limit

  const user = await getAuthUser(event)

  if (!user) {
    setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=300')
  }

  // 기간 필터
  let periodStart: Date | null = null
  const now = new Date()
  if (period === 'today') {
    periodStart = new Date(now)
    periodStart.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (period === 'month') {
    periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  const conditions = [
    eq(articles.category, category),
    ...(feedNames.length === 1 ? [eq(articles.feedName, feedNames[0]!)] : []),
    ...(feedNames.length > 1 ? [inArray(articles.feedName, feedNames)] : []),
    ...(q ? [or(ilike(articles.title, `%${q}%`), ilike(articles.summary, `%${q}%`))] : []),
    ...(tag ? [arrayContains(articles.tags, [tag])] : []),
    ...(periodStart ? [gte(articles.publishedAt, periodStart)] : []),
  ]
  const whereClause = conditions.length === 1 ? conditions[0]! : and(...conditions)

  // 트렌딩: 최근 7일 클릭 수 + 북마크 가중치 (상관 서브쿼리)
  const trendingCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const clickExpr = sql<number>`(
    SELECT COUNT(*) FROM ${articleClicks}
    WHERE ${articleClicks.articleId} = ${articles.id}
      AND ${articleClicks.createdAt} >= ${trendingCutoff}
  )`
  const bookmarkExpr = sql<number>`(
    SELECT COUNT(*) FROM ${articleBookmarks}
    WHERE ${articleBookmarks.articleId} = ${articles.id}
      AND ${articleBookmarks.createdAt} >= ${trendingCutoff}
  )`
  const trendingExpr = sql<number>`(${clickExpr}) + (${bookmarkExpr}) * 3`

  let rows: {
    id: string
    feedName: string
    category: string
    title: string
    url: string
    summary: string | null
    imageUrl: string | null
    tags: string[] | null
    publishedAt: Date
    bookmarkCount: number
    clickCount: number
    trendingScore: number
  }[]
  let totalRows: { total: number }[]
  try {
    ;[rows, totalRows] = await Promise.all([
      sort === 'trending'
        ? db
            .select({
              id: articles.id,
              feedName: articles.feedName,
              category: articles.category,
              title: articles.title,
              url: articles.url,
              summary: articles.summary,
              imageUrl: articles.imageUrl,
              tags: articles.tags,
              publishedAt: articles.publishedAt,
              bookmarkCount: bookmarkExpr,
              clickCount: clickExpr,
              trendingScore: trendingExpr,
            })
            .from(articles)
            .where(whereClause)
            .orderBy(desc(trendingExpr), desc(articles.publishedAt))
            .limit(limit)
            .offset(offset)
        : db
            .select({
              id: articles.id,
              feedName: articles.feedName,
              category: articles.category,
              title: articles.title,
              url: articles.url,
              summary: articles.summary,
              imageUrl: articles.imageUrl,
              tags: articles.tags,
              publishedAt: articles.publishedAt,
              bookmarkCount: sql<number>`0`,
              clickCount: sql<number>`0`,
              trendingScore: sql<number>`0`,
            })
            .from(articles)
            .where(whereClause)
            .orderBy(desc(articles.publishedAt))
            .limit(limit)
            .offset(offset),
      db.select({ total: count() }).from(articles).where(whereClause),
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[articles] query error', { category, sort, period, msg, err })
    throw createError({ statusCode: 500, statusMessage: `[디버그] ${msg}` })
  }

  const total = totalRows[0]?.total ?? 0

  let bookmarkedIds = new Set<string>()
  if (user && rows.length > 0) {
    const articleIds = rows.map((r) => r.id)
    const bookmarked = await db
      .select({ articleId: articleBookmarks.articleId })
      .from(articleBookmarks)
      .where(
        and(eq(articleBookmarks.userId, user.id), inArray(articleBookmarks.articleId, articleIds))
      )
    bookmarkedIds = new Set(bookmarked.map((b) => b.articleId))
  }

  return {
    data: rows.map((row) => ({
      ...row,
      publishedAt: row.publishedAt.toISOString(),
      isBookmarked: bookmarkedIds.has(row.id),
    })),
    total,
    page,
    pageSize: limit,
  }
})
