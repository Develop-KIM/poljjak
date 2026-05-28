import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { analyses } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const body = await readBody<{
    isPublic?: boolean
    checkedItems?: string[]
    maskedAfterHtml?: string | null
  }>(event)

  const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1)
  if (!analysis) throw createError({ statusCode: 404, statusMessage: '분석 결과를 찾을 수 없어요' })
  if (analysis.userId !== user.id)
    throw createError({ statusCode: 403, statusMessage: '권한이 없어요' })

  const updateData: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof body.isPublic === 'boolean') {
    updateData.isPublic = body.isPublic
    if (body.isPublic && !analysis.shareToken) {
      updateData.shareToken = randomUUID()
    }
  }

  if (Array.isArray(body.checkedItems)) {
    updateData.checkedItems = body.checkedItems
  }

  if ('maskedAfterHtml' in body) {
    updateData.maskedAfterHtml = body.maskedAfterHtml ?? null
  }

  const [updated] = await db.update(analyses).set(updateData).where(eq(analyses.id, id)).returning()

  return { data: updated }
})
