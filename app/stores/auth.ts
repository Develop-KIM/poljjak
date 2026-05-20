import type { SelectUser } from '~~/server/db/schema'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const supabaseUser = useSupabaseUser()
  const profile = ref<SelectUser | null>(null)

  const isLoggedIn = computed(() => !!supabaseUser.value)
  const needsOnboarding = computed(() => !profile.value?.onboardingCompletedAt)

  async function fetchProfile() {
    try {
      const res = await $fetch<{ data: SelectUser }>('/api/auth/me')
      profile.value = res.data
    } catch {
      profile.value = null
    }
  }

  function clear() {
    profile.value = null
  }

  return { profile, isLoggedIn, needsOnboarding, fetchProfile, clear }
})
