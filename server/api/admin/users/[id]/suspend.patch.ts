import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../../utils/admin'
import { userSuspendSchema } from '../../../../validation/admin'
import { db } from '../../../../db'
import { users } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '사용자 ID가 필요해요' })
  }

  const body = await readBody<unknown>(event)
  const parsed = userSuspendSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: '올바른 suspend 값을 입력해주세요' })
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: '사용자를 찾을 수 없어요' })
  }

  await db
    .update(users)
    .set({
      suspendedAt: parsed.data.suspend ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))

  return { data: { ok: true } }
})
