import { and, asc, count, eq, isNull } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { db } from '../../../db'
import { analyses, comments, likes, postImages, posts, users } from '../../../db/schema'
import { formatCommunityDate, getAuthorInitial, getAvatarUrl, postCategoryLabels } from '../../../utils/community'
import type { AnalysisResult } from '../../../utils/clova'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })
  }

  const [[post], user] = await Promise.all([
    db
      .select({
        id: posts.id,
        userId: posts.userId,
        category: posts.category,
        title: posts.title,
        body: posts.body,
        analysisId: posts.analysisId,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        author: users.nickname,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1),
    getAuthUser(event),
  ])

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: '게시글을 찾을 수 없어요' })
  }

  if (post.category === 'feedback' && !user) {
    throw createError({ statusCode: 401, statusMessage: '로그인이 필요해요' })
  }

  const isOwner = !!user && post.userId === user.id

  const [[commentCountRow], [likeCountRow], likedRow] = await Promise.all([
    db
      .select({ value: count(comments.id) })
      .from(comments)
      .where(and(eq(comments.postId, post.id), isNull(comments.deletedAt))),
    db
      .select({ value: count(likes.id) })
      .from(likes)
      .where(eq(likes.postId, post.id)),
    user
      ? db
          .select({ id: likes.id })
          .from(likes)
          .where(and(eq(likes.postId, post.id), eq(likes.userId, user.id)))
          .limit(1)
      : Promise.resolve([]),
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

  const imageRows = await db
    .select({ url: postImages.url })
    .from(postImages)
    .where(eq(postImages.postId, post.id))
    .orderBy(asc(postImages.order))

  const author = post.author ?? '탈퇴한 사용자'

  return {
    data: {
      id: post.id,
      category: postCategoryLabels[post.category],
      title: post.title,
      body: post.body,
      author,
      authorInitial: getAuthorInitial(author),
      authorAvatarUrl: getAvatarUrl(post.authorAvatarUrl, author),
      viewCount: post.viewCount,
      createdAt: formatCommunityDate(post.createdAt),
      commentCount: commentCountRow?.value ?? 0,
      likeCount: likeCountRow?.value ?? 0,
      authorId: post.userId,
      isOwner,
      isLiked: likedRow.length > 0,
      analysisId: post.analysisId,
      analysis,
      imageUrls: imageRows.map((r) => r.url),
    },
  }
})
