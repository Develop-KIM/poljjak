import { asc } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/admin'
import { db } from '../../../db'
import { articleFeedStatuses } from '../../../db/schema'
import { getArticleSourceLabel } from '../../../utils/article-sources'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db
    .select({
      feedName: articleFeedStatuses.feedName,
      category: articleFeedStatuses.category,
      url: articleFeedStatuses.url,
      lastCheckedAt: articleFeedStatuses.lastCheckedAt,
      lastSuccessAt: articleFeedStatuses.lastSuccessAt,
      lastError: articleFeedStatuses.lastError,
      lastItemCount: articleFeedStatuses.lastItemCount,
    })
    .from(articleFeedStatuses)
    .orderBy(asc(articleFeedStatuses.category), asc(articleFeedStatuses.feedName))

  return {
    data: rows.map((row) => ({
      ...row,
      sourceLabel: getArticleSourceLabel(row.feedName),
      lastCheckedAt: row.lastCheckedAt.toISOString(),
      lastSuccessAt: row.lastSuccessAt?.toISOString() ?? null,
      ok: !row.lastError,
    })),
  }
})
