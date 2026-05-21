import { and, eq, lt } from 'drizzle-orm'
import { db } from '../../db'
import { notifications } from '../../db/schema'
import { requireCronAuth } from '../../utils/cron'

export default defineEventHandler(async (event) => {
  requireCronAuth(event)

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const result = await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.isRead, true),
        lt(notifications.createdAt, thirtyDaysAgo),
      ),
    )

  return { data: { deleted: (result as unknown as { rowCount: number }).rowCount ?? 0, before: thirtyDaysAgo } }
})
