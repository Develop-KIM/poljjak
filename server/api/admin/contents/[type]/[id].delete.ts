import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../../utils/admin'
import { db } from '../../../../db'
import { comments, posts } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  // 관리자 권한 확인
  await requireAdmin(event)

  const type = getRouterParam(event, 'type')
  const id = getRouterParam(event, 'id')

  // type 유효성 확인
  if (type !== 'post' && type !== 'comment') {
    throw createError({ statusCode: 400, statusMessage: 'type은 post 또는 comment여야 해요' })
  }

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID가 필요해요' })
  }

  if (type === 'post') {
    // 게시글 조회
    const [post] = await db
      .select({ id: posts.id, deletedAt: posts.deletedAt })
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1)

    if (!post) {
      throw createError({ statusCode: 404, statusMessage: '게시글을 찾을 수 없어요' })
    }

    // 소프트 삭제
    await db.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, id))
  } else {
    // 댓글 조회
    const [comment] = await db
      .select({ id: comments.id, deletedAt: comments.deletedAt })
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1)

    if (!comment) {
      throw createError({ statusCode: 404, statusMessage: '댓글을 찾을 수 없어요' })
    }

    // 소프트 삭제
    await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, id))
  }

  return { data: { ok: true } }
})
