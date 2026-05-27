import { eq } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { db } from '../../../db'
import { articles } from '../../../db/schema'
import { summarizeArticle } from '../../../utils/clova'
import { fetchArticleText } from '../../../utils/article-fetcher'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const [article] = await db
    .select({ id: articles.id, title: articles.title, url: articles.url, summary: articles.summary, aiSummary: articles.aiSummary })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1)

  if (!article) throw createError({ statusCode: 404, statusMessage: '아티클을 찾을 수 없어요' })

  // 이미 AI 요약이 있으면 재생성 안 함
  if (article.aiSummary) {
    const [full] = await db
      .select({ aiSummary: articles.aiSummary, aiKeyPoints: articles.aiKeyPoints, aiConcepts: articles.aiConcepts, aiDifficulty: articles.aiDifficulty })
      .from(articles).where(eq(articles.id, id)).limit(1)
    return { data: full }
  }

  // 원문 텍스트 추출 (실패하면 RSS 요약으로 fallback)
  let content = article.summary ?? ''
  try {
    const fetched = await fetchArticleText(article.url)
    if (fetched.length > 200) content = fetched
  } catch {
    if (!content) throw createError({ statusCode: 422, statusMessage: '아티클 내용을 가져올 수 없어요' })
  }

  const result = await summarizeArticle(article.title, content)

  await db.update(articles).set({
    aiSummary: result.summary,
    aiKeyPoints: result.keyPoints,
    aiConcepts: result.concepts,
    aiDifficulty: result.difficulty,
  }).where(eq(articles.id, id))

  return {
    data: {
      aiSummary: result.summary,
      aiKeyPoints: result.keyPoints,
      aiConcepts: result.concepts,
      aiDifficulty: result.difficulty,
    },
  }
})
