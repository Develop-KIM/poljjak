import { desc, eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { analyses } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const list = await db
    .select({
      id: analyses.id,
      title: analyses.title,
      status: analyses.status,
      isPublic: analyses.isPublic,
      createdAt: analyses.createdAt,
    })
    .from(analyses)
    .where(eq(analyses.userId, user.id))
    .orderBy(desc(analyses.createdAt))
    .limit(20)

  return { data: list }
})
