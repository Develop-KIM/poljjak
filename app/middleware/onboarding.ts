// 온보딩 미완료 로그인 사용자를 /onboarding 으로 강제 이동
export default defineNuxtRouteMiddleware(async (to) => {
  // 온보딩 및 인증 관련 경로는 제외
  if (to.path.startsWith('/onboarding') || to.path.startsWith('/auth')) return

  const user = useSupabaseUser()
  if (!user.value) return

  const authStore = useAuthStore()

  // 프로필 미로드 시 한 번만 fetch
  if (!authStore.profile) {
    await authStore.fetchProfile()
  }

  if (authStore.needsOnboarding) {
    return navigateTo('/onboarding')
  }
})
