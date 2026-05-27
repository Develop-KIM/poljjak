import { and, count, eq, gte, inArray } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { db } from '../../../db'
import { articleBookmarks, articles } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const user = await getAuthUser(event)

  const trendingCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [row] = await db
    .select({
      id: articles.id,
      feedName: articles.feedName,
      category: articles.category,
      title: articles.title,
      url: articles.url,
      summary: articles.summary,
      tags: articles.tags,
      publishedAt: articles.publishedAt,
      collectedAt: articles.collectedAt,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1)

  if (!row) throw createError({ statusCode: 404, statusMessage: '아티클을 찾을 수 없어요' })

  const [{ bookmarkCount }] = await db
    .select({ bookmarkCount: count() })
    .from(articleBookmarks)
    .where(and(eq(articleBookmarks.articleId, id), gte(articleBookmarks.createdAt, trendingCutoff)))

  let isBookmarked = false
  if (user) {
    const [bm] = await db
      .select({ id: articleBookmarks.id })
      .from(articleBookmarks)
      .where(and(eq(articleBookmarks.articleId, id), eq(articleBookmarks.userId, user.id)))
      .limit(1)
    isBookmarked = !!bm
  }

  // 같은 출처 관련 아티클 (최신 4개, 본 글 제외)
  const related = await db
    .select({ id: articles.id, title: articles.title, publishedAt: articles.publishedAt, feedName: articles.feedName })
    .from(articles)
    .where(and(eq(articles.feedName, row.feedName), ...([eq(articles.category, row.category)])))
    .orderBy(articles.publishedAt)
    .limit(5)

  return {
    data: {
      ...row,
      publishedAt: row.publishedAt.toISOString(),
      collectedAt: row.collectedAt.toISOString(),
      bookmarkCount,
      isBookmarked,
      related: related.filter((r) => r.id !== id).slice(0, 4).map((r) => ({
        ...r,
        publishedAt: r.publishedAt.toISOString(),
      })),
    },
  }
})
