import { z } from 'zod'
import { eq, isNull, and } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { comments, posts } from '../../../db/schema'
import { formatCommunityDate, getAuthorInitial } from '../../../utils/community'

const commentCreateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '댓글을 입력해주세요')
    .max(1000, '댓글은 1000자 이하로 입력해주세요'),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1)

  if (!post) throw createError({ statusCode: 404, statusMessage: '게시글을 찾을 수 없어요' })

  const body = await readBody<unknown>(event)
  const parsed = commentCreateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요',
    })
  }

  const [inserted] = await db
    .insert(comments)
    .values({ postId, userId: user.id, content: parsed.data.content })
    .returning({ id: comments.id, createdAt: comments.createdAt })

  if (!inserted) throw createError({ statusCode: 500, statusMessage: '댓글 저장에 실패했어요' })

  const author = user.nickname
  return {
    data: {
      id: inserted.id,
      author,
      authorInitial: getAuthorInitial(author),
      authorAvatarUrl: user.avatarUrl ?? null,
      content: parsed.data.content,
      createdAt: formatCommunityDate(inserted.createdAt),
      isOwner: true,
    },
  }
})
