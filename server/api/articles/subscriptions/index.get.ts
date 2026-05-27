import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { articleSubscriptions } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const rows = await db
    .select({ feedName: articleSubscriptions.feedName, tag: articleSubscriptions.tag })
    .from(articleSubscriptions)
    .where(eq(articleSubscriptions.userId, user.id))

  return {
    data: {
      feedNames: rows.filter((r) => r.feedName).map((r) => r.feedName!),
      tags: rows.filter((r) => r.tag).map((r) => r.tag!),
    },
  }
})
