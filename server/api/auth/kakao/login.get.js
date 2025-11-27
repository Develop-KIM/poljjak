export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${config.kakaoRestApiKey}&redirect_uri=${config.kakaoRedirectUri}&response_type=code`

  return sendRedirect(event, kakaoAuthUrl)
})
