<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowRight, CheckCircle2, Loader2 } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'

useSeoMeta({
  title: '포트폴리오 분석',
  description:
    'PDF 포트폴리오를 업로드하면 직군·연차 맞춤 AI 분석을 수행하고 Before/After 개선안을 제시해드려요.',
  ogTitle: '포트폴리오 분석 · 폴짝',
  ogDescription: 'PDF를 올리면 직군·연차별 맞춤 AI 분석과 우선순위 액션 플랜을 받아볼 수 있어요.',
  ogUrl: 'https://poljjak.kr/analyze',
})

type JobRole = 'frontend' | 'backend' | 'fullstack' | 'devops' | 'ml'
type Seniority = 'junior' | 'mid' | 'senior'

interface JobRoleOption {
  value: JobRole
  label: string
  emoji: string
  desc: string
}

interface SeniorityOption {
  value: Seniority
  label: string
  desc: string
}

const JOB_ROLES: JobRoleOption[] = [
  { value: 'frontend', label: '프론트엔드', emoji: '🖥️', desc: 'React, Vue, UI/UX' },
  { value: 'backend', label: '백엔드', emoji: '⚙️', desc: 'API, DB, 서버' },
  { value: 'fullstack', label: '풀스택', emoji: '🔗', desc: '프론트+백엔드 전반' },
  { value: 'devops', label: 'DevOps', emoji: '🚀', desc: 'CI/CD, 클라우드, 인프라' },
  { value: 'ml', label: 'ML/AI', emoji: '🤖', desc: '모델 개발, MLOps' },
]

const SENIORITIES: SeniorityOption[] = [
  { value: 'junior', label: '신입', desc: '인턴·첫 취업 준비 중' },
  { value: 'mid', label: '주니어', desc: '1~3년차' },
  { value: 'senior', label: '시니어', desc: '5년차 이상' },
]

const authStore = useAuthStore()
const toast = useToastStore()

const selectedRole = ref<JobRole | null>(null)
const selectedSeniority = ref<Seniority | null>(null)
const uploadedFiles = ref<File[]>([])
const additionalNote = ref('')
const showLoginModal = ref(false)
const analyzing = ref(false)

const analysisStep = ref(0)
const steps = [
  { label: 'PDF 업로드 중', sublabel: '파일을 서버로 전송하고 있어요' },
  { label: '텍스트 추출 중', sublabel: 'PDF에서 내용을 읽고 있어요' },
  { label: 'AI 분석 중', sublabel: `직군·연차 기준으로 꼼꼼히 분석하고 있어요` },
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

const canAnalyze = computed(
  () =>
    uploadedFiles.value.length > 0 &&
    selectedRole.value !== null &&
    selectedSeniority.value !== null &&
    !analyzing.value
)

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
    formData.append('jobRole', selectedRole.value!)
    formData.append('seniority', selectedSeniority.value!)
    if (additionalNote.value.trim()) {
      formData.append('additionalNote', additionalNote.value.trim())
    }

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
          직군·연차 맞춤 AI 분석
        </h1>
        <p class="mt-4 text-base leading-7 text-muted-foreground">
          직군과 연차를 선택하면 해당 기준에 맞는 피드백과 Before/After 개선안을 받을 수 있어요.
        </p>
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div class="flex flex-col gap-6">
          <!-- 직군 선택 -->
          <AppCard>
            <h2 class="text-sm font-bold text-foreground">
              직군 선택
              <span class="ml-1 text-destructive">*</span>
            </h2>
            <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
              <button
                v-for="role in JOB_ROLES"
                :key="role.value"
                type="button"
                class="flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition-all"
                :class="
                  selectedRole === role.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted'
                "
                @click="selectedRole = role.value"
              >
                <span class="text-2xl">{{ role.emoji }}</span>
                <span class="text-xs font-bold">{{ role.label }}</span>
                <span class="text-[10px] text-muted-foreground">{{ role.desc }}</span>
              </button>
            </div>
          </AppCard>

          <!-- 연차 선택 -->
          <AppCard>
            <h2 class="text-sm font-bold text-foreground">
              연차 선택
              <span class="ml-1 text-destructive">*</span>
            </h2>
            <div class="mt-3 grid grid-cols-3 gap-2">
              <button
                v-for="s in SENIORITIES"
                :key="s.value"
                type="button"
                class="flex flex-col gap-0.5 rounded-xl border-2 px-4 py-3 text-left transition-all"
                :class="
                  selectedSeniority === s.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted'
                "
                @click="selectedSeniority = s.value"
              >
                <span class="text-sm font-bold">{{ s.label }}</span>
                <span class="text-[11px] text-muted-foreground">{{ s.desc }}</span>
              </button>
            </div>
          </AppCard>

          <!-- PDF 업로드 -->
          <AppCard>
            <h2 class="text-sm font-bold text-foreground">PDF 업로드</h2>
            <div class="mt-3">
              <PdfUploadDropzone @update:files="uploadedFiles = $event" />
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
              <li class="flex gap-2">
                <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span>체크리스트형 액션 플랜</span>
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
