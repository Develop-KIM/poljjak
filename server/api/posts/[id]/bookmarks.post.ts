import { and, eq, isNull } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { bookmarks, posts } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1)
  if (!post) throw createError({ statusCode: 404, statusMessage: '게시글을 찾을 수 없어요' })

  const [existing] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(and(eq(bookmarks.postId, id), eq(bookmarks.userId, user.id)))
    .limit(1)

  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id))
    return { data: { bookmarked: false } }
  }

  await db.insert(bookmarks).values({ postId: id, userId: user.id })
  return { data: { bookmarked: true } }
})
