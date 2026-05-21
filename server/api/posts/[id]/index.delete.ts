import { and, eq, isNull } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { posts } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const [post] = await db
    .select({ id: posts.id, userId: posts.userId })
    .from(posts)
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1)

  if (!post) throw createError({ statusCode: 404, statusMessage: '게시글을 찾을 수 없어요' })
  if (post.userId !== user.id)
    throw createError({ statusCode: 403, statusMessage: '권한이 없어요' })

  await db.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, id))

  return { data: null }
})
