import type { User, Session } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isLoggedIn = computed(() => !!user.value)

  function setUser(newUser: User | null) {
    user.value = newUser
  }

  function setSession(newSession: Session | null) {
    session.value = newSession
  }

  function clear() {
    user.value = null
    session.value = null
  }

  return { user, session, isLoggedIn, setUser, setSession, clear }
})
