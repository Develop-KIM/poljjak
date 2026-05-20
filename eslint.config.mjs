// .nuxt/eslint.config.mjs 는 nuxt prepare 후 생성됨
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Vue 3 는 다중 루트 요소(Fragment) 지원 — 모달 Teleport 패턴에서 사용
    'vue/no-multiple-template-root': 'off',
  },
})
