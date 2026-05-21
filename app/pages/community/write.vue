<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, ChevronDown } from '@lucide/vue'
import type { AnalysisResult } from '~/server/utils/clova'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const analysisId = route.query.analysisId as string | undefined

const category = ref(analysisId ? '피드백' : '')
const title = ref('')
const body = ref('')

const MAX_BODY = 5000

const categoryOptions = [
  { label: '피드백', value: '피드백' },
  { label: '프로젝트 모집', value: '프로젝트 모집' },
  { label: '스터디 모집', value: '스터디 모집' },
]

const isFeedback = computed(() => category.value === '피드백')
const isFromAnalysis = computed(() => !!analysisId)
const canSubmit = computed(
  () => !!category.value && title.value.trim().length > 0 && body.value.trim().length > 0
)

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

function handleSubmit() {
  if (!canSubmit.value) return
  navigateTo('/community')
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

    <!-- ── 분석 결과 임베드 (읽기 전용) ── -->
    <template v-if="isFromAnalysis">
      <div v-if="analysisPending" class="mt-6 flex justify-center py-8">
        <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>

      <template v-else-if="analysisData?.result">
        <div class="mt-6 rounded-xl border border-primary/20 bg-accent/30 p-5">
          <div class="flex items-center gap-2 mb-4">
            <AppBadge variant="green">분석 완료</AppBadge>
            <span class="text-xs text-muted-foreground">AI 분석 결과 · 공유됨</span>
          </div>

          <!-- 종합 피드백 -->
          <AppCard>
            <h3 class="text-sm font-black text-foreground">종합 피드백</h3>
            <p class="mt-2 text-sm leading-7 text-muted-foreground">
              {{ analysisData.result.summary }}
            </p>
          </AppCard>

          <!-- 개선 포인트 -->
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

          <!-- 점수 접기/펼치기 -->
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
          <div v-if="showScores" class="mt-3 grid gap-3 md:grid-cols-2">
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

    <!-- ── 글쓰기 폼 ── -->
    <div class="mt-6 grid gap-5">
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

      <!-- 본문 -->
      <div>
        <label class="text-sm font-bold text-foreground">
          {{ isFeedback ? '추가로 하고 싶은 말' : '본문' }}
        </label>
        <AppTextarea
          v-model="body"
          :placeholder="
            isFeedback
              ? '특별히 봐줬으면 하는 부분이나 궁금한 점을 적어주세요.'
              : '내용을 입력해주세요.'
          "
          :rows="isFeedback ? 6 : 10"
          :maxlength="MAX_BODY"
          :show-count="true"
          class="mt-2"
        />
      </div>

      <!-- 이미지 업로드: 피드백 카테고리 제외 -->
      <div v-if="!isFeedback">
        <label class="text-sm font-bold text-foreground"
          >이미지 <span class="ml-1 font-normal text-muted-foreground">(선택)</span></label
        >
        <p class="mt-1 text-xs text-muted-foreground">
          이미지 업로드는 커뮤니티 CRUD 구현 시 추가될 예정이에요.
        </p>
      </div>

      <AppAlert> 게시글 본문의 URL은 자동으로 링크로 변환돼요. </AppAlert>

      <div class="flex justify-end gap-3">
        <NuxtLink :to="isFromAnalysis ? `/analysis/${analysisId}` : '/community'">
          <AppButton variant="outline">취소</AppButton>
        </NuxtLink>
        <AppButton :disabled="!canSubmit" @click="handleSubmit">게시하기</AppButton>
      </div>
    </div>
  </div>
</template>
