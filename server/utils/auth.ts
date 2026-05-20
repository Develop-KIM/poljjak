import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

// 로그인 필수 — 미인증 시 401 자동 throw
export async function requireAuth(event: H3Event) {
  const supabaseUser = await serverSupabaseUser(event)
  if (!supabaseUser) {
    throw createError({ statusCode: 401, statusMessage: '로그인이 필요해요' })
  }

  const [user] = await db.select().from(users).where(eq(users.id, supabaseUser.id)).limit(1)
  if (!user || user.deletedAt) {
    throw createError({ statusCode: 401, statusMessage: '유효하지 않은 계정이에요' })
  }

  return user
}

// 로그인 선택 — 비로그인이면 null
export async function getAuthUser(event: H3Event) {
  const supabaseUser = await serverSupabaseUser(event)
  if (!supabaseUser) return null

  const [user] = await db.select().from(users).where(eq(users.id, supabaseUser.id)).limit(1)
  if (!user || user.deletedAt) return null

  return user
}
