import { and, eq, inArray, lt } from 'drizzle-orm'
import { requireCronAuth } from '../../utils/cron'
import { collectAllFeeds } from '../../utils/rss'
import { db } from '../../db'
import { articleBookmarks, articleSubscriptions, articles, notifications } from '../../db/schema'

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
  const inserted = await db
    .insert(articles)
    .values(parsed)
    .onConflictDoNothing({ target: articles.url })
    .returning({ id: articles.id, feedName: articles.feedName, tags: articles.tags, url: articles.url })

  // 새로 삽입된 아티클이 없으면 알림 생략
  if (inserted.length === 0) {
    return { data: { inserted: 0, skipped: parsed.length } }
  }

  // 구독자 알림 생성
  try {
    const allSubs = await db.select().from(articleSubscriptions)
    if (allSubs.length > 0) {
      const notifRows: Array<{
        userId: string; type: 'article'; referenceId: string; linkUrl: string
      }> = []

      for (const article of inserted) {
        // 해당 feedName 구독자
        const feedSubs = allSubs.filter((s) => s.feedName === article.feedName)
        for (const sub of feedSubs) {
          notifRows.push({
            userId: sub.userId, type: 'article',
            referenceId: article.id, linkUrl: `/articles?feedName=${encodeURIComponent(article.feedName)}`,
          })
        }
        // 태그 구독자
        for (const tag of article.tags) {
          const tagSubs = allSubs.filter((s) => s.tag === tag && !feedSubs.some((f) => f.userId === s.userId))
          for (const sub of tagSubs) {
            notifRows.push({
              userId: sub.userId, type: 'article',
              referenceId: article.id, linkUrl: `/articles?tag=${encodeURIComponent(tag)}`,
            })
          }
        }
      }

      // 중복 제거 (같은 userId+referenceId)
      const seen = new Set<string>()
      const deduped = notifRows.filter((r) => {
        const key = `${r.userId}:${r.referenceId}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      if (deduped.length > 0) {
        await db.insert(notifications).values(deduped.map((r) => ({
          userId: r.userId, actorId: null, type: r.type,
          referenceId: r.referenceId, linkUrl: r.linkUrl,
        })))
      }
    }
  } catch (err) {
    console.error('[cron/articles] 구독 알림 생성 실패:', err)
  }

  return {
    data: {
      inserted: inserted.length,
      skipped: parsed.length - inserted.length,
    },
  }
})
