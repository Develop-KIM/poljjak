import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdmin } from '../../../../utils/admin'
import { db } from '../../../../db'
import { comments, posts, reports } from '../../../../db/schema'

// 신고 처리 요청 스키마
const resolveSchema = z.object({
  deleteContent: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
  // 관리자 권한 확인
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '신고 ID가 필요해요' })
  }

  // 신고 조회
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1)

  if (!report) {
    throw createError({ statusCode: 404, statusMessage: '신고를 찾을 수 없어요' })
  }

  // 이미 처리된 신고
  if (report.status === 'resolved') {
    throw createError({ statusCode: 409, statusMessage: '이미 처리된 신고예요' })
  }

  const body = await readBody<unknown>(event)
  const parsed = resolveSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: '입력값을 확인해주세요' })
  }

  const { deleteContent } = parsed.data

  // 콘텐츠 삭제 요청 시 소프트 삭제 처리
  if (deleteContent) {
    if (report.targetType === 'post') {
      await db
        .update(posts)
        .set({ deletedAt: new Date() })
        .where(eq(posts.id, report.targetId))
    } else {
      await db
        .update(comments)
        .set({ deletedAt: new Date() })
        .where(eq(comments.id, report.targetId))
    }
  }

  // 신고 상태를 resolved로 업데이트
  await db
    .update(reports)
    .set({ status: 'resolved', resolvedAt: new Date() })
    .where(eq(reports.id, id))

  return { data: { ok: true } }
})
