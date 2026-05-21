import { and, eq, lt } from 'drizzle-orm'
import { db } from '../../db'
import { notifications } from '../../db/schema'

export default defineEventHandler(async (event) => {
  // Vercel Cron 요청만 허용
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

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
