import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { getAuthUser } from '../../utils/auth'
import { db } from '../../db'
import { articleBookmarks, articles } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = query.category === 'international' ? 'international' : 'domestic'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = 20
  const offset = (page - 1) * limit

  const user = await getAuthUser(event)

  // 비로그인 요청만 캐시 적용
  if (!user) {
    setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=300')
  }

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: articles.id,
        feedName: articles.feedName,
        category: articles.category,
        title: articles.title,
        url: articles.url,
        summary: articles.summary,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(eq(articles.category, category))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(articles).where(eq(articles.category, category)),
  ])

  // 로그인 사용자 북마크 배치 조회
  let bookmarkedIds = new Set<string>()
  if (user && rows.length > 0) {
    const articleIds = rows.map((r) => r.id)
    const bookmarked = await db
      .select({ articleId: articleBookmarks.articleId })
      .from(articleBookmarks)
      .where(
        and(
          eq(articleBookmarks.userId, user.id),
          inArray(articleBookmarks.articleId, articleIds),
        ),
      )
    bookmarkedIds = new Set(bookmarked.map((b) => b.articleId))
  }

  return {
    data: rows.map((row) => ({
      ...row,
      publishedAt: row.publishedAt.toISOString(),
      isBookmarked: bookmarkedIds.has(row.id),
    })),
    total: total,
    page,
    pageSize: limit,
  }
})
