import { serverSupabaseClient } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { users } from '../../db/schema'
import { getDeletedUserCutoff, hardDeleteUser } from '../../utils/deleted-users'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const {
    data: { user: supabaseUser },
    error,
  } = await client.auth.getUser()

  if (error || !supabaseUser) {
    throw createError({ statusCode: 401, statusMessage: '로그인이 필요해요' })
  }

  const authUser = supabaseUser

  // provider ID (카카오/구글 공통으로 사용)
  const providerId =
    authUser.user_metadata?.provider_id ?? authUser.identities?.[0]?.id ?? authUser.id

  const nickname = authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? '사용자'

  const oauthAvatarUrl =
    authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? null

  // OAuth 아바타 없으면 dicebear 기본 이미지 생성
  const avatarUrl =
    oauthAvatarUrl ??
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nickname)}&backgroundColor=6366f1&textColor=ffffff`

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.providerId, String(providerId)))
    .limit(1)

  async function createUser() {
    await db.insert(users).values({
      id: authUser.id,
      providerId: String(providerId),
      nickname,
      email: authUser.email ?? null,
      avatarUrl,
      lastLoginAt: new Date(),
    })
  }

  if (!existing) {
    await createUser()
    return { data: { needsOnboarding: true } }
  }

  // 탈퇴 후 재로그인: 기존 사용자 ID를 유지해 게시글·댓글·분석 기록 연결을 복구한다.
  if (existing.deletedAt) {
    if (existing.deletedAt <= getDeletedUserCutoff()) {
      await hardDeleteUser(existing.id, { deleteAuth: false })
      await createUser()
      return { data: { needsOnboarding: true } }
    }

    await db
      .update(users)
      .set({
        nickname,
        email: authUser.email ?? null,
        avatarUrl,
        jobType: null,
        onboardingCompletedAt: null,
        deletedAt: null,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.providerId, String(providerId)))

    return { data: { needsOnboarding: true } }
  }

  // 기존 사용자: 로그인 정보 갱신
  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      email: authUser.email ?? null,
      avatarUrl: oauthAvatarUrl ?? existing.avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.providerId, String(providerId)))

  return { data: { needsOnboarding: !existing.onboardingCompletedAt } }
})
