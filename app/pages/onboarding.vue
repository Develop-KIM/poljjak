<script setup lang="ts">
import { ref, computed } from 'vue'
import { Camera, ChevronRight } from '@lucide/vue'

definePageMeta({ layout: false })

const step = ref<1 | 2>(1)
const nickname = ref('김개발')
const avatarPreview = ref<string | null>(null)
const selectedJob = ref<string | null>(null)

const jobs = [
  { value: 'frontend', label: '프론트엔드', icon: '💻' },
  { value: 'backend', label: '백엔드', icon: '🖥️' },
  { value: 'fullstack', label: '풀스택', icon: '⚡' },
  { value: 'mobile', label: 'iOS / Android', icon: '📱' },
  { value: 'designer', label: 'UI/UX 디자이너', icon: '🎨' },
  { value: 'data', label: '데이터 엔지니어', icon: '📊' },
  { value: 'devops', label: 'DevOps / 인프라', icon: '🔧' },
  { value: 'pm', label: '기획 / PM', icon: '📋' },
  { value: 'other', label: '기타', icon: '✨' },
]

const canProceed = computed(() => nickname.value.trim().length >= 2)

function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarPreview.value = URL.createObjectURL(file)
}

function goNext() {
  if (!canProceed.value) return
  step.value = 2
}

function handleComplete() {
  // 3차 구현에서 API 연동 (onboarding_completed_at 기록)
  navigateTo('/')
}

function handleSkip() {
  navigateTo('/')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <!-- 헤더 -->
    <header class="flex h-16 items-center justify-between px-5 md:px-8">
      <span class="text-lg font-black text-foreground">폴짝</span>
      <!-- 진행 표시 -->
      <div class="flex items-center gap-2">
        <span
          class="text-sm font-semibold"
          :class="step === 1 ? 'text-primary' : 'text-muted-foreground/40'"
          >1</span
        >
        <div class="h-px w-8 bg-border" />
        <span
          class="text-sm font-semibold"
          :class="step === 2 ? 'text-primary' : 'text-muted-foreground/40'"
          >2</span
        >
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
          <div class="mt-8 flex justify-center">
            <label class="group relative cursor-pointer">
              <div class="size-24 overflow-hidden rounded-full bg-accent">
                <img
                  v-if="avatarPreview"
                  :src="avatarPreview"
                  alt="프로필 이미지"
                  class="h-full w-full object-cover"
                />
                <img
                  v-else
                  src="/images/default-avatar.svg"
                  alt="기본 프로필 이미지"
                  class="h-full w-full object-cover"
                />
              </div>
              <!-- 호버 오버레이 -->
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
          </div>
          <p class="mt-2 text-center text-xs text-muted-foreground">클릭해서 사진 변경</p>

          <!-- 닉네임 -->
          <div class="mt-8">
            <label class="text-sm font-bold text-foreground">
              닉네임
              <span class="ml-1 font-normal text-muted-foreground">(2~20자)</span>
            </label>
            <AppInput
              v-model="nickname"
              class="mt-2"
              placeholder="닉네임을 입력해주세요"
              :maxlength="20"
            />
            <p
              v-if="nickname.trim().length > 0 && nickname.trim().length < 2"
              class="mt-1.5 text-xs text-destructive"
            >
              닉네임은 2자 이상이어야 해요
            </p>
          </div>

          <AppButton class="mt-8 w-full" size="lg" :disabled="!canProceed" @click="goNext">
            다음
            <ChevronRight class="size-4" />
          </AppButton>
        </div>

        <!-- ── Step 2: 직종 선택 ── -->
        <div v-else>
          <h1 class="text-2xl font-black text-foreground">어떤 분야에서 일하고 계신가요?</h1>
          <p class="mt-2 text-sm text-muted-foreground">
            포트폴리오 분석에 더 맞는 피드백을 드릴게요.
          </p>

          <div class="mt-8 grid grid-cols-3 gap-2.5">
            <button
              v-for="job in jobs"
              :key="job.value"
              type="button"
              class="flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-4 transition-colors"
              :class="
                selectedJob === job.value
                  ? 'border-primary bg-accent'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-slate-50'
              "
              @click="selectedJob = job.value"
            >
              <span class="text-2xl">{{ job.icon }}</span>
              <span
                class="text-center text-xs font-semibold leading-4"
                :class="selectedJob === job.value ? 'text-primary' : 'text-foreground'"
              >
                {{ job.label }}
              </span>
            </button>
          </div>

          <AppButton class="mt-8 w-full" size="lg" @click="handleComplete"> 시작하기 </AppButton>

          <button
            type="button"
            class="mt-4 w-full text-center text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            @click="handleSkip"
          >
            나중에 설정할게요
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
