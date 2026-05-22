import { and, eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { articleBookmarks, articles } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const [article] = await db.select({ id: articles.id }).from(articles).where(eq(articles.id, id)).limit(1)
  if (!article) throw createError({ statusCode: 404, statusMessage: '아티클을 찾을 수 없어요' })

  const [existing] = await db
    .select({ id: articleBookmarks.id })
    .from(articleBookmarks)
    .where(and(eq(articleBookmarks.articleId, id), eq(articleBookmarks.userId, user.id)))
    .limit(1)

  if (existing) {
    await db.delete(articleBookmarks).where(eq(articleBookmarks.id, existing.id))
    return { data: { isBookmarked: false } }
  }

  await db.insert(articleBookmarks).values({ articleId: id, userId: user.id })
  return { data: { isBookmarked: true } }
})
