import { sql } from 'drizzle-orm'
import { db } from '../db'
import { articleFeedStatuses } from '../db/schema'
import type { FeedCollectStatus } from './rss'

export async function upsertArticleFeedStatuses(statuses: FeedCollectStatus[]) {
  if (statuses.length === 0) return

  await db
    .insert(articleFeedStatuses)
    .values(statuses.map((status) => ({
      feedName: status.feedName,
      category: status.category,
      url: status.url,
      lastCheckedAt: status.checkedAt,
      lastSuccessAt: status.success ? status.checkedAt : null,
      lastError: status.error,
      lastItemCount: status.itemCount,
      updatedAt: new Date(),
    })))
    .onConflictDoUpdate({
      target: articleFeedStatuses.feedName,
      set: {
        category: sql`excluded.category`,
        url: sql`excluded.url`,
        lastCheckedAt: sql`excluded.last_checked_at`,
        lastSuccessAt: sql`CASE WHEN excluded.last_success_at IS NULL THEN ${articleFeedStatuses.lastSuccessAt} ELSE excluded.last_success_at END`,
        lastError: sql`excluded.last_error`,
        lastItemCount: sql`excluded.last_item_count`,
        updatedAt: sql`excluded.updated_at`,
      },
    })
}
