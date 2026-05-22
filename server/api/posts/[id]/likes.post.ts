import { and, eq, isNull } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { likes, posts } from '../../../db/schema'
import { createLikeNotification } from '../../../utils/notifications'

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
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.postId, id), eq(likes.userId, user.id)))
    .limit(1)

  if (existing) {
    await db.delete(likes).where(eq(likes.id, existing.id))
    return { data: { liked: false } }
  }

  await db.insert(likes).values({ postId: id, userId: user.id })
  await createLikeNotification(id, user.id)
  return { data: { liked: true } }
})
