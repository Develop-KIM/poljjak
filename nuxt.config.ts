import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      titleTemplate: '%s · 폴짝',
      meta: [
        {
          name: 'description',
          content:
            'PDF 하나로 포트폴리오의 약점을 파악하세요. AI가 10가지 항목을 점수와 코멘트로 분석하고 Before/After 개선안을 제시해드려요.',
        },
        { property: 'og:site_name', content: '폴짝' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'ko_KR' },
        { property: 'og:image', content: 'https://poljjak.kr/og-image.svg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@poljjak' },
        { name: 'twitter:image', content: 'https://poljjak.kr/og-image.svg' },
        { name: 'naver-site-verification', content: 'e1561b56e2ddc8746966f9f0b04ebbbd4bad31ff' },
      ],
      link: [{ rel: 'icon', type: 'image/png', href: '/images/logo.png' }],
    },
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
      exclude: ['/', '/terms', '/privacy', '/analysis/demo', '/analysis/**'],
    },
  },
})
