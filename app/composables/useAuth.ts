export function useAuth() {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  const isLoggedIn = computed(() => !!user.value)

  async function signInWithKakao() {
    const redirectTo = `${window.location.origin}/auth/confirm`
    const { error } = await client.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo },
    })
    if (error) throw error
  }

  async function signOut() {
    await client.auth.signOut()
    navigateTo('/')
  }

  return { user, isLoggedIn, signInWithKakao, signOut }
}
