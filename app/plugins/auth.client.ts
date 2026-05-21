export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()

  // 로그인 모달 로그인 / 로그아웃 이벤트와 새로고침 세션 복원을 처리
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      authStore.fetchProfile()
    } else if (event === 'SIGNED_OUT') {
      authStore.clear()
    }
  })
})
