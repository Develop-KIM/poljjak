import { and, eq, isNull } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { postImages, posts } from '../../../db/schema'
import { postUpdateSchema } from '../../../validation/posts'

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

  const { imageUrls } = parsed.data

  const updateData: Record<string, unknown> = {
    title: parsed.data.title,
    body: parsed.data.body,
    updatedAt: new Date(),
  }
  if (parsed.data.recruitmentStatus !== undefined) {
    updateData.recruitmentStatus = parsed.data.recruitmentStatus
  }

  await db.update(posts).set(updateData).where(eq(posts.id, id))

  await db.delete(postImages).where(eq(postImages.postId, id))
  if (imageUrls && imageUrls.length > 0) {
    await db.insert(postImages).values(imageUrls.map((url, order) => ({ postId: id, url, order })))
  }

  return { data: { id } }
})
