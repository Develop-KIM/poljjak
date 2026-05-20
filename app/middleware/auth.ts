// definePageMeta({ middleware: 'auth' }) 로 보호된 경로에서 사용
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  if (!user.value) {
    // 로그인 모달을 띄우기 위한 쿼리 파라미터 전달
    return navigateTo({ path: '/', query: { login: '1' } })
  }
})
