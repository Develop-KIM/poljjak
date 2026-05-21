import type { SelectUser } from '~~/server/db/schema'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type CachedProfile = Pick<SelectUser, 'nickname' | 'email' | 'avatarUrl' | 'jobType'>

export const useAuthStore = defineStore('auth', () => {
  const supabaseUser = useSupabaseUser()
  const profileCookie = useCookie<CachedProfile | null>('poljjak-profile-cache', {
    maxAge: 60 * 60 * 24 * 60,
    sameSite: 'lax',
  })
  const profile = ref<SelectUser | null>(null)
  const cachedProfile = ref<CachedProfile | null>(profileCookie.value ?? null)
  const profilePending = ref(false)
  const profileLoaded = ref(false)

  const isLoggedIn = computed(() => !!supabaseUser.value)
  const needsOnboarding = computed(() => !profile.value?.onboardingCompletedAt)
  const displayProfile = computed(() => profile.value ?? cachedProfile.value)

  function cacheProfile(nextProfile: SelectUser) {
    const cached = {
      nickname: nextProfile.nickname,
      email: nextProfile.email,
      avatarUrl: nextProfile.avatarUrl,
      jobType: nextProfile.jobType,
    }
    cachedProfile.value = cached
    profileCookie.value = cached
  }

  async function fetchProfile() {
    profilePending.value = true
    try {
      const res = await $fetch<{ data: SelectUser }>('/api/auth/me')
      profile.value = res.data
      cacheProfile(res.data)
    } catch {
      profile.value = null
    } finally {
      profilePending.value = false
      profileLoaded.value = true
    }
  }

  function clear() {
    profile.value = null
    cachedProfile.value = null
    profileCookie.value = null
    profilePending.value = false
    profileLoaded.value = false
  }

  return {
    profile,
    displayProfile,
    profilePending,
    profileLoaded,
    isLoggedIn,
    needsOnboarding,
    fetchProfile,
    clear,
  }
})
