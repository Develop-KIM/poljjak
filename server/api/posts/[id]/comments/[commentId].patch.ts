import { and, eq, isNull } from 'drizzle-orm'
import { requireAuth } from '../../../../utils/auth'
import { db } from '../../../../db'
import { comments } from '../../../../db/schema'
import { commentUpdateSchema } from '../../../../validation/comments'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const commentId = getRouterParam(event, 'commentId')
  if (!commentId) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const [comment] = await db
    .select({ id: comments.id, userId: comments.userId })
    .from(comments)
    .where(and(eq(comments.id, commentId), isNull(comments.deletedAt)))
    .limit(1)

  if (!comment) throw createError({ statusCode: 404, statusMessage: '댓글을 찾을 수 없어요' })
  if (comment.userId !== user.id)
    throw createError({ statusCode: 403, statusMessage: '권한이 없어요' })

  const body = await readBody<unknown>(event)
  const parsed = commentUpdateSchema.safeParse(body)
  if (!parsed.success)
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요',
    })

  await db
    .update(comments)
    .set({ content: parsed.data.content, updatedAt: new Date() })
    .where(eq(comments.id, commentId))

  return { data: { id: commentId, content: parsed.data.content } }
})
