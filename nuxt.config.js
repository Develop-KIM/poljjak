export default defineNuxtConfig({
  compatibilityDate: '2025-11-27',
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',  
    '@nuxt/icon',
  ],

  colorMode: {
    classSuffix: '',
    preference: 'system', 
    fallback: 'light',
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3163'
    }
  },
    
  css: ['~/assets/css/main.css'],
})
