export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()

  // 로그인 모달 로그인 / 로그아웃 이벤트 처리
  // INITIAL_SESSION은 default.vue onMounted에서 처리하므로 여기선 SIGNED_IN만 담당
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      authStore.fetchProfile()
    } else if (event === 'SIGNED_OUT') {
      authStore.clear()
    }
  })
})
