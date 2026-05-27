import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { db } from '../../../db'
import { articleClicks, articles } from '../../../db/schema'

const schema = z.object({
  clientId: z.string().trim().min(8).max(120).optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const body = await readValidatedBody(event, schema.parse)
  const user = await getAuthUser(event)

  const [article] = await db.select({ id: articles.id }).from(articles).where(eq(articles.id, id)).limit(1)
  if (!article) throw createError({ statusCode: 404, statusMessage: '아티클을 찾을 수 없어요' })

  await db.insert(articleClicks).values({
    articleId: id,
    userId: user?.id ?? null,
    clientId: body.clientId ?? null,
  })

  return { data: { recorded: true } }
})
