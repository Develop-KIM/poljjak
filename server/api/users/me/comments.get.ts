import { and, desc, eq, isNull } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { comments, posts } from '../../../db/schema'
import { formatCommunityDate } from '../../../utils/community'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const rows = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      postId: comments.postId,
      postTitle: posts.title,
      postDeletedAt: posts.deletedAt,
    })
    .from(comments)
    .leftJoin(posts, eq(comments.postId, posts.id))
    .where(and(eq(comments.userId, user.id), isNull(comments.deletedAt)))
    .orderBy(desc(comments.createdAt))

  return {
    data: rows.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: formatCommunityDate(c.createdAt),
      postId: c.postId,
      postTitle: c.postDeletedAt ? null : (c.postTitle ?? null),
    })),
  }
})
