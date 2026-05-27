<script setup lang="ts">
import { Bookmark, BookmarkCheck, Share2, ArrowLeft, ExternalLink, Tag, Loader2, Sparkles, ChevronDown, ChevronUp } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { useToastStore } from '~/stores/toast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToastStore()

const BRAND_COLORS: Record<string, string> = {
  '네이버 D2': '#03C75A', '네이버 클라우드': '#03C75A',
  '카카오 기술 블로그': '#FFCD00', '카카오페이 기술 블로그': '#E8341C',
  '카카오엔터 기술 블로그': '#FFCD00', '라인 기술 블로그': '#00B900',
  '쿠팡 기술 블로그': '#FF6000', '우아한형제들 기술 블로그': '#2AC1BC',
  '당근 기술 블로그': '#FF6F0F', '토스 기술 블로그': '#0064FF',
  '직방 기술 블로그': '#FF6A00', '야놀자 기술 블로그': '#FF5F00',
  '쏘카 기술 블로그': '#00BAB3', 'NHN 기술 블로그': '#00B0F0',
  '무신사 기술 블로그': '#555555', '왓챠 기술 블로그': '#FF2F6E',
  '인프런 기술 블로그': '#00C471', '리디 기술 블로그': '#1E9EFF',
  '하이퍼커넥트 기술 블로그': '#E31D1C', '올리브영 기술 블로그': '#3DAA6D',
  'Hacker News': '#FF6600', 'dev.to': '#6366F1',
  'Smashing Magazine': '#E85A4F', 'CSS-Tricks': '#FF453A',
  'Engineering at Meta': '#0866FF', 'Google Developers': '#4285F4',
  'Netflix Tech Blog': '#E50914', 'Uber Engineering': '#9CA3AF',
  'Airbnb Engineering': '#FF5A5F', 'Shopify Engineering': '#96BF48',
  'GitHub Blog': '#6B7280', 'Stripe Blog': '#635BFF',
  'Cloudflare Blog': '#F48120', 'Vercel Blog': '#6B7280',
  'Discord Blog': '#5865F2', 'Figma Blog': '#F24E1E',
  'Notion Blog': '#6B7280', 'Slack Engineering': '#E01E5A',
  'Spotify Engineering': '#1DB954',
}
function getBrandColor(feedName: string) { return BRAND_COLORS[feedName] ?? '#6B7280' }
function shortName(feedName: string) {
  return feedName.replace(' 기술 블로그', '').replace(' Tech Blog', '')
    .replace(' Engineering', '').replace(' Developers', '').replace(' Blog', '')
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return m <= 1 ? '방금 전' : `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  if (d < 30) return `${Math.floor(d / 7)}주 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const DIFFICULTY_STYLE: Record<string, { label: string; class: string }> = {
  '입문': { label: '입문', class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  '초급': { label: '초급', class: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  '중급': { label: '중급', class: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  '고급': { label: '고급', class: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300' },
}

interface ArticleDetail {
  id: string; feedName: string; category: 'domestic' | 'international'
  title: string; url: string; summary: string | null
  tags: string[]; publishedAt: string; collectedAt: string
  bookmarkCount: number; isBookmarked: boolean
  aiSummary: string | null; aiKeyPoints: string[] | null
  aiConcepts: Array<{ name: string; desc: string }> | null; aiDifficulty: string | null
  related: Array<{ id: string; title: string; publishedAt: string; feedName: string }>
}

const { data: res, status } = await useFetch<{ data: ArticleDetail }>(`/api/articles/${route.params.id}`)
const article = computed(() => res.value?.data ?? null)

useSeoMeta({
  title: computed(() => article.value ? `${article.value.title} · 폴짝` : '아티클 · 폴짝'),
  description: computed(() => article.value?.aiSummary ?? article.value?.summary ?? '폴짝에서 기술 아티클을 확인하세요.'),
  ogTitle: computed(() => article.value?.title ?? '아티클'),
  ogDescription: computed(() => article.value?.aiSummary ?? article.value?.summary ?? ''),
  ogUrl: computed(() => `https://poljjak.kr/articles/${route.params.id}`),
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/articles')
}
function goToTag(tag: string) { router.push(`/articles?tag=${encodeURIComponent(tag)}`) }

// ── AI 요약 ──────────────────────────────────────
const aiPending = ref(false)
const aiResult = ref<{
  aiSummary: string; aiKeyPoints: string[]; aiConcepts: Array<{ name: string; desc: string }>; aiDifficulty: string
} | null>(null)
const showFullSummary = ref(false)

const displaySummary = computed(() => aiResult.value?.aiSummary ?? article.value?.aiSummary ?? article.value?.summary)
const hasAiData = computed(() => !!(aiResult.value ?? (article.value?.aiSummary)))
const keyPoints = computed(() => aiResult.value?.aiKeyPoints ?? article.value?.aiKeyPoints ?? [])
const concepts = computed(() => aiResult.value?.aiConcepts ?? article.value?.aiConcepts ?? [])
const difficulty = computed(() => aiResult.value?.aiDifficulty ?? article.value?.aiDifficulty ?? '')

async function generateSummary() {
  if (!article.value || aiPending.value) return
  aiPending.value = true
  try {
    const res = await $fetch<{
      data: { aiSummary: string; aiKeyPoints: string[]; aiConcepts: Array<{ name: string; desc: string }>; aiDifficulty: string }
    }>(`/api/articles/${article.value.id}/summarize`, { method: 'POST' })
    aiResult.value = res.data
  } catch {
    toast.error('AI 요약 생성에 실패했어요')
  } finally {
    aiPending.value = false
  }
}

// 국내 아티클이고 AI 요약이 없으면 자동 생성
onMounted(() => {
  if (article.value?.category === 'domestic' && !article.value.aiSummary) {
    generateSummary()
  }
})

// ── 북마크 / 공유 ──────────────────────────────────
const showLoginModal = ref(false)
const bookmarkPending = ref(false)

async function toggleBookmark() {
  if (!article.value) return
  if (!authStore.isLoggedIn) { showLoginModal.value = true; return }
  if (bookmarkPending.value) return
  bookmarkPending.value = true
  const prev = article.value.isBookmarked
  article.value.isBookmarked = !prev
  try {
    const res = await $fetch<{ data: { isBookmarked: boolean } }>(`/api/articles/${article.value.id}/bookmarks`, { method: 'POST' })
    article.value.isBookmarked = res.data.isBookmarked
  } catch {
    article.value.isBookmarked = prev
    toast.error('북마크 처리에 실패했어요')
  } finally {
    bookmarkPending.value = false
  }
}
async function share() {
  try { await navigator.clipboard.writeText(window.location.href); toast.success('링크가 복사됐어요') }
  catch { toast.error('복사에 실패했어요') }
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
    <button type="button" class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground" @click="goBack">
      <ArrowLeft class="size-4" />목록으로
    </button>

    <!-- 로딩 스켈레톤 -->
    <div v-if="status === 'pending'" class="space-y-4">
      <div class="h-4 w-24 animate-pulse rounded-full bg-muted" />
      <div class="h-8 w-3/4 animate-pulse rounded-lg bg-muted" />
      <div class="h-48 animate-pulse rounded-2xl bg-muted" />
    </div>

    <!-- 404 -->
    <div v-else-if="!article" class="py-32 text-center">
      <p class="text-lg font-semibold text-foreground">아티클을 찾을 수 없어요</p>
      <p class="mt-1 text-sm text-muted-foreground">삭제됐거나 잘못된 주소예요</p>
      <NuxtLink to="/articles" class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft class="size-4" />아티클 목록으로
      </NuxtLink>
    </div>

    <div v-else class="flex gap-10">
      <article class="min-w-0 flex-1">
        <!-- 메타 -->
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium leading-none text-muted-foreground">
            <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: getBrandColor(article.feedName) }" />
            {{ shortName(article.feedName) }}
          </span>
          <span v-if="difficulty && DIFFICULTY_STYLE[difficulty]"
            class="rounded-full px-2.5 py-1 text-xs font-semibold leading-none"
            :class="DIFFICULTY_STYLE[difficulty]?.class"
          >{{ difficulty }}</span>
          <span class="text-xs text-muted-foreground">{{ timeAgo(article.publishedAt) }}</span>
        </div>

        <!-- 제목 -->
        <h1 class="text-2xl font-black leading-snug text-foreground md:text-3xl">{{ article.title }}</h1>

        <!-- 원문 도메인 링크 -->
        <a :href="article.url" target="_blank" rel="noopener noreferrer"
          class="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
          <ExternalLink class="size-3.5" />
          {{ new URL(article.url).hostname.replace('www.', '') }}
        </a>

        <hr class="my-6 border-border" />

        <!-- 태그 -->
        <div v-if="article.tags.length > 0" class="mb-5 flex flex-wrap gap-1.5">
          <button v-for="tag in article.tags" :key="tag" type="button"
            class="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            @click="goToTag(tag)">
            <Tag class="size-3" />{{ tag }}
          </button>
        </div>

        <!-- AI 요약 + 도식화 -->
        <div v-if="hasAiData" class="space-y-4">
          <!-- 요약 -->
          <div class="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-violet-500/5 p-5">
            <div class="mb-3 flex items-center gap-2">
              <Sparkles class="size-4 text-primary" />
              <p class="text-xs font-semibold uppercase tracking-wider text-primary">AI 요약</p>
            </div>
            <p class="text-sm leading-7 text-foreground">{{ displaySummary }}</p>
          </div>

          <!-- 핵심 포인트 -->
          <div v-if="keyPoints.length > 0" class="rounded-2xl border border-border bg-card p-5">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">핵심 포인트</p>
            <ul class="space-y-2">
              <li v-for="(point, i) in keyPoints" :key="i" class="flex items-start gap-3">
                <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{{ i + 1 }}</span>
                <p class="text-sm leading-6 text-foreground">{{ point }}</p>
              </li>
            </ul>
          </div>

          <!-- 개념 도식화 -->
          <div v-if="concepts.length > 0" class="rounded-2xl border border-border bg-card p-5">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">핵심 개념</p>
            <div class="grid gap-2 sm:grid-cols-2">
              <div v-for="concept in concepts" :key="concept.name"
                class="rounded-xl border border-border bg-muted/40 px-4 py-3">
                <p class="text-sm font-bold text-foreground">{{ concept.name }}</p>
                <p class="mt-0.5 text-xs leading-5 text-muted-foreground">{{ concept.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- RSS 요약 (AI 요약 없을 때) -->
        <div v-else-if="article.summary" class="rounded-2xl border border-border bg-muted/40 p-5">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">요약</p>
          <p class="text-sm leading-7 text-foreground">{{ article.summary }}</p>
        </div>

        <!-- 요약 없음 + AI 생성 버튼 -->
        <div v-else class="rounded-2xl border border-dashed border-border p-8 text-center">
          <Sparkles class="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p class="text-sm font-semibold text-foreground">요약 정보가 없어요</p>
          <p class="mt-1 text-xs text-muted-foreground">AI가 원문을 읽고 요약과 핵심 개념을 정리해드려요</p>
          <button type="button"
            class="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            :disabled="aiPending" @click="generateSummary">
            <Loader2 v-if="aiPending" class="size-4 animate-spin" />
            <Sparkles v-else class="size-4" />
            {{ aiPending ? 'AI가 읽는 중...' : 'AI 요약 생성' }}
          </button>
        </div>

        <!-- AI 재생성 버튼 (요약 있을 때 하단에 작게) -->
        <div v-if="(article.summary || hasAiData) && !aiPending" class="mt-3 flex justify-end">
          <button v-if="!hasAiData" type="button"
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click="generateSummary">
            <Sparkles class="size-3" />AI 요약 생성
          </button>
        </div>

        <!-- 액션 버튼 -->
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <a :href="article.url" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-80">
            원문 읽기<ExternalLink class="size-4" />
          </a>
          <button type="button"
            class="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted active:bg-muted"
            :class="article.isBookmarked ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border text-muted-foreground'"
            @click="toggleBookmark">
            <BookmarkCheck v-if="article.isBookmarked" class="size-4" />
            <Bookmark v-else class="size-4" />
            {{ article.isBookmarked ? '저장됨' : '저장' }}
          </button>
          <button type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
            @click="share">
            <Share2 class="size-4" />공유
          </button>
        </div>

        <!-- 모바일 관련 글 -->
        <div v-if="article.related.length > 0" class="mt-10 xl:hidden">
          <p class="mb-3 text-sm font-bold text-foreground">{{ shortName(article.feedName) }}의 다른 글</p>
          <ul class="grid gap-2 sm:grid-cols-2">
            <li v-for="r in article.related" :key="r.id">
              <NuxtLink :to="`/articles/${r.id}`"
                class="block rounded-xl border border-border bg-card p-3 text-sm transition-all hover:border-primary/30 hover:shadow-sm active:bg-muted">
                <p class="line-clamp-2 font-medium leading-snug text-foreground">{{ r.title }}</p>
                <p class="mt-1.5 text-xs text-muted-foreground">{{ timeAgo(r.publishedAt) }}</p>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </article>

      <!-- 데스크탑 사이드 관련 글 -->
      <aside v-if="article.related.length > 0" class="hidden w-64 shrink-0 xl:block">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{{ shortName(article.feedName) }}의 다른 글</p>
        <ul class="space-y-2">
          <li v-for="r in article.related" :key="r.id">
            <NuxtLink :to="`/articles/${r.id}`"
              class="block rounded-xl border border-border bg-card p-3 text-sm transition-all hover:border-primary/30 hover:shadow-sm">
              <p class="line-clamp-2 font-medium leading-snug text-foreground">{{ r.title }}</p>
              <p class="mt-1.5 text-xs text-muted-foreground">{{ timeAgo(r.publishedAt) }}</p>
            </NuxtLink>
          </li>
        </ul>
      </aside>
    </div>
  </div>

  <LoginModal :open="showLoginModal" context="아티클 북마크" @close="showLoginModal = false" />
</template>
