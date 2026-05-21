import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { analyses } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, statusMessage: '잘못된 링크예요' })

  const [analysis] = await db.select().from(analyses).where(eq(analyses.shareToken, token)).limit(1)

  if (!analysis || !analysis.isPublic) {
    throw createError({
      statusCode: 404,
      statusMessage: '비공개이거나 존재하지 않는 분석 결과예요',
    })
  }

  return { data: analysis }
})
