<script setup lang="ts">
import { X } from '@lucide/vue'

withDefaults(
  defineProps<{
    open: boolean
    context?: string
    description?: string
  }>(),
  {
    context: '계속하기',
    description: '카카오 계정으로 간편하게 시작할 수 있어요.',
  }
)

const emit = defineEmits<{
  close: []
}>()

const { signInWithKakao } = useAuth()
const pending = ref(false)

async function handleLogin() {
  pending.value = true
  try {
    await signInWithKakao()
    // OAuth 리다이렉트 발생 — 이후 코드는 실행되지 않음
  } catch {
    pending.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        @click.self="emit('close')"
      >
        <!-- 배경 -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />

        <!-- 모달 -->
        <div class="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
          <!-- 닫기 -->
          <button
            type="button"
            class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
            @click="emit('close')"
          >
            <X class="size-4" />
          </button>

          <!-- 콘텐츠 -->
          <div class="px-8 pb-8 pt-10">
            <!-- 로고 -->
            <div class="flex justify-center">
              <div class="flex h-12 items-center justify-center rounded-xl bg-primary px-4">
                <span class="text-base font-black text-white">폴짝</span>
              </div>
            </div>

            <div class="mt-5 text-center">
              <h2 class="text-xl font-black text-foreground">로그인하고 {{ context }}</h2>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                {{ description }}
              </p>
            </div>

            <!-- 카카오 로그인 버튼 -->
            <button
              type="button"
              :disabled="pending"
              class="mt-7 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FEE500] py-3.5 text-sm font-bold text-[#191919] transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
              @click="handleLogin"
            >
              <template v-if="pending">
                <div
                  class="size-4 animate-spin rounded-full border-2 border-[#191919]/30 border-t-[#191919]"
                />
                잠시만요...
              </template>
              <template v-else>
                <!-- 카카오 말풍선 아이콘 -->
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.375c0 2.1 1.347 3.938 3.375 4.988l-.862 3.212a.188.188 0 0 0 .284.205l3.75-2.475A8.42 8.42 0 0 0 9 13.25c4.142 0 7.5-2.634 7.5-5.875S13.142 1.5 9 1.5z"
                    fill="#191919"
                  />
                </svg>
                카카오로 시작하기
              </template>
            </button>

            <!-- 안내 문구 -->
            <p class="mt-4 text-center text-xs leading-5 text-muted-foreground">
              로그인하면
              <NuxtLink
                to="/terms"
                class="underline underline-offset-2 hover:text-foreground"
                @click="emit('close')"
                >이용약관</NuxtLink
              >
              및
              <NuxtLink
                to="/privacy"
                class="underline underline-offset-2 hover:text-foreground"
                @click="emit('close')"
                >개인정보처리방침</NuxtLink
              >
              에 동의한 것으로 간주해요.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
