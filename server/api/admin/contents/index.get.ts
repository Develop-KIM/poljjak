import { count, desc, eq, ilike, or } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/admin'
import { db } from '../../../db'
import { comments, posts, users } from '../../../db/schema'
import { formatCommunityDate } from '../../../utils/community'

const PAGE_SIZE = 20

// 콘텐츠 항목 타입
interface ContentItem {
  id: string
  type: 'post' | 'comment'
  content: string
  authorNickname: string
  createdAt: string
  isDeleted: boolean
}

export default defineEventHandler(async (event) => {
  // 관리자 권한 확인
  await requireAdmin(event)

  const query = getQuery(event)
  const q = query.q as string | undefined
  const type = query.type as string | undefined
  const page = Math.max(1, Number(query.page ?? 1))
  const offset = (page - 1) * PAGE_SIZE

  const fetchPosts = !type || type === 'post'
  const fetchComments = !type || type === 'comment'

  let postItems: ContentItem[] = []
  let commentItems: ContentItem[] = []
  let postTotal = 0
  let commentTotal = 0

  // 게시글 조회
  if (fetchPosts) {
    // 키워드 필터 (title 또는 body ILIKE)
    const postWhere = q
      ? or(ilike(posts.title, `%${q}%`), ilike(posts.body, `%${q}%`))
      : undefined

    const postRows = await db
      .select({
        id: posts.id,
        title: posts.title,
        authorNickname: users.nickname,
        createdAt: posts.createdAt,
        deletedAt: posts.deletedAt,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(postWhere)
      .orderBy(desc(posts.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset)

    const [postTotalRow] = await db
      .select({ count: count() })
      .from(posts)
      .where(postWhere)

    postTotal = postTotalRow?.count ?? 0

    postItems = postRows.map((row) => ({
      id: row.id,
      type: 'post' as const,
      content: row.title.slice(0, 100),
      authorNickname: row.authorNickname ?? '탈퇴한 사용자',
      createdAt: formatCommunityDate(row.createdAt),
      isDeleted: row.deletedAt !== null,
    }))
  }

  // 댓글 조회
  if (fetchComments) {
    // 키워드 필터 (content ILIKE)
    const commentWhere = q ? ilike(comments.content, `%${q}%`) : undefined

    const commentRows = await db
      .select({
        id: comments.id,
        content: comments.content,
        authorNickname: users.nickname,
        createdAt: comments.createdAt,
        deletedAt: comments.deletedAt,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(commentWhere)
      .orderBy(desc(comments.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset)

    const [commentTotalRow] = await db
      .select({ count: count() })
      .from(comments)
      .where(commentWhere)

    commentTotal = commentTotalRow?.count ?? 0

    commentItems = commentRows.map((row) => ({
      id: row.id,
      type: 'comment' as const,
      content: row.content.slice(0, 100),
      authorNickname: row.authorNickname ?? '탈퇴한 사용자',
      createdAt: formatCommunityDate(row.createdAt),
      isDeleted: row.deletedAt !== null,
    }))
  }

  // 게시글과 댓글 합산 후 createdAt 내림차순 정렬
  const allItems = [...postItems, ...commentItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return {
    data: {
      items: allItems,
      total: postTotal + commentTotal,
    },
  }
})
