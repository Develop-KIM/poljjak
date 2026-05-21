import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { reports } from '../../db/schema'

const reportCreateSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.string().uuid('잘못된 신고 대상이에요'),
  reason: z.string().min(1, '신고 사유를 선택해주세요').max(100),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const body = await readBody<unknown>(event)
  const parsed = reportCreateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요',
    })
  }

  const { targetType, targetId, reason } = parsed.data

  // 중복 신고 방지
  const [existing] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, user.id),
        eq(reports.targetType, targetType),
        eq(reports.targetId, targetId)
      )
    )
    .limit(1)

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: '이미 신고한 게시물이에요' })
  }

  await db.insert(reports).values({
    reporterId: user.id,
    targetType,
    targetId,
    reason,
  })

  return { data: { ok: true } }
})
