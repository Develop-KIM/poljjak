import { eq } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { db } from '../../../db'
import { analyses } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })
  }

  const user = await getAuthUser(event)

  const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1)

  if (!analysis) {
    throw createError({ statusCode: 404, statusMessage: '분석 결과를 찾을 수 없어요' })
  }

  // 비공개이고 본인이 아니면 차단
  if (!analysis.isPublic && analysis.userId !== user?.id) {
    throw createError({ statusCode: 403, statusMessage: '비공개 분석 결과예요' })
  }

  return { data: analysis }
})
