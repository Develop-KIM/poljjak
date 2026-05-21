<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { Camera, Check, X, Loader2 } from '@lucide/vue'

definePageMeta({ layout: false })

const toast = useToastStore()

// ── 단계 ──────────────────────────────────────────────
const step = ref<1 | 2 | 3>(1)
const TOTAL_STEPS = 3

const progressPercent = computed(() => ((step.value - 1) / (TOTAL_STEPS - 1)) * 100)

// ── Step 1: 약관 동의 ──────────────────────────────────
const agreedAll = ref(false)
const agreedTerms = ref(false)
const agreedPrivacy = ref(false)

watch([agreedTerms, agreedPrivacy], () => {
  agreedAll.value = agreedTerms.value && agreedPrivacy.value
})

function toggleAll() {
  const next = !agreedAll.value
  agreedAll.value = next
  agreedTerms.value = next
  agreedPrivacy.value = next
}

const canProceedStep1 = computed(() => agreedTerms.value && agreedPrivacy.value)

// ── Step 2: 프로필 ────────────────────────────────────
const nickname = ref('')
const avatarPreview = ref<string | null>(null)
const imageError = ref<string | null>(null)

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,15}$/
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

type CheckState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
const checkState = ref<CheckState>('idle')
const checkTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const nicknameHint = computed(() => {
  switch (checkState.value) {
    case 'available':
      return '사용할 수 있는 닉네임이에요'
    case 'taken':
      return '이미 사용 중인 닉네임이에요'
    case 'invalid':
      return '한글·영문·숫자만 2~15자로 입력해주세요'
    default:
      return null
  }
})

const nicknameHintColor = computed(() => {
  if (checkState.value === 'available') return 'text-emerald-600'
  if (checkState.value === 'taken' || checkState.value === 'invalid') return 'text-destructive'
  return ''
})

watch(nickname, (val) => {
  if (checkTimer.value) clearTimeout(checkTimer.value)
  const nextNickname = val.trim()
  if (!nextNickname) {
    checkState.value = 'idle'
    return
  }
  if (!NICKNAME_REGEX.test(nextNickname)) {
    checkState.value = 'invalid'
    return
  }

  checkState.value = 'checking'
  checkTimer.value = setTimeout(async () => {
    try {
      const res = await $fetch<{ data: { available: boolean } }>('/api/users/check-nickname', {
        query: { nickname: nextNickname },
      })
      if (nickname.value.trim() !== nextNickname) return
      checkState.value = res.data.available ? 'available' : 'taken'
    } catch {
      if (nickname.value.trim() !== nextNickname) return
      checkState.value = 'taken'
    }
  }, 500)
})

const canProceedStep2 = computed(() => checkState.value === 'available')

onUnmounted(() => {
  if (checkTimer.value) clearTimeout(checkTimer.value)
})

function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > MAX_IMAGE_BYTES) {
    imageError.value = '이미지 크기가 10MB를 초과해요'
    return
  }
  imageError.value = null
  avatarPreview.value = URL.createObjectURL(file)
}

// ── Step 3: 직종 ──────────────────────────────────────
const selectedJob = ref<'developer' | 'designer' | null>(null)

const jobs = [
  {
    value: 'developer' as const,
    label: '개발자',
    desc: '프론트엔드·백엔드·풀스택·모바일',
    emoji: '💻',
  },
  {
    value: 'designer' as const,
    label: '디자이너',
    desc: 'UI/UX·그래픽·제품 디자인',
    emoji: '🎨',
  },
]

// ── 완료 ──────────────────────────────────────────────
const completing = ref(false)

async function handleComplete() {
  if (completing.value || checkState.value !== 'available') return
  completing.value = true
  try {
    await $fetch('/api/users/me', {
      method: 'PATCH',
      body: {
        nickname: nickname.value.trim(),
        jobType: selectedJob.value,
      },
    })
    await navigateTo('/')
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '프로필 저장에 실패했어요')
  } finally {
    completing.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <!-- 헤더 -->
    <header class="flex h-16 items-center px-5 md:px-8">
      <AppLogo class="h-8" />
    </header>

    <!-- 프로그레스 바 -->
    <div class="h-1 w-full bg-border">
      <div
        class="h-full bg-primary transition-all duration-300"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>

    <main class="flex flex-1 items-center justify-center px-5 py-10">
      <div class="w-full max-w-sm">
        <!-- ── Step 1: 약관 동의 ── -->
        <div v-if="step === 1">
          <h1 class="text-2xl font-black text-foreground">서비스 이용에 동의해주세요</h1>
          <p class="mt-2 text-sm text-muted-foreground">아래 약관을 확인하고 동의해주세요.</p>

          <div class="mt-8 rounded-xl border border-border bg-card">
            <!-- 전체 동의 -->
            <button
              type="button"
              class="flex w-full items-center gap-3 px-4 py-4"
              @click="toggleAll"
            >
              <div
                class="flex size-5 items-center justify-center rounded-full border-2 transition-colors"
                :class="agreedAll ? 'border-primary bg-primary' : 'border-border'"
              >
                <Check v-if="agreedAll" class="size-3 text-white" />
              </div>
              <span class="font-bold text-foreground">전체 동의</span>
            </button>

            <div class="mx-4 h-px bg-border" />

            <!-- 개별 항목 -->
            <div class="divide-y divide-border">
              <label class="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                <input v-model="agreedTerms" type="checkbox" class="sr-only" />
                <div
                  class="flex size-5 items-center justify-center rounded-full border-2 transition-colors"
                  :class="agreedTerms ? 'border-primary bg-primary' : 'border-border'"
                >
                  <Check v-if="agreedTerms" class="size-3 text-white" />
                </div>
                <span class="flex-1 text-sm text-foreground">(필수) 이용약관 동의</span>
                <span class="text-xs text-muted-foreground underline">보기</span>
              </label>

              <label class="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                <input v-model="agreedPrivacy" type="checkbox" class="sr-only" />
                <div
                  class="flex size-5 items-center justify-center rounded-full border-2 transition-colors"
                  :class="agreedPrivacy ? 'border-primary bg-primary' : 'border-border'"
                >
                  <Check v-if="agreedPrivacy" class="size-3 text-white" />
                </div>
                <span class="flex-1 text-sm text-foreground">(필수) 개인정보 처리방침 동의</span>
                <span class="text-xs text-muted-foreground underline">보기</span>
              </label>
            </div>
          </div>

          <AppButton class="mt-8 w-full" size="lg" :disabled="!canProceedStep1" @click="step = 2">
            다음
          </AppButton>
        </div>

        <!-- ── Step 2: 프로필 설정 ── -->
        <div v-else-if="step === 2">
          <h1 class="text-2xl font-black text-foreground">프로필을 설정해주세요</h1>
          <p class="mt-2 text-sm text-muted-foreground">
            나중에 마이페이지에서 언제든지 변경할 수 있어요.
          </p>

          <!-- 프로필 이미지 (선택) -->
          <div class="mt-8 flex flex-col items-center gap-2">
            <label class="group relative cursor-pointer">
              <div class="size-24 overflow-hidden rounded-full border-2 border-border bg-accent">
                <img
                  :src="avatarPreview ?? '/images/default-avatar.svg'"
                  alt="프로필 이미지"
                  class="h-full w-full object-cover"
                />
              </div>
              <div
                class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Camera class="size-6 text-white" />
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="sr-only"
                @change="handleAvatarChange"
              />
            </label>
            <p class="text-xs text-muted-foreground">선택 · jpg, png, webp · 10MB 이하</p>
            <p v-if="imageError" class="text-xs text-destructive">{{ imageError }}</p>
          </div>

          <!-- 닉네임 (필수) -->
          <div class="mt-8">
            <div class="flex items-center justify-between">
              <label class="text-sm font-bold text-foreground">닉네임</label>
              <span class="text-xs text-muted-foreground">{{ nickname.length }}/15</span>
            </div>

            <div class="relative mt-2">
              <AppInput v-model="nickname" placeholder="닉네임을 입력해주세요" :maxlength="15" />
              <div class="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2
                  v-if="checkState === 'checking'"
                  class="size-4 animate-spin text-muted-foreground"
                />
                <Check v-else-if="checkState === 'available'" class="size-4 text-emerald-500" />
                <X
                  v-else-if="checkState === 'taken' || checkState === 'invalid'"
                  class="size-4 text-destructive"
                />
              </div>
            </div>

            <p v-if="nicknameHint" class="mt-1.5 text-xs" :class="nicknameHintColor">
              {{ nicknameHint }}
            </p>
            <p v-else class="mt-1.5 text-xs text-muted-foreground">
              한글·영문·숫자만 사용 가능, 특수문자·공백 불가
            </p>
          </div>

          <AppButton class="mt-8 w-full" size="lg" :disabled="!canProceedStep2" @click="step = 3">
            다음
          </AppButton>
        </div>

        <!-- ── Step 3: 직종 선택 ── -->
        <div v-else>
          <h1 class="text-2xl font-black text-foreground">어떤 분야에서 일하고 계신가요?</h1>
          <p class="mt-2 text-sm text-muted-foreground">
            포트폴리오 분석에 더 맞는 피드백을 드릴게요.
          </p>

          <div class="mt-8 grid grid-cols-2 gap-3">
            <button
              v-for="job in jobs"
              :key="job.value"
              type="button"
              class="flex flex-col items-center gap-3 rounded-xl border-2 px-4 py-7 transition-colors"
              :class="
                selectedJob === job.value
                  ? 'border-primary bg-accent'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted'
              "
              @click="selectedJob = job.value"
            >
              <span class="text-4xl">{{ job.emoji }}</span>
              <div class="text-center">
                <p
                  class="font-black"
                  :class="selectedJob === job.value ? 'text-primary' : 'text-foreground'"
                >
                  {{ job.label }}
                </p>
                <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ job.desc }}</p>
              </div>
            </button>
          </div>

          <AppButton class="mt-8 w-full" size="lg" :disabled="completing" @click="handleComplete">
            시작하기
          </AppButton>

          <button
            type="button"
            class="mt-4 w-full text-center text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
            :disabled="completing"
            @click="handleComplete"
          >
            나중에 설정할게요
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
