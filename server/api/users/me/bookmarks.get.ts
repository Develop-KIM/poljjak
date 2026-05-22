import { desc, eq, isNull, sql } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { bookmarks, comments, likes, posts } from '../../../db/schema'
import { formatCommunityDate, postCategoryLabels } from '../../../utils/community'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const rows = await db
    .select({
      bookmarkId: bookmarks.id,
      bookmarkedAt: bookmarks.createdAt,
      postId: posts.id,
      category: posts.category,
      title: posts.title,
      postCreatedAt: posts.createdAt,
      postDeletedAt: posts.deletedAt,
      commentCount: sql<number>`CAST(COUNT(DISTINCT CASE WHEN ${comments.deletedAt} IS NULL THEN ${comments.id} END) AS INTEGER)`,
      likeCount: sql<number>`CAST(COUNT(DISTINCT ${likes.id}) AS INTEGER)`,
    })
    .from(bookmarks)
    .leftJoin(posts, eq(posts.id, bookmarks.postId))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .leftJoin(likes, eq(likes.postId, posts.id))
    .where(eq(bookmarks.userId, user.id))
    .groupBy(
      bookmarks.id,
      bookmarks.createdAt,
      posts.id,
      posts.category,
      posts.title,
      posts.createdAt,
      posts.deletedAt,
    )
    .orderBy(desc(bookmarks.createdAt))

  return {
    data: rows.map((r) => {
      const isDeleted = !r.postId || !!r.postDeletedAt
      return {
        bookmarkId: r.bookmarkId,
        bookmarkedAt: formatCommunityDate(r.bookmarkedAt),
        postId: r.postId ?? null,
        category: r.category ? postCategoryLabels[r.category] : null,
        title: isDeleted ? null : r.title,
        isDeleted,
        createdAt: r.postCreatedAt ? formatCommunityDate(r.postCreatedAt) : null,
        commentCount: r.commentCount ?? 0,
        likeCount: r.likeCount ?? 0,
      }
    }),
  }
})
