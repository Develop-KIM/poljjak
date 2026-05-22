import { desc, eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/admin'
import { db } from '../../../db'
import { prompts, users } from '../../../db/schema'

// GET /api/admin/prompts?jobType=developer|designer
// 해당 jobType의 활성 프롬프트와 히스토리 목록 반환
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const jobType = query.jobType as string | undefined

  // jobType 파라미터 필수
  if (!jobType || (jobType !== 'developer' && jobType !== 'designer')) {
    throw createError({ statusCode: 400, statusMessage: 'jobType은 developer 또는 designer여야 해요' })
  }

  // prompts + users leftJoin으로 작성자 닉네임 조회
  const rows = await db
    .select({
      id: prompts.id,
      content: prompts.content,
      isActive: prompts.isActive,
      createdAt: prompts.createdAt,
      createdByNickname: users.nickname,
    })
    .from(prompts)
    .leftJoin(users, eq(prompts.createdBy, users.id))
    .where(eq(prompts.jobType, jobType))
    .orderBy(desc(prompts.isActive), desc(prompts.createdAt))

  // 활성 프롬프트 (is_active=true인 첫 번째 row)
  const activeRow = rows.find((r) => r.isActive)
  const active = activeRow
    ? {
        id: activeRow.id,
        content: activeRow.content,
        createdAt: activeRow.createdAt.toISOString(),
      }
    : null

  // 전체 히스토리 목록
  const history = rows.map((r) => ({
    id: r.id,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    createdByNickname: r.createdByNickname ?? '알 수 없음',
  }))

  return { data: { active, history } }
})
