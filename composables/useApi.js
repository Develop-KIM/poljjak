export const useApi = () => {
  const fetchWithAuth = async (url, options = {}) => {
    try {
      return await $fetch(url, {
        ...options,
        credentials: 'include', // 쿠키 자동 포함
      })
    } catch (error) {
      if (error.statusCode === 401) {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          return await $fetch(url, {
            ...options,
            credentials: 'include',
          })
        }
      }
      throw error
    }
  }

  const refreshAccessToken = async () => {
    try {
      await $fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      return true
    } catch (error) {
      console.error('토큰 갱신 실패:', error)
      navigateTo('/login')
      return false
    }
  }

  return { fetchWithAuth }
}
