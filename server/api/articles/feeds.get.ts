import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { articles } from '../../db/schema'
import { FEED_SOURCES } from '../../utils/rss'

export default defineEventHandler(async () => {
  // DB에 실제로 글이 있는 피드 조회
  const [domesticRows, internationalRows] = await Promise.all([
    db.selectDistinct({ feedName: articles.feedName }).from(articles).where(eq(articles.category, 'domestic')),
    db.selectDistinct({ feedName: articles.feedName }).from(articles).where(eq(articles.category, 'international')),
  ])

  const domesticInDb = new Set(domesticRows.map((r) => r.feedName))
  const internationalInDb = new Set(internationalRows.map((r) => r.feedName))

  // FEED_SOURCES 정의 순서대로 정렬 (DB에 글이 있는 것만)
  const domestic = FEED_SOURCES
    .filter((f) => f.category === 'domestic' && domesticInDb.has(f.name))
    .map((f) => f.name)

  const international = FEED_SOURCES
    .filter((f) => f.category === 'international' && internationalInDb.has(f.name))
    .map((f) => f.name)

  return { data: { domestic, international } }
})
