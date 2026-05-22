import { desc, eq, sql } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/admin'
import { formatCommunityDate } from '../../../utils/community'
import { db } from '../../../db'
import { analyses, users } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  // 관리자 권한 확인
  await requireAdmin(event)

  // status = 'failed'인 분석 최근 50건, users 테이블 leftJoin으로 nickname 조회
  const rows = await db
    .select({
      id: analyses.id,
      userId: analyses.userId,
      userNickname: sql<string>`COALESCE(${users.nickname}, '(탈퇴한 사용자)')`,
      pdfUrl: analyses.pdfUrl,
      createdAt: analyses.createdAt,
    })
    .from(analyses)
    .leftJoin(users, eq(analyses.userId, users.id))
    .where(sql`${analyses.status} = 'failed'`)
    .orderBy(desc(analyses.createdAt))
    .limit(50)

  return {
    data: rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      userNickname: row.userNickname,
      pdfUrl: row.pdfUrl,
      createdAt: formatCommunityDate(row.createdAt),
    })),
  }
})
