<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Link, Lock, Unlock, MessageSquare, ChevronDown, Check } from '@lucide/vue'
import type { AnalysisResult } from '~~/server/utils/clova'

const route = useRoute()
const id = route.params.id as string
const toast = useToastStore()

interface Analysis {
  id: string
  title: string
  status: string
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
  // 커뮤니티 글쓰기 페이지로 이동 (analysisId 전달)
  navigateTo(`/community/write?analysisId=${id}`)
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
            {{ createdAtLabel }} · {{ analysis.isPublic ? '공개' : '비공개' }}
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
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

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
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
        </Transition>
      </section>
    </template>
  </div>
</template>
