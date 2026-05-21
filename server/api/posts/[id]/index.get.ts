import { and, count, eq, isNull } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { db } from '../../../db'
import { analyses, comments, likes, posts, users } from '../../../db/schema'
import { formatCommunityDate, getAuthorInitial, postCategoryLabels } from '../../../utils/community'
import type { AnalysisResult } from '../../../utils/clova'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })
  }

  const [post] = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      body: posts.body,
      analysisId: posts.analysisId,
      createdAt: posts.createdAt,
      author: users.nickname,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1)

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: '게시글을 찾을 수 없어요' })
  }

  if (post.category === 'feedback') {
    const user = await getAuthUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: '로그인이 필요해요' })
    }
  }

  const [[commentCountRow], [likeCountRow]] = await Promise.all([
    db
      .select({ value: count(comments.id) })
      .from(comments)
      .where(and(eq(comments.postId, post.id), isNull(comments.deletedAt))),
    db
      .select({ value: count(likes.id) })
      .from(likes)
      .where(eq(likes.postId, post.id)),
  ])

  let analysis: { id: string; result: AnalysisResult } | null = null
  if (post.analysisId) {
    const [analysisRow] = await db
      .select({
        id: analyses.id,
        result: analyses.result,
      })
      .from(analyses)
      .where(eq(analyses.id, post.analysisId))
      .limit(1)

    if (analysisRow?.result) {
      analysis = {
        id: analysisRow.id,
        result: analysisRow.result as AnalysisResult,
      }
    }
  }

  const author = post.author ?? '알 수 없음'

  return {
    data: {
      id: post.id,
      category: postCategoryLabels[post.category],
      title: post.title,
      body: post.body,
      author,
      authorInitial: getAuthorInitial(author),
      authorAvatarUrl: post.authorAvatarUrl ?? null,
      createdAt: formatCommunityDate(post.createdAt),
      commentCount: commentCountRow?.value ?? 0,
      likeCount: likeCountRow?.value ?? 0,
      analysisId: post.analysisId,
      analysis,
    },
  }
})
