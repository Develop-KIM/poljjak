import { requireAdmin } from '../../../utils/admin'
import { collectAllFeeds } from '../../../utils/rss'
import { db } from '../../../db'
import { articleBookmarks, articles } from '../../../db/schema'
import { inArray, lt } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  // 90일 이상 된 아티클 정리
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const oldArticles = await db.select({ id: articles.id }).from(articles).where(lt(articles.publishedAt, cutoff))
  if (oldArticles.length > 0) {
    const oldIds = oldArticles.map((a) => a.id)
    await db.delete(articleBookmarks).where(inArray(articleBookmarks.articleId, oldIds))
    await db.delete(articles).where(inArray(articles.id, oldIds))
  }

  let parsed: Awaited<ReturnType<typeof collectAllFeeds>> = []
  try {
    parsed = await collectAllFeeds()
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: '피드 수집 중 오류가 발생했어요' })
  }

  if (parsed.length === 0) {
    return { data: { inserted: 0, skipped: 0, cleaned: oldArticles.length } }
  }

  const inserted = await db
    .insert(articles)
    .values(parsed)
    .onConflictDoNothing({ target: articles.url })
    .returning({ id: articles.id })

  return {
    data: {
      inserted: inserted.length,
      skipped: parsed.length - inserted.length,
      cleaned: oldArticles.length,
    },
  }
})
