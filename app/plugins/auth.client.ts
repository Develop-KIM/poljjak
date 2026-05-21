export default defineNuxtPlugin(async () => {
  const user = useSupabaseUser()
  const authStore = useAuthStore()

  // 새로고침 시 로그인 상태면 프로필 복원
  if (user.value && !authStore.profile) {
    await authStore.fetchProfile()
  }
})
