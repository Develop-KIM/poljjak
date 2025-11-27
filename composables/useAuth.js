export const useAuth = () => {
  const user = useState('user', () => {
    if (process.client) {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }
    return null
  })

  const setUser = (userData) => {
    user.value = userData
    if (process.client) {
      localStorage.setItem('user', JSON.stringify(userData))
    }
  }

  const clearAuth = () => {
    user.value = null
    if (process.client) {
      localStorage.removeItem('user')
    }
  }

  const isAuthenticated = computed(() => {
    return !!user.value
  })

  const initAuth = () => {
    if (process.client) {
      const userData = localStorage.getItem('user')
      if (userData) {
        user.value = JSON.parse(userData)
      }
    }
  }

  return {
    setUser,
    clearAuth,
    isAuthenticated,
    user,
    initAuth,
  }
}
