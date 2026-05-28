<script setup lang="ts">
import { AlertCircle } from '@lucide/vue'

definePageMeta({ layout: false })

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const authStore = useAuthStore()
const blockedMessage = ref<string | null>(null)

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
  } catch (e: unknown) {
    const err = e as { data?: { statusCode?: number; statusMessage?: string } }
    if (err.data?.statusCode === 403) {
      blockedMessage.value = err.data.statusMessage ?? '이 계정은 이용이 제한됐어요.'
      authStore.clear()
      await supabase.auth.signOut()
      return
    }
    await navigateTo('/')
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <div
      v-if="blockedMessage"
      class="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-7 text-center shadow-lg"
    >
      <div
        class="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
      >
        <AlertCircle class="size-6" />
      </div>
      <h1 class="mt-4 text-lg font-black text-foreground">로그인할 수 없어요</h1>
      <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ blockedMessage }}</p>
      <NuxtLink to="/">
        <AppButton class="mt-6 w-full">홈으로 돌아가기</AppButton>
      </NuxtLink>
    </div>
    <div v-else class="flex flex-col items-center gap-3">
      <div class="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p class="text-sm text-muted-foreground">로그인 처리 중...</p>
    </div>
  </div>
</template>
