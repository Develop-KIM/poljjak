import { and, eq, isNull, ne } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { users } from '../../db/schema'
import { onboardingSchema } from '../../validation/users'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readValidatedBody(event, onboardingSchema.parse)
  const nickname = body.nickname.trim()

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.nickname, nickname), isNull(users.deletedAt), ne(users.id, user.id)))
    .limit(1)

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: '이미 사용 중인 닉네임이에요' })
  }

  const [updated] = await db
    .update(users)
    .set({
      nickname,
      jobType: body.jobType ?? null,
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning()

  return { data: updated }
})
