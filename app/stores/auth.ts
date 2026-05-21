import type { SelectUser } from '~~/server/db/schema'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type HeaderProfile = Pick<SelectUser, 'nickname' | 'avatarUrl' | 'jobType'>

export const useAuthStore = defineStore('auth', () => {
  const supabaseUser = useSupabaseUser()
  const profileCookie = useCookie<HeaderProfile | null>('poljjak-profile-cache', {
    maxAge: 60 * 60 * 24 * 60,
    sameSite: 'lax',
  })
  const profile = ref<SelectUser | null>(null)
  const cachedProfile = ref<HeaderProfile | null>(profileCookie.value ?? null)
  const profilePending = ref(false)
  const profileLoaded = ref(false)

  const isLoggedIn = computed(() => !!supabaseUser.value)
  const needsOnboarding = computed(() => !profile.value?.onboardingCompletedAt)
  const displayProfile = computed(() => profile.value ?? cachedProfile.value)

  function cacheProfile(nextProfile: SelectUser) {
    const headerProfile = {
      nickname: nextProfile.nickname,
      avatarUrl: nextProfile.avatarUrl,
      jobType: nextProfile.jobType,
    }
    cachedProfile.value = headerProfile
    profileCookie.value = headerProfile
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
