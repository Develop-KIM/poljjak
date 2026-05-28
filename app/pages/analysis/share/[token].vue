<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { marked } from 'marked'
import type { AnalysisResult, AnalysisIssue, AnalysisActionItem } from '~~/server/utils/clova'

const route = useRoute()
const token = route.params.token as string

const PRIORITY_STYLES: Record<string, { label: string; cls: string }> = {
  high: { label: '높음', cls: 'bg-red-50 text-red-600 border-red-200' },
  medium: { label: '중간', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  low: { label: '낮음', cls: 'bg-muted text-muted-foreground border-border' },
}
const JOB_ROLE_LABELS: Record<string, string> = {
  frontend: '프론트엔드',
  backend: '백엔드',
  fullstack: '풀스택',
  devops: 'DevOps',
  ml: 'ML/AI',
}
const SENIORITY_LABELS: Record<string, string> = {
  junior: '신입',
  mid: '주니어',
  senior: '시니어',
}

interface SharedAnalysis {
  id: string
  title: string
  jobRole: string | null
  seniority: string | null
  result: AnalysisResult | null
  issues: AnalysisIssue[] | null
  actionPlan: AnalysisActionItem[] | null
  maskedAfterHtml: string | null
  afterHtml: string | null
  totalScore?: number | null
  createdAt: string
}

const analysis = ref<SharedAnalysis | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)
const showScores = ref(false)

useSeoMeta({
  title: () =>
    analysis.value?.title ? `${analysis.value.title} 분석 결과` : '포트폴리오 분석 결과',
  description:
    'AI가 분석한 포트폴리오 결과를 확인해보세요. 항목별 점수와 Before/After 개선안이 포함되어 있어요.',
  ogTitle: () =>
    analysis.value?.title ? `${analysis.value.title} 분석 결과` : '포트폴리오 분석 결과',
  ogDescription:
    'AI가 분석한 포트폴리오 결과를 확인해보세요. 항목별 점수와 Before/After 개선안이 포함되어 있어요.',
})

const isV2 = computed(
  () => !!(analysis.value?.issues || analysis.value?.maskedAfterHtml || analysis.value?.afterHtml)
)

const publicAfterHtml = computed(() => {
  const raw = analysis.value?.maskedAfterHtml ?? analysis.value?.afterHtml ?? null
  if (!raw) return null
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(raw)
  if (hasHtmlTags) return raw
  return marked.parse(raw, { async: false }) as string
})

const issues = computed<AnalysisIssue[]>(() => {
  const raw = analysis.value?.issues ?? []
  const priority = { high: 0, medium: 1, low: 2 }
  return [...raw].sort((a, b) => (priority[a.priority] ?? 3) - (priority[b.priority] ?? 3))
})

const overallScore = computed(() => {
  if (analysis.value?.result) {
    const scores = analysis.value.result.scores
    if (scores?.length) return Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
  }
  return null
})

const createdAtLabel = computed(() => {
  if (!analysis.value?.createdAt) return ''
  return new Date(analysis.value.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

onMounted(async () => {
  try {
    const res = await $fetch<{ data: SharedAnalysis }>(`/api/analyses/share/${token}`)
    analysis.value = res.data
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    error.value = err.data?.statusMessage ?? '분석 결과를 불러오지 못했어요'
  } finally {
    pending.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 py-10 md:px-8 md:py-14">
    <div v-if="pending" class="flex flex-col items-center gap-4 py-32">
      <div class="size-10 animate-spin rounded-full border-4 border-border border-t-primary" />
      <p class="text-sm text-muted-foreground">불러오는 중...</p>
    </div>

    <AppEmptyState
      v-else-if="error"
      :title="error"
      description="링크가 만료되었거나 비공개로 전환된 결과예요."
    />

    <template v-else-if="analysis">
      <!-- 공유 배너 -->
      <div class="mb-6 flex items-center justify-between rounded-xl bg-accent px-5 py-3">
        <p class="text-sm text-muted-foreground">
          <span class="font-semibold text-foreground">폴짝</span>으로 분석한 포트폴리오 결과예요
        </p>
        <NuxtLink to="/analyze">
          <AppButton size="sm">나도 분석받기</AppButton>
        </NuxtLink>
      </div>

      <!-- 헤더 -->
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge variant="green">분석 완료</AppBadge>
        <span
          v-if="analysis.jobRole"
          class="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold"
        >
          {{ JOB_ROLE_LABELS[analysis.jobRole] ?? analysis.jobRole }}
        </span>
        <span
          v-if="analysis.seniority"
          class="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold"
        >
          {{ SENIORITY_LABELS[analysis.seniority] ?? analysis.seniority }}
        </span>
        <span
          v-if="overallScore !== null"
          class="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-bold text-primary"
        >
          {{ overallScore }}점
        </span>
      </div>
      <h1 class="mt-3 text-2xl font-black leading-tight text-foreground md:text-3xl">
        {{ analysis.title }}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">{{ createdAtLabel }}</p>

      <!-- v2: After HTML -->
      <template v-if="isV2">
        <AppCard v-if="analysis.result?.summary" class="mt-6">
          <h2 class="text-base font-bold text-foreground">AI 총평</h2>
          <p class="mt-2 leading-7 text-muted-foreground">{{ analysis.result.summary }}</p>
        </AppCard>

        <section v-if="publicAfterHtml" class="mt-6">
          <h2 class="text-lg font-black text-foreground">AI 개선본</h2>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            class="share-after-html mt-4 rounded-2xl border border-border bg-white px-10 py-10 shadow-sm"
            v-html="publicAfterHtml"
          />
        </section>

        <section v-if="issues.length > 0" class="mt-8">
          <h2 class="text-lg font-black text-foreground">
            이슈 목록
            <span class="ml-1 text-base font-semibold text-muted-foreground"
              >({{ issues.length }}개)</span
            >
          </h2>
          <div class="mt-4 grid gap-3">
            <div
              v-for="issue in issues"
              :key="issue.id"
              class="rounded-2xl border border-border bg-card p-4"
            >
              <div class="flex items-start gap-3">
                <span
                  class="mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                  :class="PRIORITY_STYLES[issue.priority]?.cls"
                >
                  {{ PRIORITY_STYLES[issue.priority]?.label }}
                </span>
                <div>
                  <p class="text-sm font-bold text-foreground">{{ issue.title }}</p>
                  <p class="mt-0.5 text-sm text-muted-foreground">{{ issue.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- v1 하위호환 -->
      <template v-else-if="analysis.result">
        <AppCard class="mt-8">
          <h2 class="text-lg font-black text-foreground">종합 피드백</h2>
          <p class="mt-3 leading-7 text-muted-foreground">{{ analysis.result.summary }}</p>
        </AppCard>

        <section class="mt-8">
          <h2 class="text-xl font-black text-foreground">
            개선 포인트
            <span class="ml-2 text-sm font-semibold text-muted-foreground">
              {{ analysis.result.suggestions?.length ?? 0 }}개
            </span>
          </h2>
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

        <section class="mt-8">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted"
            @click="showScores = !showScores"
          >
            <span class="text-base font-bold text-foreground">항목별 점수 보기</span>
            <ChevronDown
              class="size-5 text-muted-foreground transition-transform duration-200"
              :class="{ 'rotate-180': showScores }"
            />
          </button>
          <div v-if="showScores" class="mt-3 grid auto-rows-fr gap-3 md:grid-cols-2 lg:grid-cols-3">
            <AnalysisScoreCard
              v-for="score in analysis.result.scores"
              :key="score.title"
              :title="score.title"
              :score="score.score"
              :comment="score.comment"
              :improvement="score.improvement"
            />
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.share-after-html {
  color: #111;
  font-size: 0.875rem;
  line-height: 1.8;
}
.share-after-html :deep(h1) {
  font-size: 1.4rem;
  font-weight: 900;
  margin-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}
.share-after-html :deep(h2) {
  font-size: 1.05rem;
  font-weight: 800;
  margin-top: 1.5rem;
  margin-bottom: 0.4rem;
}
.share-after-html :deep(h3) {
  font-size: 0.9rem;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.25rem;
}
.share-after-html :deep(p) {
  margin-bottom: 0.6rem;
}
.share-after-html :deep(ul),
.share-after-html :deep(ol) {
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}
.share-after-html :deep(li) {
  margin-bottom: 0.2rem;
}
.share-after-html :deep(strong) {
  font-weight: 700;
}
</style>
