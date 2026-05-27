<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Link,
  Lock,
  Unlock,
  MessageSquare,
  ChevronDown,
  Check,
  Download,
  CheckCircle2,
  Loader2,
} from '@lucide/vue'
import type { AnalysisResult } from '~~/server/utils/clova'

const route = useRoute()
const id = route.params.id as string
const toast = useToastStore()

interface Analysis {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  isPublic: boolean
  shareToken: string | null
  result: AnalysisResult | null
  createdAt: string
}

const analysis = ref<Analysis | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)
const showScores = ref(false)
const linkCopied = ref(false)
const toggling = ref(false)
let pollTimer: ReturnType<typeof setTimeout> | null = null
let stepTimer: ReturnType<typeof setInterval> | null = null

const isProcessing = computed(
  () => analysis.value?.status === 'pending' || analysis.value?.status === 'processing'
)
const shouldShowProgress = computed(() => {
  if (pending.value) return true
  if (!analysis.value) return false
  if (analysis.value.status === 'failed') return false
  return isProcessing.value || !analysis.value.result
})

const processingStep = ref(0)
const processingSteps = [
  { label: 'PDF 업로드 중', sublabel: '파일을 서버로 전송하고 있어요' },
  { label: '텍스트 추출 중', sublabel: 'PDF에서 내용을 읽고 있어요' },
  { label: 'AI 분석 중', sublabel: 'AI가 포트폴리오를 꼼꼼히 보고 있어요' },
]

const createdAtLabel = computed(() => {
  if (!analysis.value?.createdAt) return ''
  return new Date(analysis.value.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

async function fetchAnalysis() {
  try {
    const res = await $fetch<{ data: Analysis }>(`/api/analyses/${id}`)
    analysis.value = res.data
    error.value = res.data.status === 'failed' ? '분석에 실패했어요' : null

    if (shouldShowProgress.value) {
      startProcessingAnimation()
      pollTimer = setTimeout(fetchAnalysis, 4000)
    } else {
      stopProcessingAnimation()
    }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    if (analysis.value && shouldShowProgress.value) {
      pollTimer = setTimeout(fetchAnalysis, 4000)
      return
    }
    error.value = err.data?.statusMessage ?? '분석 결과를 불러오지 못했어요'
  } finally {
    pending.value = false
  }
}

function startProcessingAnimation() {
  if (stepTimer) return
  stepTimer = setInterval(() => {
    if (processingStep.value < processingSteps.length - 1) processingStep.value++
  }, 3000)
}

function stopProcessingAnimation() {
  if (!stepTimer) return
  clearInterval(stepTimer)
  stepTimer = null
}

onMounted(fetchAnalysis)

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
  stopProcessingAnimation()
})

async function togglePublic() {
  if (!analysis.value || toggling.value) return
  toggling.value = true
  try {
    const next = !analysis.value.isPublic
    const res = await $fetch<{ data: Analysis }>(`/api/analyses/${id}`, {
      method: 'PATCH',
      body: { isPublic: next },
    })
    analysis.value = res.data
    toast.success(next ? '공개로 전환됐어요' : '비공개로 전환됐어요')
  } catch {
    toast.error('전환에 실패했어요')
  } finally {
    toggling.value = false
  }
}

async function copyShareLink() {
  if (!analysis.value) return

  // 비공개면 먼저 공개 전환
  if (!analysis.value.isPublic) {
    await togglePublic()
    if (!analysis.value?.isPublic) return
  }

  const token = analysis.value.shareToken
  if (!token) return

  const url = `${window.location.origin}/analysis/share/${token}`
  await navigator.clipboard.writeText(url)
  linkCopied.value = true
  toast.success('링크가 복사됐어요')
  setTimeout(() => {
    linkCopied.value = false
  }, 2000)
}

function shareToCommunity() {
  navigateTo(`/community/write?analysisId=${id}`)
}

function downloadAsPdf() {
  // 점수 섹션을 열린 상태로 인쇄
  const wasOpen = showScores.value
  showScores.value = true
  nextTick(() => {
    window.print()
    if (!wasOpen) showScores.value = false
  })
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 py-10 md:px-8 md:py-14">
    <!-- 분석 진행 중 (analyze.vue와 동일한 UI) -->
    <div v-if="shouldShowProgress" class="flex flex-col items-center justify-center py-24">
      <p class="text-sm text-muted-foreground">{{ analysis?.title ?? '포트폴리오 분석 결과' }}</p>
      <div class="relative mt-8">
        <div class="size-20 animate-spin rounded-full border-4 border-border border-t-primary" />
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xs font-bold text-primary">AI</span>
        </div>
      </div>
      <div class="mt-10 w-full max-w-sm">
        <div
          v-for="(step, i) in processingSteps"
          :key="step.label"
          class="flex items-start gap-3 py-3"
          :class="i < processingSteps.length - 1 ? 'border-b border-border' : ''"
        >
          <div class="mt-0.5 shrink-0">
            <CheckCircle2 v-if="i < processingStep" class="size-5 text-emerald-500" />
            <Loader2 v-else-if="i === processingStep" class="size-5 animate-spin text-primary" />
            <div v-else class="size-5 rounded-full border-2 border-border" />
          </div>
          <div>
            <p
              class="text-sm font-bold"
              :class="i <= processingStep ? 'text-foreground' : 'text-muted-foreground'"
            >
              {{ step.label }}
            </p>
            <p v-if="i === processingStep" class="mt-0.5 text-xs text-muted-foreground">
              {{ step.sublabel }}
            </p>
          </div>
        </div>
      </div>
      <p class="mt-8 text-sm text-muted-foreground">보통 30초~1분 정도 소요돼요</p>
    </div>

    <!-- 에러 -->
    <AppEmptyState v-else-if="error" :title="error" description="잠시 후 다시 시도해주세요." />

    <!-- 결과 -->
    <template v-else-if="analysis?.result">
      <!-- ── 헤더 ── -->
      <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <AppBadge variant="green">분석 완료</AppBadge>
          </div>
          <h1 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
            {{ analysis.title }}
          </h1>
          <p class="mt-2 text-sm text-muted-foreground">
            {{ createdAtLabel }}
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <AppButton variant="outline" size="sm" @click="downloadAsPdf">
            <Download class="size-4" />
            PDF 저장
          </AppButton>
          <AppButton variant="outline" size="sm" @click="copyShareLink">
            <Check v-if="linkCopied" class="size-4 text-emerald-500" />
            <Link v-else class="size-4" />
            {{ linkCopied ? '복사됐어요' : '링크 복사' }}
          </AppButton>
          <AppButton variant="outline" size="sm" :disabled="toggling" @click="togglePublic">
            <Unlock v-if="analysis.isPublic" class="size-4" />
            <Lock v-else class="size-4" />
            {{ analysis.isPublic ? '공개' : '비공개' }}
          </AppButton>
          <AppButton size="sm" @click="shareToCommunity">
            <MessageSquare class="size-4" />
            커뮤니티에 공유
          </AppButton>
        </div>
      </div>

      <!-- ── 종합 피드백 ── -->
      <AppCard class="mt-8">
        <h2 class="text-lg font-black text-foreground">종합 피드백</h2>
        <p class="mt-3 leading-7 text-muted-foreground">{{ analysis.result.summary }}</p>
      </AppCard>

      <!-- ── Before / After 개선안 (메인) ── -->
      <section class="mt-8">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-black text-foreground">
            개선 포인트
            <span class="ml-2 text-sm font-semibold text-muted-foreground">
              {{ analysis.result.suggestions.length }}개
            </span>
          </h2>
        </div>
        <p class="mt-1 text-sm text-muted-foreground">
          아래 개선안을 포트폴리오에 바로 적용해보세요.
        </p>

        <div class="mt-5 grid gap-4">
          <BeforeAfterBlock
            v-for="(s, i) in analysis.result.suggestions"
            :key="i"
            :category="s.category"
            :context="s.context"
            :before="s.before"
            :after="s.after"
          />
        </div>
      </section>

      <!-- ── 항목별 점수 (접기/펼치기) ── -->
      <section class="mt-8">
        <!-- print 전용 헤더 (화면에서는 숨김) -->
        <h2 class="hidden text-xl font-black text-foreground print:block">항목별 점수</h2>
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted print:hidden"
          @click="showScores = !showScores"
        >
          <span class="text-base font-bold text-foreground">항목별 점수 보기</span>
          <ChevronDown
            class="size-5 text-muted-foreground transition-transform duration-200"
            :class="{ 'rotate-180': showScores }"
          />
        </button>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div
            v-if="showScores"
            data-print-open
            class="mt-3 grid auto-rows-fr gap-3 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnalysisScoreCard
              v-for="score in analysis.result.scores"
              :key="score.title"
              :title="score.title"
              :score="score.score"
              :comment="score.comment"
              :improvement="score.improvement"
            />
          </div>
        </Transition>
      </section>
    </template>
  </div>
</template>
