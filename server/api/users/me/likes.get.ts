import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { comments, likes, posts } from '../../../db/schema'
import { formatCommunityDate, postCategoryLabels } from '../../../utils/community'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const rows = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      createdAt: posts.createdAt,
      likedAt: likes.createdAt,
      commentCount: sql<number>`CAST(COUNT(DISTINCT CASE WHEN ${comments.deletedAt} IS NULL THEN ${comments.id} END) AS INTEGER)`,
      likeCount: sql<number>`CAST(COUNT(DISTINCT ${likes.id}) AS INTEGER)`,
    })
    .from(likes)
    .innerJoin(posts, and(eq(posts.id, likes.postId), isNull(posts.deletedAt)))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .where(eq(likes.userId, user.id))
    .groupBy(posts.id, posts.category, posts.title, posts.createdAt, likes.createdAt)
    .orderBy(desc(likes.createdAt))

  return {
    data: rows.map((p) => ({
      id: p.id,
      category: postCategoryLabels[p.category],
      title: p.title,
      createdAt: formatCommunityDate(p.createdAt),
      commentCount: p.commentCount,
      likeCount: p.likeCount,
    })),
  }
})
