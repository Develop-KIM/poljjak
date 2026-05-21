<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, X, Plus, Sparkles } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import type { AnalysisResult } from '~/server/utils/clova'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const route = useRoute()

// 분석 결과에서 넘어온 경우
const analysisId = route.query.analysisId as string | undefined

const category = ref(analysisId ? '피드백' : '')
const title = ref('')
const body = ref('')
const imageFiles = ref<Array<{ file: File; preview: string }>>([])
const MAX_BODY = 5000
const MAX_IMAGES = 10
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const categoryOptions = [
  { label: '피드백', value: '피드백' },
  { label: '프로젝트 모집', value: '프로젝트 모집' },
  { label: '스터디 모집', value: '스터디 모집' },
]

const isFeedback = computed(() => category.value === '피드백')
const isFromAnalysis = computed(() => !!analysisId)
const canSubmit = computed(
  () =>
    authStore.isLoggedIn &&
    !!category.value &&
    title.value.trim().length > 0 &&
    body.value.trim().length > 0
)

// 분석 결과 자동 생성
interface AnalysisPreview {
  id: string
  title: string
  result: AnalysisResult
}

const analysisPreview = ref<AnalysisPreview | null>(null)
const autoFilling = ref(false)

function generateFromAnalysis(a: AnalysisPreview) {
  const result = a.result
  const overallScore = Math.round(
    result.scores.reduce((sum, s) => sum + s.score, 0) / result.scores.length
  )

  // 점수 낮은 항목 2개 추출
  const weakAreas = [...result.scores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((s) => s.title)

  title.value = `포트폴리오 피드백 부탁드려요 (AI 종합 ${overallScore}/10)`

  body.value = `AI로 포트폴리오를 분석해봤는데, 실무자분들의 추가 피드백도 받고 싶어요.

[AI 종합 피드백]
${result.summary}

[AI가 제안한 개선 포인트]
${result.suggestions
  .slice(0, 3)
  .map((s, i) => `${i + 1}. [${s.category}] ${s.before}\n   → ${s.after}`)
  .join('\n\n')}

특히 **${weakAreas.join('**, **')}** 부분에서 아쉬운 점이 많았어요.
실무자분들이나 취업하신 분들의 시각에서 추가로 봐주시면 감사하겠습니다!`
}

onMounted(async () => {
  if (!analysisId) return
  autoFilling.value = true
  try {
    const res = await $fetch<{ data: AnalysisPreview }>(`/api/analyses/${analysisId}`)
    analysisPreview.value = res.data
    generateFromAnalysis(res.data)
  } catch {
    // 분석 결과 로드 실패 시 빈 양식으로
  } finally {
    autoFilling.value = false
  }
})

function addImages(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  for (const file of files) {
    if (imageFiles.value.length >= MAX_IMAGES) break
    if (file.size > MAX_IMAGE_SIZE) continue
    imageFiles.value.push({ file, preview: URL.createObjectURL(file) })
  }
  input.value = ''
}

function removeImage(index: number) {
  const item = imageFiles.value[index]
  if (item) URL.revokeObjectURL(item.preview)
  imageFiles.value.splice(index, 1)
}

function handleSubmit() {
  if (!canSubmit.value) return
  // API 연동은 커뮤니티 CRUD 구현 시
  navigateTo('/community')
}
</script>

<template>
  <div class="mx-auto max-w-[800px] px-5 py-8 md:px-8 md:py-10">
    <NuxtLink
      :to="isFromAnalysis ? `/analysis/${analysisId}` : '/community'"
      class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="size-4" />
      {{ isFromAnalysis ? '분석 결과로 돌아가기' : '커뮤니티' }}
    </NuxtLink>

    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-black text-foreground">
        {{ isFromAnalysis ? '피드백 요청 글 작성' : '글 작성' }}
      </h1>
      <div v-if="autoFilling" class="flex items-center gap-1.5 text-sm text-primary">
        <Sparkles class="size-4 animate-pulse" />
        AI가 내용을 채우는 중...
      </div>
    </div>

    <!-- 분석 결과 연결 배너 -->
    <div
      v-if="isFromAnalysis && analysisPreview"
      class="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-accent/50 px-4 py-3"
    >
      <Sparkles class="size-4 shrink-0 text-primary" />
      <p class="text-sm text-foreground">
        <span class="font-semibold">AI 분석 결과</span>를 바탕으로 제목과 본문을 자동으로 채웠어요.
        수정 후 게시하세요.
      </p>
    </div>

    <div class="mt-6 grid gap-5">
      <!-- 카테고리 -->
      <div>
        <label class="text-sm font-bold text-foreground">카테고리</label>
        <div v-if="isFromAnalysis" class="mt-2">
          <div
            class="flex h-10 items-center rounded-lg border border-border bg-muted px-3 text-sm font-semibold text-foreground"
          >
            피드백
          </div>
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
        <label class="text-sm font-bold text-foreground">본문</label>
        <AppTextarea
          v-model="body"
          placeholder="내용을 입력해주세요."
          :rows="isFeedback ? 14 : 10"
          :maxlength="MAX_BODY"
          :show-count="true"
          class="mt-2 font-mono text-sm"
        />
      </div>

      <!-- 이미지 업로드 -->
      <div>
        <label class="text-sm font-bold text-foreground">
          이미지
          <span class="ml-1 font-normal text-muted-foreground">
            (선택 · {{ imageFiles.length }}/{{ MAX_IMAGES }}장 · 장당 5MB 이하)
          </span>
        </label>
        <div class="mt-2 flex flex-wrap gap-2">
          <div
            v-for="(img, i) in imageFiles"
            :key="i"
            class="relative size-20 overflow-hidden rounded-lg bg-muted"
          >
            <img :src="img.preview" :alt="`이미지 ${i + 1}`" class="h-full w-full object-cover" />
            <button
              type="button"
              class="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              @click="removeImage(i)"
            >
              <X class="size-3" />
            </button>
          </div>

          <label
            v-if="imageFiles.length < MAX_IMAGES"
            class="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:bg-accent"
          >
            <Plus class="size-5" />
            <span class="text-xs">추가</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              class="sr-only"
              @change="addImages"
            />
          </label>
        </div>
      </div>

      <AppAlert>
        게시글 본문의 URL은 자동으로 링크로 변환돼요. 이미지는 본문 하단에 갤러리로 표시됩니다.
      </AppAlert>

      <div class="flex justify-end gap-3">
        <NuxtLink :to="isFromAnalysis ? `/analysis/${analysisId}` : '/community'">
          <AppButton variant="outline">취소</AppButton>
        </NuxtLink>
        <AppButton :disabled="!canSubmit" @click="handleSubmit">게시하기</AppButton>
      </div>
    </div>
  </div>
</template>
