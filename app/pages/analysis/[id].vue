<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Link, Lock, Unlock, MessageSquare } from '@lucide/vue'
import type { AnalysisResult } from '~/server/utils/clova'

const route = useRoute()
const id = route.params.id as string

interface Analysis {
  id: string
  title: string
  status: string
  isPublic: boolean
  result: AnalysisResult | null
  createdAt: string
}

const analysis = ref<Analysis | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)

const overallScore = computed(() => {
  const scores = analysis.value?.result?.scores
  if (!scores?.length) return null
  return Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
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
    const res = await $fetch<{ data: Analysis }>(`/api/analyses/${id}`)
    analysis.value = res.data
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    error.value = err.data?.statusMessage ?? '분석 결과를 불러오지 못했어요'
  } finally {
    pending.value = false
  }
})

async function togglePublic() {
  if (!analysis.value) return
  const next = !analysis.value.isPublic
  await $fetch(`/api/analyses/${id}`, {
    method: 'PATCH',
    body: { isPublic: next },
  })
  analysis.value.isPublic = next
}
</script>

<template>
  <div class="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-14">
    <!-- 로딩 -->
    <div v-if="pending" class="flex flex-col items-center gap-4 py-32">
      <div class="size-10 animate-spin rounded-full border-4 border-border border-t-primary" />
      <p class="text-sm text-muted-foreground">분석 결과를 불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <AppEmptyState v-else-if="error" :title="error" description="잠시 후 다시 시도해주세요." />

    <!-- 결과 -->
    <template v-else-if="analysis?.result">
      <!-- 헤더 -->
      <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <AppBadge variant="green">분석 완료</AppBadge>
            <span v-if="overallScore !== null" class="text-sm font-bold text-primary">
              종합 {{ overallScore }}/10
            </span>
          </div>
          <h1 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
            {{ analysis.title }}
          </h1>
          <p class="mt-2 text-sm text-muted-foreground">
            {{ createdAtLabel }} · {{ analysis.isPublic ? '공개' : '비공개' }}
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <AppButton variant="outline" size="sm">
            <Link class="size-4" />
            공유 링크 생성
          </AppButton>
          <AppButton variant="outline" size="sm" @click="togglePublic">
            <Unlock v-if="analysis.isPublic" class="size-4" />
            <Lock v-else class="size-4" />
            {{ analysis.isPublic ? '공개' : '비공개' }}
          </AppButton>
          <AppButton size="sm">
            <MessageSquare class="size-4" />
            커뮤니티에 공유
          </AppButton>
        </div>
      </div>

      <!-- 항목별 점수 -->
      <section class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalysisScoreCard
          v-for="score in analysis.result.scores"
          :key="score.title"
          :title="score.title"
          :score="score.score"
          :comment="score.comment"
        />
      </section>

      <!-- 종합 피드백 + Before/After -->
      <section class="mt-6 grid gap-4 lg:grid-cols-2">
        <AppCard>
          <h2 class="text-xl font-black text-foreground">종합 피드백</h2>
          <p class="mt-4 leading-7 text-muted-foreground">{{ analysis.result.summary }}</p>
        </AppCard>

        <div class="grid gap-4">
          <BeforeAfterBlock
            v-for="suggestion in analysis.result.suggestions"
            :key="suggestion.before"
            :before="suggestion.before"
            :after="suggestion.after"
          />
        </div>
      </section>
    </template>
  </div>
</template>
