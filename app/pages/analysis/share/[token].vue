<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronDown } from '@lucide/vue'
import type { AnalysisResult } from '~/server/utils/clova'

const route = useRoute()
const token = route.params.token as string

interface SharedAnalysis {
  id: string
  title: string
  result: AnalysisResult | null
  createdAt: string
}

const analysis = ref<SharedAnalysis | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)
const showScores = ref(false)

const overallScore = computed(() => {
  const scores = analysis.value?.result?.scores
  if (!scores?.length) return null
  return Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
})

const scoreColor = computed(() => {
  const s = overallScore.value
  if (s === null) return 'text-muted-foreground'
  if (s >= 8) return 'text-emerald-600'
  if (s >= 6) return 'text-primary'
  return 'text-orange-500'
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
  <div class="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-14">
    <div v-if="pending" class="flex flex-col items-center gap-4 py-32">
      <div class="size-10 animate-spin rounded-full border-4 border-border border-t-primary" />
      <p class="text-sm text-muted-foreground">불러오는 중...</p>
    </div>

    <AppEmptyState
      v-else-if="error"
      :title="error"
      description="링크가 만료되었거나 비공개로 전환된 결과예요."
    />

    <template v-else-if="analysis?.result">
      <!-- 공유 배너 -->
      <div class="mb-6 flex items-center justify-between rounded-xl bg-accent px-5 py-3">
        <p class="text-sm text-muted-foreground">
          <span class="font-semibold text-foreground">폴짝</span>으로 분석한 포트폴리오 결과예요
        </p>
        <NuxtLink to="/analyze">
          <AppButton size="sm">나도 분석받기</AppButton>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-3">
        <AppBadge variant="green">분석 완료</AppBadge>
        <span v-if="overallScore !== null" class="text-base font-black" :class="scoreColor">
          종합 {{ overallScore }}/10
        </span>
      </div>
      <h1 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
        {{ analysis.title }}
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">{{ createdAtLabel }}</p>

      <AppCard class="mt-8">
        <h2 class="text-lg font-black text-foreground">종합 피드백</h2>
        <p class="mt-3 leading-7 text-muted-foreground">{{ analysis.result.summary }}</p>
      </AppCard>

      <section class="mt-8">
        <h2 class="text-xl font-black text-foreground">
          개선 포인트
          <span class="ml-2 text-sm font-semibold text-muted-foreground">
            {{ analysis.result.suggestions.length }}개
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
          class="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-slate-50"
          @click="showScores = !showScores"
        >
          <span class="text-base font-bold text-foreground">항목별 점수 보기</span>
          <ChevronDown
            class="size-5 text-muted-foreground transition-transform duration-200"
            :class="{ 'rotate-180': showScores }"
          />
        </button>
        <div v-if="showScores" class="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
  </div>
</template>
