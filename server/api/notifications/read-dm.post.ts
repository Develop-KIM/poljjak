import { and, eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { notifications } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.type, 'dm')))

  return { data: { ok: true } }
})
