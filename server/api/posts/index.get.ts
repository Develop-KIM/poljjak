import { and, desc, eq, ilike, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { getAuthUser } from '../../utils/auth'
import { db } from '../../db'
import { bookmarks, comments, likes, posts, users } from '../../db/schema'
import { parsePostCategory } from '../../validation/posts'
import { createPostExcerpt, formatCommunityDate, postCategoryLabels } from '../../utils/community'

const PAGE_SIZE = 15

export default defineEventHandler(async (event) => {
  const [query, user] = [getQuery(event), await getAuthUser(event)]
  const category = parsePostCategory(query.category) ?? 'project'
  const jobTypeParam = typeof query.jobType === 'string' ? query.jobType : null
  const careerLevelParam = typeof query.careerLevel === 'string' ? query.careerLevel : null
  const hasAnalysisParam = query.hasAnalysis === 'true'
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10))
  const sortParam = query.sort as string | undefined
  const sort = sortParam === 'popular' ? 'popular' : 'latest'

  // 비로그인 + 피드백 외 카테고리에만 캐시 적용 (로그인 사용자는 isBookmarked가 개인화됨)
  if (category !== 'feedback' && !user) {
    setResponseHeaders(event, {
      'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
    })
  }

  const whereConditions = [eq(posts.category, category), isNull(posts.deletedAt)]
  if (category === 'feedback' && jobTypeParam) whereConditions.push(eq(posts.jobType, jobTypeParam))
  if (category === 'feedback' && careerLevelParam) {
    const validLevels = ['entry', 'junior', 'mid', 'senior']
    if (validLevels.includes(careerLevelParam)) {
      whereConditions.push(
        eq(posts.careerLevel, careerLevelParam as 'entry' | 'junior' | 'mid' | 'senior')
      )
    }
  }
  if (category === 'feedback' && hasAnalysisParam) whereConditions.push(isNotNull(posts.analysisId))
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
      .orderBy(
        sort === 'popular'
          ? sql`${sql`COUNT(DISTINCT ${likes.id})`} DESC, ${posts.viewCount} DESC, ${posts.createdAt} DESC`
          : desc(posts.createdAt)
      )
      .limit(PAGE_SIZE)
      .offset(offset),

    db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(and(...whereConditions)),
  ])

  const total = countRows[0]?.count ?? 0

  // 로그인 사용자의 북마크 목록 배치 조회
  const postIds = rows.map((r) => r.id)
  const bookmarkedSet = new Set<string>()
  if (user && postIds.length > 0) {
    const bookmarkedRows = await db
      .select({ postId: bookmarks.postId })
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, user.id), inArray(bookmarks.postId, postIds)))
    bookmarkedRows.forEach((b) => bookmarkedSet.add(b.postId))
  }

  const list = rows.map((post) => ({
    id: post.id,
    category: postCategoryLabels[post.category],
    title: post.title,
    excerpt: createPostExcerpt(post.body),
    author: post.author ?? '탈퇴한 사용자',
    commentCount: post.commentCount,
    likeCount: post.likeCount,
    viewCount: post.viewCount,
    recruitmentStatus: post.recruitmentStatus ?? null,
    createdAt: formatCommunityDate(post.createdAt),
    thumbnailUrl: post.thumbnailUrl ?? null,
    isBookmarked: bookmarkedSet.has(post.id),
  }))

  return { data: list, total, page, pageSize: PAGE_SIZE }
})
