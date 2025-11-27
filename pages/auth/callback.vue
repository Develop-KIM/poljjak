<template>
  <div class="flex items-center justify-center min-h-screen bg-white dark:bg-dark">
    <div class="text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-lg text-gray-600 dark:text-gray-400">로그인 중...</p>
    </div>
  </div>
</template>

<script setup>
// 페이지 전환 애니메이션 비활성화 (깜빡임 최소화)
definePageMeta({
  pageTransition: false,
  layoutTransition: false,
})

const route = useRoute()
const { setUser } = useAuth()

onMounted(async () => {
  const code = route.query.code

  if (!code) {
    console.error('인증 코드가 없습니다')
    navigateTo('/')
    return
  }

  try {
    const { user } = await $fetch('/api/auth/kakao/token', {
      method: 'POST',
      body: { code },
    })

    console.log('✅ 로그인 성공:', user)
    setUser(user)

    // 전환 애니메이션 없이 이동
    await navigateTo('/', { replace: true })
  } catch (error) {
    console.error('❌ 로그인 실패:', error)
    navigateTo('/')
  }
})
</script>
