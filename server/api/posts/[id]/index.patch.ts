import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { posts } from '../../../db/schema'

const postUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해주세요')
    .max(100, '제목은 100자 이하로 입력해주세요'),
  body: z.string().trim().max(5000, '본문은 5000자 이하로 입력해주세요').default(''),
})

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

  const body = await readBody<unknown>(event)
  const parsed = postUpdateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요',
    })
  }

  await db
    .update(posts)
    .set({ title: parsed.data.title, body: parsed.data.body, updatedAt: new Date() })
    .where(eq(posts.id, id))

  return { data: { id } }
})
