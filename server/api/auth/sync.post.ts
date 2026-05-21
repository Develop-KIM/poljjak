import { serverSupabaseClient } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const {
    data: { user: supabaseUser },
    error,
  } = await client.auth.getUser()

  if (error || !supabaseUser) {
    throw createError({ statusCode: 401, statusMessage: '로그인이 필요해요' })
  }

  // provider ID (카카오/구글 공통으로 사용)
  const providerId =
    supabaseUser.user_metadata?.provider_id ?? supabaseUser.identities?.[0]?.id ?? supabaseUser.id

  const nickname =
    supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? '사용자'

  const oauthAvatarUrl =
    supabaseUser.user_metadata?.avatar_url ?? supabaseUser.user_metadata?.picture ?? null

  // OAuth 아바타 없으면 dicebear 기본 이미지 생성
  const avatarUrl =
    oauthAvatarUrl ??
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nickname)}&backgroundColor=6366f1&textColor=ffffff`

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.providerId, String(providerId)))
    .limit(1)

  // 탈퇴 후 재가입: 기존 레코드 삭제 후 신규 삽입
  if (existing?.deletedAt) {
    await db.delete(users).where(eq(users.providerId, String(providerId)))
  }

  if (!existing || existing.deletedAt) {
    await db.insert(users).values({
      id: supabaseUser.id,
      providerId: String(providerId),
      nickname,
      email: supabaseUser.email ?? null,
      avatarUrl,
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
      avatarUrl: oauthAvatarUrl ?? existing.avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.providerId, String(providerId)))

  return { data: { needsOnboarding: !existing.onboardingCompletedAt } }
})
