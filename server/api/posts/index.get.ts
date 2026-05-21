import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { getAuthUser } from '../../utils/auth'
import { db } from '../../db'
import { comments, likes, posts, users } from '../../db/schema'
import { parsePostCategory } from '../../validation/posts'
import { createPostExcerpt, formatCommunityDate, postCategoryLabels } from '../../utils/community'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = parsePostCategory(query.category) ?? 'project'
  const jobTypeParam = query.jobType as string | undefined
  const jobType =
    jobTypeParam === 'developer' || jobTypeParam === 'designer' ? jobTypeParam : null

  if (category === 'feedback') {
    const user = await getAuthUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: '로그인이 필요해요' })
    }
  }

  const whereConditions = [eq(posts.category, category), isNull(posts.deletedAt)]
  if (jobType) {
    whereConditions.push(eq(users.jobType, jobType))
  }

  const rows = await db
    .select({
      id: posts.id,
      category: posts.category,
      title: posts.title,
      body: posts.body,
      createdAt: posts.createdAt,
      author: users.nickname,
      commentCount: sql<number>`CAST(COUNT(DISTINCT CASE WHEN ${comments.deletedAt} IS NULL THEN ${comments.id} END) AS INTEGER)`,
      likeCount: sql<number>`CAST(COUNT(DISTINCT ${likes.id}) AS INTEGER)`,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .leftJoin(likes, eq(likes.postId, posts.id))
    .where(and(...whereConditions))
    .groupBy(posts.id, posts.category, posts.title, posts.body, posts.createdAt, users.nickname)
    .orderBy(desc(posts.createdAt))
    .limit(30)

  const list = rows.map((post) => ({
    id: post.id,
    category: postCategoryLabels[post.category],
    title: post.title,
    excerpt: createPostExcerpt(post.body),
    author: post.author ?? '알 수 없음',
    commentCount: post.commentCount,
    likeCount: post.likeCount,
    createdAt: formatCommunityDate(post.createdAt),
  }))

  return { data: list }
})
