import { and, desc, eq, ilike, isNull, sql } from 'drizzle-orm'
import { getAuthUser } from '../../utils/auth'
import { db } from '../../db'
import { comments, likes, posts, users } from '../../db/schema'
import { parsePostCategory } from '../../validation/posts'
import { createPostExcerpt, formatCommunityDate, postCategoryLabels } from '../../utils/community'

const PAGE_SIZE = 15

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = parsePostCategory(query.category) ?? 'project'
  const jobTypeParam = query.jobType as string | undefined
  const jobType = jobTypeParam === 'developer' || jobTypeParam === 'designer' ? jobTypeParam : null
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10))

  if (category === 'feedback') {
    const user = await getAuthUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: '로그인이 필요해요' })
    }
  } else {
    setResponseHeaders(event, {
      'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
    })
  }

  const whereConditions = [eq(posts.category, category), isNull(posts.deletedAt)]
  if (jobType) whereConditions.push(eq(users.jobType, jobType))
  if (keyword) whereConditions.push(ilike(posts.title, `%${keyword}%`))

  const offset = (page - 1) * PAGE_SIZE

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: posts.id,
        category: posts.category,
        title: posts.title,
        body: posts.body,
        createdAt: posts.createdAt,
        viewCount: posts.viewCount,
        recruitmentStatus: posts.recruitmentStatus,
        author: users.nickname,
        thumbnailUrl: sql<
          string | null
        >`(SELECT url FROM post_images WHERE post_id = ${posts.id} AND "order" = 0 LIMIT 1)`,
        commentCount: sql<number>`CAST(COUNT(DISTINCT CASE WHEN ${comments.deletedAt} IS NULL THEN ${comments.id} END) AS INTEGER)`,
        likeCount: sql<number>`CAST(COUNT(DISTINCT ${likes.id}) AS INTEGER)`,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(comments, eq(comments.postId, posts.id))
      .leftJoin(likes, eq(likes.postId, posts.id))
      .where(and(...whereConditions))
      .groupBy(
        posts.id,
        posts.category,
        posts.title,
        posts.body,
        posts.createdAt,
        posts.viewCount,
        posts.recruitmentStatus,
        users.nickname
      )
      .orderBy(desc(posts.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),

    db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(and(...whereConditions)),
  ])

  const total = countRows[0]?.count ?? 0

  const list = rows.map((post) => ({
    id: post.id,
    category: postCategoryLabels[post.category],
    title: post.title,
    excerpt: createPostExcerpt(post.body),
    author: post.author ?? '알 수 없음',
    commentCount: post.commentCount,
    likeCount: post.likeCount,
    viewCount: post.viewCount,
    recruitmentStatus: post.recruitmentStatus ?? null,
    createdAt: formatCommunityDate(post.createdAt),
    thumbnailUrl: post.thumbnailUrl ?? null,
  }))

  return { data: list, total, page, pageSize: PAGE_SIZE }
})
