import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { analyses, postImages, posts } from '../../db/schema'
import { postCreateSchema } from '../../validation/posts'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<unknown>(event)
  const parsed = postCreateSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? '게시글 정보를 확인해주세요',
    })
  }

  const {
    analysisId,
    category,
    title,
    body: postBody,
    imageUrls,
    jobType,
    careerLevel,
  } = parsed.data

  if (analysisId) {
    const [analysis] = await db
      .select({
        id: analyses.id,
        userId: analyses.userId,
        status: analyses.status,
      })
      .from(analyses)
      .where(eq(analyses.id, analysisId))
      .limit(1)

    if (!analysis) {
      throw createError({ statusCode: 404, statusMessage: '분석 결과를 찾을 수 없어요' })
    }

    if (analysis.userId !== user.id) {
      throw createError({ statusCode: 403, statusMessage: '권한이 없어요' })
    }

    if (analysis.status !== 'completed') {
      throw createError({ statusCode: 400, statusMessage: '완료된 분석 결과만 공유할 수 있어요' })
    }
  }

  const [post] = await db
    .insert(posts)
    .values({
      userId: user.id,
      category,
      title,
      body: postBody,
      analysisId: analysisId ?? null,
      jobType: category === 'feedback' ? (jobType ?? null) : null,
      careerLevel: category === 'feedback' ? (careerLevel ?? null) : null,
    })
    .returning({ id: posts.id })

  if (!post) {
    throw createError({ statusCode: 500, statusMessage: '게시글 저장에 실패했어요' })
  }

  if (imageUrls && imageUrls.length > 0) {
    await db
      .insert(postImages)
      .values(imageUrls.map((url, order) => ({ postId: post.id, url, order })))
  }

  return { data: post }
})
