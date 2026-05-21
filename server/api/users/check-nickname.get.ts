import { and, eq, isNull, ne } from 'drizzle-orm'
import { getAuthUser } from '../../utils/auth'
import { db } from '../../db'
import { users } from '../../db/schema'

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,15}$/

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const nickname = String(query.nickname ?? '').trim()

  if (!NICKNAME_REGEX.test(nickname)) {
    throw createError({ statusCode: 400, statusMessage: '닉네임 형식이 올바르지 않아요' })
  }

  const user = await getAuthUser(event)
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.nickname, nickname),
        isNull(users.deletedAt),
        user ? ne(users.id, user.id) : undefined
      )
    )
    .limit(1)

  return { data: { available: !existing } }
})
