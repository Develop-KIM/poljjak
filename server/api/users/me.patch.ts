import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { users } from '../../db/schema'
import { onboardingSchema } from '../../validation/users'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readValidatedBody(event, onboardingSchema.parse)

  const [updated] = await db
    .update(users)
    .set({
      nickname: body.nickname,
      jobType: body.jobType ?? null,
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning()

  return { data: updated }
})
