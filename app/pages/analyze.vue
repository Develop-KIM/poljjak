<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowRight, CheckCircle2, Loader2 } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import type { AnalysisResult } from '~~/server/utils/clova'

const authStore = useAuthStore()
const toast = useToastStore()

const uploadedFiles = ref<File[]>([])
const additionalNote = ref('')
const showLoginModal = ref(false)
const analyzing = ref(false)

// 분석 단계 시뮬레이션 (실제 진행은 서버에서 순차적으로 발생)
const analysisStep = ref(0)
const steps = [
  { label: 'PDF 업로드 중', sublabel: '파일을 서버로 전송하고 있어요' },
  { label: '텍스트 추출 중', sublabel: 'PDF에서 내용을 읽고 있어요' },
  { label: 'AI 분석 중', sublabel: 'AI가 포트폴리오를 꼼꼼히 보고 있어요' },
]

let stepTimer: ReturnType<typeof setInterval> | null = null

function startStepAnimation() {
  analysisStep.value = 0
  stepTimer = setInterval(() => {
    if (analysisStep.value < steps.length - 1) analysisStep.value++
  }, 4000)
}

function stopStepAnimation() {
  if (stepTimer) {
    clearInterval(stepTimer)
    stepTimer = null
  }
  analysisStep.value = 0
}

const checklist = ['PDF 파일만 가능', '10MB 이하', '최대 50페이지', '텍스트 선택이 가능한 PDF']

const canAnalyze = computed(() => uploadedFiles.value.length > 0 && !analyzing.value)

onMounted(() => {
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
  }
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
  <div class="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-14">
    <!-- ── 분석 중 화면 ── -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
    >
      <div v-if="analyzing" class="flex flex-col items-center justify-center py-24">
        <!-- 파일명 -->
        <p class="text-sm text-muted-foreground">{{ uploadedFiles.map(f => f.name).join(', ') }}</p>

        <!-- 스피너 -->
        <div class="relative mt-8">
          <div class="size-20 animate-spin rounded-full border-4 border-border border-t-primary" />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-xs font-bold text-primary">AI</span>
          </div>
        </div>

        <!-- 단계별 진행 -->
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

    <!-- ── 업로드 화면 ── -->
    <template v-if="!analyzing">
      <div class="max-w-2xl">
        <AppBadge variant="blue">포트폴리오 분석</AppBadge>
        <h1 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
          PDF를 올리고 AI 피드백을 받아보세요
        </h1>
        <p class="mt-4 text-base leading-7 text-muted-foreground">
          추가 요청사항을 적으면 원하는 방향에 맞춰 더 구체적인 피드백을 받을 수 있어요.
        </p>
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <AppCard>
          <!-- 모바일 전용: 안내 + 업로드 전 확인 -->
          <div class="mb-5 grid gap-3 lg:hidden">
            <AppAlert>
              이미지 스캔 PDF는 텍스트를 추출할 수 없어 분석이 제한됩니다. 텍스트 선택이 가능한 PDF를 올려주세요.
            </AppAlert>
            <div class="rounded-xl border border-border bg-slate-50/60 p-4">
              <h2 class="text-sm font-black text-foreground">업로드 전 확인</h2>
              <ul class="mt-2 grid gap-2">
                <li
                  v-for="item in checklist"
                  :key="item"
                  class="flex items-center gap-2 text-xs font-semibold text-foreground"
                >
                  <CheckCircle2 class="size-4 shrink-0 text-emerald-500" />
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>

          <PdfUploadDropzone @update:files="uploadedFiles = $event" />

          <div class="mt-6">
            <label for="analysis-note" class="text-sm font-bold text-foreground">
              추가 요청사항
              <span class="ml-1 font-normal text-muted-foreground">(선택)</span>
            </label>
            <AppTextarea
              id="analysis-note"
              v-model="additionalNote"
              class="mt-2"
              placeholder="예: 프로젝트 설명이 설득력 있는지, 주니어 프론트엔드 포지션에 맞는지 봐주세요."
              :rows="5"
              :maxlength="500"
              :show-count="true"
            />
          </div>

          <div class="mt-6 lg:flex lg:justify-end">
            <AppButton size="lg" class="w-full lg:w-auto" :disabled="!canAnalyze" @click="handleStartAnalysis">
              분석 시작
              <ArrowRight class="size-4" />
            </AppButton>
          </div>
        </AppCard>

        <!-- 데스크탑에서만 우측에 표시 -->
        <div class="hidden content-start gap-4 lg:grid">
          <AppAlert>
            이미지 스캔 PDF는 텍스트를 추출할 수 없어 분석이 제한됩니다. 텍스트 선택이 가능한 PDF를
            올려주세요.
          </AppAlert>
          <AppCard>
            <h2 class="text-base font-black text-foreground">업로드 전 확인</h2>
            <ul class="mt-4 grid gap-3">
              <li
                v-for="item in checklist"
                :key="item"
                class="flex items-center gap-3 text-sm font-semibold"
              >
                <CheckCircle2 class="size-5 shrink-0 text-emerald-500" />
                {{ item }}
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
