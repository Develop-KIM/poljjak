import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../../../utils/admin'
import { db } from '../../../../../db'
import { comments, posts } from '../../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const type = getRouterParam(event, 'type')
  const id = getRouterParam(event, 'id')

  if (type !== 'post' && type !== 'comment') {
    throw createError({ statusCode: 400, statusMessage: 'type은 post 또는 comment여야 해요' })
  }
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID가 필요해요' })

  if (type === 'post') {
    const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1)
    if (!post) throw createError({ statusCode: 404, statusMessage: '게시글을 찾을 수 없어요' })
    await db.update(posts).set({ deletedAt: null }).where(eq(posts.id, id))
  } else {
    const [comment] = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, id)).limit(1)
    if (!comment) throw createError({ statusCode: 404, statusMessage: '댓글을 찾을 수 없어요' })
    await db.update(comments).set({ deletedAt: null }).where(eq(comments.id, id))
  }

  return { data: { ok: true } }
})
