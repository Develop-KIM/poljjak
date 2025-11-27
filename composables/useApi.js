export const useApi = () => {
  const { getAccessToken, setAccessToken } = useAuth()

  const fetchWithAuth = async (url, options = {}) => {
    const token = getAccessToken()

    try {
      return await $fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
    } catch (error) {
      if (error.statusCode === 401) {
        const newToken = await refreshAccessToken()
        if (newToken) {
          return await $fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          })
        }
      }
      throw error
    }
  }

  const refreshAccessToken = async () => {
    try {
      const { accessToken } = await $fetch('/api/auth/refresh', {
        method: 'POST',
      })
      setAccessToken(accessToken)
      return accessToken
    } catch (error) {
      console.error('토큰 갱신 실패:', error)
      navigateTo('/api/auth/kakao/login')
      return null
    }
  }

  return { fetchWithAuth }
}
