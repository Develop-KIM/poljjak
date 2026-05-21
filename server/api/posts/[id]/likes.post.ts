import { and, eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { likes } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

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
  return { data: { liked: true } }
})
