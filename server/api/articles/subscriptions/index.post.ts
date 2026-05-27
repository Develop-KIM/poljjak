import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { articleSubscriptions } from '../../../db/schema'

const schema = z.object({
  feedName: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
}).refine((d) => d.feedName || d.tag, { message: '출처 또는 태그 중 하나는 필요해요' })

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readValidatedBody(event, schema.parse)

  const condition = body.feedName
    ? and(eq(articleSubscriptions.userId, user.id), eq(articleSubscriptions.feedName, body.feedName))
    : and(eq(articleSubscriptions.userId, user.id), eq(articleSubscriptions.tag, body.tag!))

  const [existing] = await db.select({ id: articleSubscriptions.id }).from(articleSubscriptions).where(condition).limit(1)

  if (existing) {
    await db.delete(articleSubscriptions).where(eq(articleSubscriptions.id, existing.id))
    return { data: { subscribed: false } }
  }

  await db.insert(articleSubscriptions).values({
    userId: user.id,
    feedName: body.feedName ?? null,
    tag: body.tag ?? null,
  })
  return { data: { subscribed: true } }
})
