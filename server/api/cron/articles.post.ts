import { inArray, lt } from 'drizzle-orm'
import { requireCronAuth } from '../../utils/cron'
import { collectAllFeeds } from '../../utils/rss'
import { db } from '../../db'
import { articleBookmarks, articles } from '../../db/schema'

export default defineEventHandler(async (event) => {
  requireCronAuth(event)

  // 90일 이상 된 아티클 정리
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const oldArticles = await db
    .select({ id: articles.id })
    .from(articles)
    .where(lt(articles.publishedAt, cutoff))

  if (oldArticles.length > 0) {
    const oldIds = oldArticles.map((a) => a.id)
    await db.delete(articleBookmarks).where(inArray(articleBookmarks.articleId, oldIds))
    await db.delete(articles).where(inArray(articles.id, oldIds))
  }

  // RSS 피드 수집
  let parsed: Awaited<ReturnType<typeof collectAllFeeds>> = []
  try {
    parsed = await collectAllFeeds()
  } catch (err) {
    console.error('[cron/articles] 피드 수집 실패:', err)
    return { data: { inserted: 0, skipped: 0, error: 'feed collection failed' } }
  }

  if (parsed.length === 0) {
    return { data: { inserted: 0, skipped: 0 } }
  }

  // URL 기준 upsert — 중복 URL은 무시
  const result = await db
    .insert(articles)
    .values(parsed)
    .onConflictDoNothing({ target: articles.url })
    .returning({ id: articles.id })

  return {
    data: {
      inserted: result.length,
      skipped: parsed.length - result.length,
    },
  }
})
