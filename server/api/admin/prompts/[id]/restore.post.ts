import { and, eq } from 'drizzle-orm'
import { requireAdmin } from '../../../../utils/admin'
import { db } from '../../../../db'
import { prompts } from '../../../../db/schema'

// POST /api/admin/prompts/{id}/restore
// 특정 프롬프트를 활성 상태로 복원 (트랜잭션)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '프롬프트 id가 필요해요' })
  }

  // 대상 프롬프트 조회
  const [target] = await db
    .select({ id: prompts.id, jobType: prompts.jobType })
    .from(prompts)
    .where(eq(prompts.id, id))
    .limit(1)

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: '프롬프트를 찾을 수 없어요' })
  }

  // 트랜잭션: 같은 jobType 활성 프롬프트 비활성화 → 대상 프롬프트 활성화
  await db.transaction(async (tx) => {
    // 1. 같은 jobType의 기존 is_active=true를 false로
    await tx
      .update(prompts)
      .set({ isActive: false })
      .where(and(eq(prompts.jobType, target.jobType), eq(prompts.isActive, true)))

    // 2. 해당 id를 is_active=true로
    await tx.update(prompts).set({ isActive: true }).where(eq(prompts.id, target.id))
  })

  return { data: { ok: true } }
})
