// definePageMeta({ middleware: 'auth' }) 로 보호된 경로에서 사용
export default defineNuxtRouteMiddleware(() => {
  // SSR 중에는 Supabase 세션이 아직 복원되지 않으므로 스킵 (클라이언트 hydration 후 재실행)
  if (import.meta.server) return

  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo({ path: '/', query: { login: '1' } })
  }
})
