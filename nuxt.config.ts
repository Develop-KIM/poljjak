import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxt/eslint', '@nuxtjs/supabase'],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  supabase: {
    redirect: false,
  },
})
