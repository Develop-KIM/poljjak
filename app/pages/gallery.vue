<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Loader2 } from '@lucide/vue'

useSeoMeta({
  title: '갤러리',
  description: '다른 개발자들의 AI 포트폴리오 분석 결과를 둘러보세요.',
  ogTitle: '포트폴리오 갤러리 · 폴짝',
  ogDescription: '실제 AI 포트폴리오 분석 결과를 직군·연차별로 탐색해보세요.',
  ogUrl: 'https://poljjak.kr/gallery',
})

interface GalleryItem {
  id: string
  shareToken: string
  jobRole: string | null
  seniority: string | null
  pdfUrl: string | null
  issueCount: number
  summary: string | null
  createdAt: string
}

const JOB_ROLES = [
  { value: 'frontend', label: '프론트엔드' },
  { value: 'backend', label: '백엔드' },
  { value: 'fullstack', label: '풀스택' },
  { value: 'devops', label: 'DevOps' },
  { value: 'ml', label: 'ML/AI' },
] as const

const SENIORITIES = [
  { value: 'junior', label: '신입' },
  { value: 'mid', label: '주니어' },
  { value: 'senior', label: '시니어' },
] as const

const selectedJobRole = ref<string | null>(null)
const selectedSeniority = ref<string | null>(null)

const items = ref<GalleryItem[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(false)
const initialLoading = ref(true)
const error = ref<string | null>(null)

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

async function fetchItems(reset = false) {
  if (loading.value) return
  loading.value = true
  error.value = null

  try {
    const params: Record<string, string> = {}
    if (!reset && nextCursor.value) params.cursor = nextCursor.value
    if (selectedJobRole.value) params.jobRole = selectedJobRole.value
    if (selectedSeniority.value) params.seniority = selectedSeniority.value

    const res = await $fetch<{ data: GalleryItem[]; nextCursor: string | null }>('/api/gallery', {
      query: params,
    })

    if (reset) {
      items.value = res.data
    } else {
      items.value.push(...res.data)
    }
    nextCursor.value = res.nextCursor
  } catch {
    error.value = '갤러리를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
    initialLoading.value = false
  }
}

function resetAndFetch() {
  nextCursor.value = null
  items.value = []
  initialLoading.value = true
  void fetchItems(true)
}

watch([selectedJobRole, selectedSeniority], resetAndFetch)

onMounted(async () => {
  await fetchItems(true)

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && nextCursor.value && !loading.value) {
        void fetchItems()
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 py-10 md:px-8 md:py-14">
    <!-- 헤더 -->
    <div class="max-w-2xl">
      <AppBadge variant="blue">갤러리</AppBadge>
      <h1 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
        포트폴리오 갤러리
      </h1>
      <p class="mt-4 text-base leading-7 text-muted-foreground">
        다른 개발자들의 AI 포트폴리오 분석 결과를 둘러보세요.
      </p>
    </div>

    <!-- 필터 -->
    <div class="mt-8 flex flex-wrap gap-4">
      <!-- 직군 -->
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
          :class="
            !selectedJobRole
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-muted text-muted-foreground hover:border-primary/40'
          "
          @click="selectedJobRole = null"
        >
          전체 직군
        </button>
        <button
          v-for="role in JOB_ROLES"
          :key="role.value"
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
          :class="
            selectedJobRole === role.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-muted text-muted-foreground hover:border-primary/40'
          "
          @click="selectedJobRole = selectedJobRole === role.value ? null : role.value"
        >
          {{ role.label }}
        </button>
      </div>

      <div class="h-6 w-px bg-border" />

      <!-- 연차 -->
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
          :class="
            !selectedSeniority
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-muted text-muted-foreground hover:border-primary/40'
          "
          @click="selectedSeniority = null"
        >
          전체 연차
        </button>
        <button
          v-for="s in SENIORITIES"
          :key="s.value"
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
          :class="
            selectedSeniority === s.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-muted text-muted-foreground hover:border-primary/40'
          "
          @click="selectedSeniority = selectedSeniority === s.value ? null : s.value"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <!-- 초기 로딩 -->
    <div v-if="initialLoading" class="mt-12 flex justify-center">
      <Loader2 class="size-8 animate-spin text-muted-foreground" />
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="mt-12 text-center text-sm text-destructive">
      {{ error }}
    </div>

    <!-- 빈 결과 -->
    <div
      v-else-if="items.length === 0"
      class="mt-12 flex flex-col items-center justify-center gap-3 text-center"
    >
      <p class="text-2xl">🗂️</p>
      <p class="text-sm text-muted-foreground">
        {{
          selectedJobRole || selectedSeniority
            ? '해당 조건의 공개 분석이 없어요.'
            : '아직 공개된 분석이 없어요.'
        }}
      </p>
    </div>

    <!-- 카드 그리드 -->
    <div v-else class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <GalleryCard v-for="item in items" :key="item.id" :item="item" />
    </div>

    <!-- 추가 로딩 -->
    <div v-if="loading && !initialLoading" class="mt-8 flex justify-center">
      <Loader2 class="size-6 animate-spin text-muted-foreground" />
    </div>

    <!-- 무한 스크롤 sentinel -->
    <div ref="sentinel" class="h-1" />
  </div>
</template>
