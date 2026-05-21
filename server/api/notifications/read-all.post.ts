import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { notifications } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, user.id))

  return { data: { ok: true } }
})
