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
    description: '카카오 또는 구글 계정으로 간편하게 시작할 수 있어요.',
  }
)

const emit = defineEmits<{
  close: []
}>()

const { signInWithKakao, signInWithGoogle } = useAuth()
const pending = ref<'kakao' | 'google' | null>(null)

async function handleKakaoLogin() {
  pending.value = 'kakao'
  try {
    await signInWithKakao()
  } catch {
    pending.value = null
  }
}

async function handleGoogleLogin() {
  pending.value = 'google'
  try {
    await signInWithGoogle()
  } catch {
    pending.value = null
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
        <div
          class="relative w-full max-w-sm rounded-2xl bg-popover text-popover-foreground shadow-2xl"
        >
          <!-- 닫기 -->
          <button
            type="button"
            class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click="emit('close')"
          >
            <X class="size-4" />
          </button>

          <!-- 콘텐츠 -->
          <div class="px-8 pb-8 pt-10">
            <!-- 로고 -->
            <div class="flex justify-center">
              <AppLogo class="h-10" />
            </div>

            <div class="mt-5 text-center">
              <h2 class="text-xl font-black text-foreground">로그인하고 {{ context }}</h2>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                {{ description }}
              </p>
            </div>

            <!-- 로그인 버튼들 -->
            <div class="mt-7 grid gap-3">
              <!-- 카카오 -->
              <button
                type="button"
                :disabled="!!pending"
                class="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FEE500] py-3.5 text-sm font-bold text-[#191919] transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
                @click="handleKakaoLogin"
              >
                <template v-if="pending === 'kakao'">
                  <div
                    class="size-4 animate-spin rounded-full border-2 border-[#191919]/30 border-t-[#191919]"
                  />
                  잠시만요...
                </template>
                <template v-else>
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

              <!-- 구글 -->
              <button
                type="button"
                :disabled="!!pending"
                class="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                @click="handleGoogleLogin"
              >
                <template v-if="pending === 'google'">
                  <div
                    class="size-4 animate-spin rounded-full border-2 border-border border-t-foreground"
                  />
                  잠시만요...
                </template>
                <template v-else>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path
                      d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                      fill="#4285F4"
                    />
                    <path
                      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                      fill="#34A853"
                    />
                    <path
                      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google로 시작하기
                </template>
              </button>
            </div>

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
