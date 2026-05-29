<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowRight, CheckCircle2, Loader2 } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'

useSeoMeta({
  title: '포트폴리오 분석',
  description: 'PDF 포트폴리오를 업로드하면 AI가 분석하고 Before/After 개선안을 제시해드려요.',
  ogTitle: '포트폴리오 분석 · 폴짝',
  ogDescription: 'PDF를 올리면 AI 분석과 우선순위 액션 플랜을 받아볼 수 있어요.',
  ogUrl: 'https://poljjak.kr/analyze',
})

const authStore = useAuthStore()
const toast = useToastStore()

const JOB_ROLES = [
  { value: 'frontend', label: '프론트엔드' },
  { value: 'backend', label: '백엔드' },
  { value: 'fullstack', label: '풀스택' },
  { value: 'devops', label: 'DevOps' },
  { value: 'ml', label: 'ML/AI' },
] as const

const SENIORITIES = [
  { value: 'junior', label: '신입' },
  { value: 'mid', label: '주니어 (1~3년)' },
  { value: 'senior', label: '시니어 (5년+)' },
] as const

const uploadedFiles = ref<File[]>([])
const additionalNote = ref('')
const selectedJobRole = ref<string | null>(null)
const selectedSeniority = ref<string | null>(null)
const showLoginModal = ref(false)
const analyzing = ref(false)

const analysisStep = ref(0)
const steps = [
  { label: 'PDF 업로드 중', sublabel: '파일을 서버로 전송하고 있어요' },
  { label: '텍스트 추출 중', sublabel: 'PDF에서 내용을 읽고 있어요' },
  { label: 'AI 분석 중', sublabel: '포트폴리오를 꼼꼼히 분석하고 있어요' },
]

let stepTimer: ReturnType<typeof setInterval> | null = null

function startStepAnimation() {
  analysisStep.value = 0
  stepTimer = setInterval(() => {
    if (analysisStep.value < steps.length - 1) analysisStep.value++
  }, 5000)
}

function stopStepAnimation() {
  if (stepTimer) {
    clearInterval(stepTimer)
    stepTimer = null
  }
  analysisStep.value = 0
}

const canAnalyze = computed(() => uploadedFiles.value.length > 0 && !analyzing.value)

onMounted(() => {
  if (!authStore.isLoggedIn) showLoginModal.value = true
})

async function handleStartAnalysis() {
  if (!canAnalyze.value || uploadedFiles.value.length === 0) return
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
    return
  }

  analyzing.value = true
  startStepAnimation()

  try {
    const formData = new FormData()
    uploadedFiles.value.forEach((f) => formData.append('file', f))
    if (additionalNote.value.trim()) {
      formData.append('additionalNote', additionalNote.value.trim())
    }
    if (selectedJobRole.value) formData.append('jobRole', selectedJobRole.value)
    if (selectedSeniority.value) formData.append('seniority', selectedSeniority.value)

    const res = await $fetch<{ data: { id: string; status: string } }>('/api/analyses', {
      method: 'POST',
      body: formData,
    })

    await navigateTo(`/analysis/${res.data.id}`)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    const msg = err.data?.statusMessage ?? '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.'
    toast.error(msg)
  } finally {
    analyzing.value = false
    stopStepAnimation()
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 py-10 md:px-8 md:py-14">
    <!-- 분석 중 화면 -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
    >
      <div v-if="analyzing" class="flex flex-col items-center justify-center py-24">
        <p class="text-sm text-muted-foreground">
          {{ uploadedFiles.map((f) => f.name).join(', ') }}
        </p>
        <div class="relative mt-8">
          <div class="size-20 animate-spin rounded-full border-4 border-border border-t-primary" />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-xs font-bold text-primary">AI</span>
          </div>
        </div>
        <div class="mt-10 w-full max-w-sm">
          <div
            v-for="(step, i) in steps"
            :key="step.label"
            class="flex items-start gap-3 py-3"
            :class="i < steps.length - 1 ? 'border-b border-border' : ''"
          >
            <div class="mt-0.5 shrink-0">
              <CheckCircle2 v-if="i < analysisStep" class="size-5 text-emerald-500" />
              <Loader2 v-else-if="i === analysisStep" class="size-5 animate-spin text-primary" />
              <div v-else class="size-5 rounded-full border-2 border-border" />
            </div>
            <div>
              <p
                class="text-sm font-bold"
                :class="i <= analysisStep ? 'text-foreground' : 'text-muted-foreground'"
              >
                {{ step.label }}
              </p>
              <p v-if="i === analysisStep" class="mt-0.5 text-xs text-muted-foreground">
                {{ step.sublabel }}
              </p>
            </div>
          </div>
        </div>
        <p class="mt-8 text-sm text-muted-foreground">보통 30초~1분 정도 소요돼요</p>
      </div>
    </Transition>

    <!-- 업로드 화면 -->
    <template v-if="!analyzing">
      <div class="max-w-2xl">
        <AppBadge variant="blue">포트폴리오 분석</AppBadge>
        <h1 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
          AI 포트폴리오 분석
        </h1>
        <p class="mt-4 text-base leading-7 text-muted-foreground">
          PDF를 업로드하면 AI가 개선이 필요한 부분을 찾아 Before/After 개선안을 제시해드려요.
        </p>
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div class="flex flex-col gap-6">
          <!-- PDF 업로드 -->
          <AppCard>
            <h2 class="text-sm font-bold text-foreground">PDF 업로드</h2>
            <div class="mt-3">
              <PdfUploadDropzone @update:files="uploadedFiles = $event" />
            </div>

            <!-- 직군 선택 -->
            <div class="mt-5">
              <p class="text-sm font-bold text-foreground">
                직군
                <span class="ml-1 font-normal text-muted-foreground">(선택)</span>
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="role in JOB_ROLES"
                  :key="role.value"
                  type="button"
                  class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
                  :class="
                    selectedJobRole === role.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-muted-foreground hover:border-primary/40'
                  "
                  @click="selectedJobRole = selectedJobRole === role.value ? null : role.value"
                >
                  {{ role.label }}
                </button>
              </div>
            </div>

            <!-- 연차 선택 -->
            <div class="mt-4">
              <p class="text-sm font-bold text-foreground">
                연차
                <span class="ml-1 font-normal text-muted-foreground">(선택)</span>
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="seniority in SENIORITIES"
                  :key="seniority.value"
                  type="button"
                  class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
                  :class="
                    selectedSeniority === seniority.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-muted-foreground hover:border-primary/40'
                  "
                  @click="
                    selectedSeniority =
                      selectedSeniority === seniority.value ? null : seniority.value
                  "
                >
                  {{ seniority.label }}
                </button>
              </div>
            </div>

            <div class="mt-5">
              <label for="analysis-note" class="text-sm font-bold text-foreground">
                추가 요청사항
                <span class="ml-1 font-normal text-muted-foreground">(선택)</span>
              </label>
              <AppTextarea
                id="analysis-note"
                v-model="additionalNote"
                class="mt-2"
                placeholder="예: 프론트엔드 신입 포지션 기준으로 부족한 부분을 집중적으로 봐주세요."
                :rows="4"
                :maxlength="500"
                :show-count="true"
              />
            </div>

            <div class="mt-5 flex justify-end">
              <AppButton size="lg" :disabled="!canAnalyze" @click="handleStartAnalysis">
                분석 시작
                <ArrowRight class="size-4" />
              </AppButton>
            </div>
          </AppCard>
        </div>

        <!-- 우측 안내 -->
        <div class="hidden content-start gap-4 lg:grid">
          <AppAlert>
            이미지 스캔 PDF는 텍스트를 추출할 수 없어 분석이 제한됩니다. 텍스트 선택이 가능한 PDF를
            올려주세요.
          </AppAlert>
          <AppCard>
            <h2 class="text-sm font-black text-foreground">분석 결과에서 받는 것</h2>
            <ul class="mt-4 grid gap-3 text-sm text-muted-foreground">
              <li class="flex gap-2">
                <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span>우선순위 기반 개선 이슈 목록</span>
              </li>
              <li class="flex gap-2">
                <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span>원본과 AI 개선본 분할 비교</span>
              </li>
              <li class="flex gap-2">
                <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span>섹션별 Before/After 문장</span>
              </li>
            </ul>
          </AppCard>
          <AppCard>
            <h2 class="text-sm font-black text-foreground">업로드 전 확인</h2>
            <ul class="mt-4 grid gap-3 text-sm text-muted-foreground">
              <li class="flex gap-2">
                <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span>PDF 파일만 가능</span>
              </li>
              <li class="flex gap-2">
                <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span>10MB 이하</span>
              </li>
              <li class="flex gap-2">
                <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span>텍스트 선택이 가능한 PDF</span>
              </li>
            </ul>
          </AppCard>
        </div>
      </div>
    </template>

    <LoginModal
      :open="showLoginModal"
      context="포트폴리오 분석하기"
      description="로그인 후 AI 포트폴리오 분석을 이용할 수 있어요."
      @close="
        () => {
          showLoginModal = false
          if (!authStore.isLoggedIn) navigateTo('/')
        }
      "
    />
  </div>
</template>
