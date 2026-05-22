import { and, count, desc, eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/admin'
import { db } from '../../../db'
import { comments, posts, reports, users } from '../../../db/schema'
import { formatCommunityDate } from '../../../utils/community'

const PAGE_SIZE = 20

export default defineEventHandler(async (event) => {
  // 관리자 권한 확인
  await requireAdmin(event)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const page = Math.max(1, Number(query.page ?? 1))
  const offset = (page - 1) * PAGE_SIZE

  // status 파라미터 유효성 확인
  const statusFilter =
    status === 'pending' || status === 'resolved'
      ? eq(reports.status, status)
      : undefined

  // 신고 목록 조회 (신고자 join, 게시글·댓글 preview 포함)
  const rows = await db
    .select({
      id: reports.id,
      targetType: reports.targetType,
      targetId: reports.targetId,
      reason: reports.reason,
      status: reports.status,
      createdAt: reports.createdAt,
      resolvedAt: reports.resolvedAt,
      reporterNickname: users.nickname,
      postTitle: posts.title,
      commentContent: comments.content,
    })
    .from(reports)
    .leftJoin(users, eq(reports.reporterId, users.id))
    .leftJoin(
      posts,
      and(eq(reports.targetType, 'post'), eq(reports.targetId, posts.id))
    )
    .leftJoin(
      comments,
      and(eq(reports.targetType, 'comment'), eq(reports.targetId, comments.id))
    )
    .where(statusFilter ?? undefined)
    .orderBy(desc(reports.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset)

  // 전체 건수 조회
  const [totalRow] = await db
    .select({ count: count() })
    .from(reports)
    .where(statusFilter ?? undefined)

  const items = rows.map((row) => {
    // 게시글이면 title, 댓글이면 content 앞 100자
    const targetPreview =
      row.targetType === 'post'
        ? (row.postTitle ?? '').slice(0, 100)
        : (row.commentContent ?? '').slice(0, 100)

    return {
      id: row.id,
      targetType: row.targetType,
      targetId: row.targetId,
      targetPreview,
      reason: row.reason,
      reporterNickname: row.reporterNickname ?? '탈퇴한 사용자',
      status: row.status,
      createdAt: formatCommunityDate(row.createdAt),
      resolvedAt: row.resolvedAt ? formatCommunityDate(row.resolvedAt) : null,
    }
  })

  return {
    data: {
      items,
      total: totalRow?.count ?? 0,
    },
  }
})
