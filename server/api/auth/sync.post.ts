import { serverSupabaseUser } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const supabaseUser = await serverSupabaseUser(event)
  if (!supabaseUser) {
    throw createError({ statusCode: 401, statusMessage: '로그인이 필요해요' })
  }

  // 카카오 provider ID (provider_id 또는 identities[0].id)
  const kakaoId =
    supabaseUser.user_metadata?.provider_id ?? supabaseUser.identities?.[0]?.id ?? supabaseUser.id

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.kakaoId, String(kakaoId)))
    .limit(1)

  // 탈퇴 후 재가입: 기존 레코드 삭제 후 신규 삽입
  if (existing?.deletedAt) {
    await db.delete(users).where(eq(users.kakaoId, String(kakaoId)))
  }

  if (!existing || existing.deletedAt) {
    await db.insert(users).values({
      id: supabaseUser.id,
      kakaoId: String(kakaoId),
      nickname: supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? '',
      email: supabaseUser.email ?? null,
      avatarUrl:
        supabaseUser.user_metadata?.avatar_url ?? supabaseUser.user_metadata?.picture ?? null,
      lastLoginAt: new Date(),
    })
    return { data: { needsOnboarding: true } }
  }

  // 기존 사용자: 로그인 정보 갱신
  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      email: supabaseUser.email ?? null,
      avatarUrl:
        supabaseUser.user_metadata?.avatar_url ?? supabaseUser.user_metadata?.picture ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.kakaoId, String(kakaoId)))

  return { data: { needsOnboarding: !existing.onboardingCompletedAt } }
})
