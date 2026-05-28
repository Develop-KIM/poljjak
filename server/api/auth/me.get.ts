import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // 세션 시작 시 lastLoginAt 갱신 (응답에 영향 없도록 fire-and-forget)
  db.update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id))
    .catch(() => {})

  return { data: user }
})
