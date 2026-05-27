import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(() => {
  // SSR 중에는 Pinia store가 아직 초기화되지 않으므로 스킵
  if (import.meta.server) return

  const authStore = useAuthStore()
  if (!authStore.isLoggedIn || authStore.profile?.role !== 'admin') {
    return navigateTo('/')
  }
})
