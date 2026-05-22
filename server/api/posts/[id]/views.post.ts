import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { posts } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))

  return { data: null }
})
