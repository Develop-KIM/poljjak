import { asc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { articles } from '../../db/schema'

export default defineEventHandler(async () => {
  // DB에 실제로 글이 있는 피드만 반환
  const [domesticRows, internationalRows] = await Promise.all([
    db
      .selectDistinct({ feedName: articles.feedName })
      .from(articles)
      .where(eq(articles.category, 'domestic'))
      .orderBy(asc(articles.feedName)),
    db
      .selectDistinct({ feedName: articles.feedName })
      .from(articles)
      .where(eq(articles.category, 'international'))
      .orderBy(asc(articles.feedName)),
  ])

  return {
    data: {
      domestic: domesticRows.map((r) => r.feedName),
      international: internationalRows.map((r) => r.feedName),
    },
  }
})
