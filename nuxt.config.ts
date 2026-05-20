import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxt/eslint', '@nuxtjs/supabase'],

  // ui/, product/ 하위 디렉터리 prefix 없이 AppButton, AppCard 등으로 auto-import
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/',
      callback: '/auth/confirm',
      exclude: ['/', '/terms', '/privacy', '/analysis/demo'],
    },
  },
})
