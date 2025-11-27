export default defineNuxtConfig({
  compatibilityDate: '2025-11-27',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt', '@nuxtjs/color-mode'],

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    kakaoRestApiKey: process.env.KAKAO_REST_API_KEY,
    kakaoClientSecret: process.env.KAKAO_CLIENT_SECRET,
    kakaoRedirectUri: process.env.KAKAO_REDIRECT_URI,
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3163',
    },
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: {
        class: 'h-full',
      },
      bodyAttrs: {
        class: 'h-full',
      },
    },
  },
})
