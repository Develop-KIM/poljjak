<script setup lang="ts">
definePageMeta({ layout: false })

const user = useSupabaseUser()
const authStore = useAuthStore()

onMounted(async () => {
  // @nuxtjs/supabase 가 PKCE 코드 교환을 완료할 때까지 대기
  let waited = 0
  while (!user.value && waited < 5000) {
    await new Promise((r) => setTimeout(r, 200))
    waited += 200
  }

  if (!user.value) {
    await navigateTo('/')
    return
  }

  try {
    const res = await $fetch<{ data: { needsOnboarding: boolean } }>('/api/auth/sync', {
      method: 'POST',
    })
    await authStore.fetchProfile()
    await navigateTo(res.data.needsOnboarding ? '/onboarding' : '/')
  } catch {
    await navigateTo('/')
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <div class="flex flex-col items-center gap-3">
      <div class="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p class="text-sm text-muted-foreground">로그인 처리 중...</p>
    </div>
  </div>
</template>
