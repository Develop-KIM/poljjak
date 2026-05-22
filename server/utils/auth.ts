import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

// 실제로 핸들러에서 사용하는 컬럼만 조회 (전체 SELECT 방지)
const userSelectFields = {
  id: users.id,
  providerId: users.providerId,
  nickname: users.nickname,
  email: users.email,
  avatarUrl: users.avatarUrl,
  jobType: users.jobType,
  role: users.role,
  onboardingCompletedAt: users.onboardingCompletedAt,
  suspendedAt: users.suspendedAt,
  deletedAt: users.deletedAt,
}

async function getSupabaseUserId(event: H3Event): Promise<string | null> {
  const client = await serverSupabaseClient(event)
  const {
    data: { user },
  } = await client.auth.getUser()
  return user?.id ?? null
}

// 로그인 필수 — 미인증 시 401 자동 throw
export async function requireAuth(event: H3Event) {
  const userId = await getSupabaseUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: '로그인이 필요해요' })
  }

  const [user] = await db.select(userSelectFields).from(users).where(eq(users.id, userId)).limit(1)
  if (!user || user.deletedAt) {
    throw createError({ statusCode: 401, statusMessage: '유효하지 않은 계정이에요' })
  }
  if (user.suspendedAt) {
    throw createError({ statusCode: 403, statusMessage: '정지된 계정이에요. 운영팀에 문의해주세요.' })
  }

  return user
}

// 로그인 선택 — 비로그인이면 null
export async function getAuthUser(event: H3Event) {
  const userId = await getSupabaseUserId(event)
  if (!userId) return null

  const [user] = await db.select(userSelectFields).from(users).where(eq(users.id, userId)).limit(1)
  if (!user || user.deletedAt) return null

  return user
}
