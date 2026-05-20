<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Camera, Check, X, Loader2 } from '@lucide/vue'

definePageMeta({ layout: false })

// ── 단계 ──────────────────────────────────────────────
const step = ref<1 | 2>(1)

// ── Step 1: 프로필 ────────────────────────────────────
const nickname = ref('김개발')
const avatarPreview = ref<string | null>(null)
const imageError = ref<string | null>(null)

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,15}$/
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

// 닉네임 중복 체크 상태
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

// 닉네임 변경 시 500ms 디바운스로 중복 체크
watch(nickname, (val) => {
  if (checkTimer.value) clearTimeout(checkTimer.value)
  if (!val.trim()) {
    checkState.value = 'idle'
    return
  }
  if (!NICKNAME_REGEX.test(val)) {
    checkState.value = 'invalid'
    return
  }

  checkState.value = 'checking'
  checkTimer.value = setTimeout(() => {
    // 3차 구현에서 GET /api/users/check-nickname?nickname={val} 호출
    checkState.value = 'available' // 정적 UI 임시값
  }, 500)
})

const canProceed = computed(() => checkState.value === 'available')

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

// ── Step 2: 직종 ──────────────────────────────────────
const selectedJob = ref<'developer' | 'designer' | null>(null)

const jobs = [
  {
    value: 'developer' as const,
    label: '개발자',
    desc: '프론트엔드·백엔드·풀스택·모바일 등',
    emoji: '💻',
  },
  {
    value: 'designer' as const,
    label: '디자이너',
    desc: 'UI/UX·그래픽·제품 디자인 등',
    emoji: '🎨',
  },
]

// ── 완료 ──────────────────────────────────────────────
function handleComplete() {
  // 3차 구현에서 PATCH /api/users/me (onboarding_completed_at, job_type 저장)
  navigateTo('/')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <!-- 헤더 -->
    <header class="flex h-16 items-center justify-between px-5 md:px-8">
      <span class="text-lg font-black text-foreground">폴짝</span>
      <div class="flex items-center gap-2 text-sm font-semibold">
        <span :class="step === 1 ? 'text-primary' : 'text-muted-foreground/40'">1</span>
        <div class="h-px w-8 bg-border" />
        <span :class="step === 2 ? 'text-primary' : 'text-muted-foreground/40'">2</span>
      </div>
    </header>

    <main class="flex flex-1 items-center justify-center px-5 py-10">
      <div class="w-full max-w-sm">
        <!-- ── Step 1: 프로필 설정 ── -->
        <div v-if="step === 1">
          <h1 class="text-2xl font-black text-foreground">프로필을 설정해주세요</h1>
          <p class="mt-2 text-sm text-muted-foreground">
            나중에 마이페이지에서 언제든지 변경할 수 있어요.
          </p>

          <!-- 프로필 이미지 -->
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
            <p class="text-xs text-muted-foreground">클릭해서 변경 · jpg, png, webp · 10MB 이하</p>
            <p v-if="imageError" class="text-xs text-destructive">{{ imageError }}</p>
          </div>

          <!-- 닉네임 -->
          <div class="mt-8">
            <div class="flex items-center justify-between">
              <label class="text-sm font-bold text-foreground">닉네임</label>
              <span class="text-xs text-muted-foreground">{{ nickname.length }}/15</span>
            </div>

            <div class="relative mt-2">
              <AppInput v-model="nickname" placeholder="한글·영문·숫자 2~15자" :maxlength="15" />
              <!-- 체크 상태 아이콘 -->
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

          <AppButton class="mt-8 w-full" size="lg" :disabled="!canProceed" @click="step = 2">
            다음
          </AppButton>
        </div>

        <!-- ── Step 2: 직종 선택 ── -->
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
                  : 'border-border bg-card hover:border-primary/40 hover:bg-slate-50'
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

          <AppButton class="mt-8 w-full" size="lg" @click="handleComplete"> 시작하기 🎉 </AppButton>

          <button
            type="button"
            class="mt-4 w-full text-center text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            @click="handleComplete"
          >
            나중에 설정할게요
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
