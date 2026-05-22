import { desc, eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { articleBookmarks, articles } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const rows = await db
    .select({
      id: articles.id,
      feedName: articles.feedName,
      category: articles.category,
      title: articles.title,
      url: articles.url,
      publishedAt: articles.publishedAt,
      bookmarkedAt: articleBookmarks.createdAt,
    })
    .from(articleBookmarks)
    .innerJoin(articles, eq(articleBookmarks.articleId, articles.id))
    .where(eq(articleBookmarks.userId, user.id))
    .orderBy(desc(articleBookmarks.createdAt))

  return {
    data: rows.map((row) => ({
      ...row,
      publishedAt: row.publishedAt.toISOString(),
      bookmarkedAt: row.bookmarkedAt.toISOString(),
    })),
  }
})
