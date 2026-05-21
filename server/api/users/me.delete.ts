import { eq } from 'drizzle-orm'
import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id))

  // Supabase Auth 세션 무효화
  const client = await serverSupabaseClient(event)
  await client.auth.signOut()

  return { data: { success: true } }
})
