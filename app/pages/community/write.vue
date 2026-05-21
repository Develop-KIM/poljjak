<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, ChevronDown } from '@lucide/vue'
import type { AnalysisResult } from '~~/server/utils/clova'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const toast = useToastStore()
const analysisId = Array.isArray(route.query.analysisId)
  ? route.query.analysisId[0]
  : route.query.analysisId

const category = ref(analysisId ? '피드백' : '')
const title = ref('')
const body = ref('')
const submitting = ref(false)

const MAX_BODY = 5000

const categoryOptions = [
  { label: '피드백', value: '피드백' },
  { label: '프로젝트 모집', value: '프로젝트 모집' },
  { label: '스터디 모집', value: '스터디 모집' },
]

const isFromAnalysis = computed(() => !!analysisId)
const canSubmit = computed(() => {
  if (!category.value || title.value.trim().length === 0) return false
  return isFromAnalysis.value || body.value.trim().length > 0
})

// 분석 결과 미리보기
interface AnalysisData {
  id: string
  title: string
  result: AnalysisResult
}
const analysisData = ref<AnalysisData | null>(null)
const analysisPending = ref(false)
const showScores = ref(false)

onMounted(async () => {
  if (!analysisId) return
  analysisPending.value = true
  try {
    const res = await $fetch<{ data: AnalysisData }>(`/api/analyses/${analysisId}`)
    analysisData.value = res.data
  } catch {
    // 분석 없이 빈 폼으로
  } finally {
    analysisPending.value = false
  }
})

async function handleSubmit() {
  if (!canSubmit.value || submitting.value) return

  submitting.value = true
  try {
    const res = await $fetch<{ data: { id: string } }>('/api/posts', {
      method: 'POST',
      body: {
        category: category.value,
        title: title.value.trim(),
        body: body.value.trim(),
        analysisId: analysisId ?? null,
      },
    })

    toast.success('게시글이 등록됐어요')
    await navigateTo(`/community/${res.data.id}`)
  } catch (e: unknown) {
    const error = e as { data?: { statusMessage?: string } }
    toast.error(error.data?.statusMessage ?? '게시글 등록에 실패했어요')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-10">
    <NuxtLink
      :to="isFromAnalysis ? `/analysis/${analysisId}` : '/community'"
      class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="size-4" />
      {{ isFromAnalysis ? '분석 결과로 돌아가기' : '커뮤니티' }}
    </NuxtLink>

    <h1 class="text-2xl font-black text-foreground">
      {{ isFromAnalysis ? '피드백 요청 글 작성' : '글 작성' }}
    </h1>

    <!-- ── 2열 레이아웃 ── -->
    <div class="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
      <!-- 좌측: 분석 결과 (분석에서 진입 시) / 일반 글쓰기 폼 (아닐 때) -->
      <div>
        <template v-if="isFromAnalysis">
          <div v-if="analysisPending" class="flex justify-center py-8">
            <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>

          <template v-else-if="analysisData?.result">
            <div class="rounded-xl border border-primary/20 bg-accent/30 p-5">
              <div class="flex items-center gap-2 mb-4">
                <AppBadge variant="green">분석 완료</AppBadge>
                <span class="text-xs text-muted-foreground">AI 분석 결과</span>
              </div>

              <AppCard>
                <h3 class="text-sm font-black text-foreground">종합 피드백</h3>
                <p class="mt-2 text-sm leading-7 text-muted-foreground">
                  {{ analysisData.result.summary }}
                </p>
              </AppCard>

              <div class="mt-4 grid gap-3">
                <BeforeAfterBlock
                  v-for="(s, i) in analysisData.result.suggestions"
                  :key="i"
                  :category="s.category"
                  :context="s.context"
                  :before="s.before"
                  :after="s.after"
                />
              </div>

              <button
                type="button"
                class="mt-4 flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-slate-50"
                @click="showScores = !showScores"
              >
                항목별 점수 보기
                <ChevronDown
                  class="size-4 text-muted-foreground transition-transform"
                  :class="{ 'rotate-180': showScores }"
                />
              </button>
              <div v-if="showScores" class="mt-3 grid auto-rows-fr gap-3 md:grid-cols-2">
                <AnalysisScoreCard
                  v-for="score in analysisData.result.scores"
                  :key="score.title"
                  :title="score.title"
                  :score="score.score"
                  :comment="score.comment"
                  :improvement="score.improvement"
                />
              </div>
            </div>
          </template>
        </template>

        <!-- 일반 글쓰기일 때 본문 좌측 배치 -->
        <template v-else>
          <div>
            <label class="text-sm font-bold text-foreground">본문</label>
            <AppTextarea
              v-model="body"
              placeholder="내용을 입력해주세요."
              :rows="14"
              :maxlength="MAX_BODY"
              :show-count="true"
              class="mt-2"
            />
          </div>
        </template>
      </div>

      <!-- 우측: 글쓰기 폼 -->
      <div class="grid gap-5">
        <!-- 카테고리 -->
        <div>
          <label class="text-sm font-bold text-foreground">카테고리</label>
          <div
            v-if="isFromAnalysis"
            class="mt-2 flex h-10 items-center rounded-lg border border-border bg-muted px-3 text-sm font-semibold text-foreground"
          >
            피드백
          </div>
          <AppSelect
            v-else
            v-model="category"
            :options="categoryOptions"
            placeholder="카테고리를 선택해주세요"
            class="mt-2"
          />
        </div>

        <!-- 제목 -->
        <div>
          <label class="text-sm font-bold text-foreground">제목</label>
          <AppInput v-model="title" placeholder="제목을 입력해주세요" class="mt-2" />
        </div>

        <!-- 추가로 하고 싶은 말 (피드백만) -->
        <div v-if="isFromAnalysis">
          <label class="text-sm font-bold text-foreground">
            추가로 하고 싶은 말
            <span class="ml-1 font-normal text-muted-foreground">(선택)</span>
          </label>
          <AppTextarea
            v-model="body"
            placeholder="특별히 봐줬으면 하는 부분이나 궁금한 점을 적어주세요."
            :rows="6"
            :maxlength="MAX_BODY"
            :show-count="true"
            class="mt-2"
          />
        </div>

        <AppAlert>URL은 자동으로 링크로 변환돼요.</AppAlert>

        <div class="flex gap-3">
          <NuxtLink :to="isFromAnalysis ? `/analysis/${analysisId}` : '/community'" class="flex-1">
            <AppButton variant="outline" class="w-full">취소</AppButton>
          </NuxtLink>
          <AppButton
            class="flex-1"
            :disabled="!canSubmit"
            :loading="submitting"
            @click="handleSubmit"
          >
            게시하기
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
