<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Bell, BellOff, Bookmark, BookmarkCheck, Loader2, Search, Sparkles, X, Share2 } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { useToastStore } from '~/stores/toast'

useSeoMeta({
  title: '아티클',
  description: '국내외 기술 블로그와 IT 아티클을 한 곳에서 읽어보세요.',
  ogTitle: '아티클 · 폴짝',
  ogDescription: '국내외 기술 블로그와 IT 아티클을 한 곳에서 읽어보세요.',
  ogUrl: 'https://poljjak.kr/articles',
})

interface Article {
  id: string; feedName: string; category: 'domestic' | 'international'
  title: string; url: string; summary: string | null; tags: string[]
  publishedAt: string; isBookmarked: boolean; bookmarkCount: number
}

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

const authStore = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()

type ArticleTab = 'domestic' | 'international'
type Period = 'all' | 'today' | 'week' | 'month'
type Sort = 'latest' | 'trending'

const TAGS = ['Frontend', 'Backend', 'DevOps', 'AI/ML', 'Database', 'Architecture', 'Mobile', 'Security', 'Performance', 'Data']
const READ_KEY = 'poljjak_read_articles'
const RECENT_KEY = 'poljjak_recent_articles'
const MAX_RECENT = 20

const activeTab = ref<ArticleTab>(route.query.category === 'international' ? 'international' : 'domestic')
const selectedFeed = ref<string | null>(null)
const selectedTag = ref<string | null>(null)
const selectedPeriod = ref<Period>('all')
const selectedSort = ref<Sort>('latest')
const searchInput = ref('')
const searchQuery = ref('')
const feedNames = ref<{ domestic: string[]; international: string[] }>({ domestic: [], international: [] })
const feedsLoading = ref(true)
const articles = ref<Article[]>([])
const pending = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const totalCount = ref(0)
const hasMore = ref(false)
const showLoginModal = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)
const PAGE_SIZE = 21

// ── 읽음 처리 ──────────────────────────────────────
const readIds = ref<Set<string>>(new Set())
function loadReadIds() {
  if (!import.meta.client) return
  try { readIds.value = new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]')) } catch { /* ignore */ }
}
function markAsRead(article: Article) {
  if (!import.meta.client) return
  readIds.value = new Set([...readIds.value, article.id])
  // 최근 본 아티클 저장
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as Array<{
      id: string; title: string; url: string; feedName: string; publishedAt: string; visitedAt: string
    }>
    const filtered = raw.filter((r) => r.id !== article.id)
    filtered.unshift({
      id: article.id, title: article.title, url: article.url,
      feedName: article.feedName, publishedAt: article.publishedAt,
      visitedAt: new Date().toISOString(), tags: article.tags ?? [],
    })
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)))
    localStorage.setItem(READ_KEY, JSON.stringify([...readIds.value]))
  } catch { /* ignore */ }
}

const tabs: Array<{ label: string; value: ArticleTab }> = [
  { label: '국내 블로그', value: 'domestic' },
  { label: '해외 뉴스', value: 'international' },
]
const periods: Array<{ label: string; value: Period }> = [
  { label: '전체', value: 'all' }, { label: '오늘', value: 'today' },
  { label: '이번 주', value: 'week' }, { label: '이번 달', value: 'month' },
]
const currentFeedNames = computed(() =>
  activeTab.value === 'domestic' ? feedNames.value.domestic : feedNames.value.international,
)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

const selectedFeedValue = computed({
  get: () => selectedFeed.value ?? '',
  set: (v: string) => { selectedFeed.value = v || null; currentPage.value = 1 },
})

// 활성 필터 태그
const activeFilters = computed(() => {
  const filters: Array<{ label: string; clear: () => void }> = []
  if (selectedFeed.value) filters.push({ label: shortName(selectedFeed.value), clear: () => selectFeed(null) })
  if (selectedTag.value) filters.push({ label: selectedTag.value, clear: () => selectTag(null) })
  if (selectedPeriod.value !== 'all') {
    const p = periods.find((p) => p.value === selectedPeriod.value)
    if (p) filters.push({ label: p.label, clear: () => selectPeriod('all') })
  }
  if (selectedSort.value !== 'latest') filters.push({ label: '트렌딩', clear: () => selectSort('latest') })
  if (searchQuery.value) filters.push({ label: `"${searchQuery.value}"`, clear: () => clearSearch() })
  return filters
})

// 빈 상태 메시지
const emptyTitle = computed(() => {
  if (searchQuery.value) return `"${searchQuery.value}"에 대한 결과가 없어요`
  if (activeFilters.value.length > 0) return '선택한 조건에 맞는 아티클이 없어요'
  return '아직 수집된 아티클이 없어요'
})
const emptyDesc = computed(() => {
  if (searchQuery.value || activeFilters.value.length > 0) return '다른 검색어나 필터를 시도해보세요'
  return '곧 최신 기술 블로그 글이 올라올 예정이에요'
})

async function fetchFeeds() {
  feedsLoading.value = true
  try {
    const res = await $fetch<{ data: { domestic: string[]; international: string[] } }>('/api/articles/feeds')
    feedNames.value = res.data
  } catch { /* ignore */ }
  finally { feedsLoading.value = false }
}

async function fetchArticles(append = false) {
  if (append) loadingMore.value = true
  else pending.value = true
  try {
    const res = await $fetch<{ data: Article[]; total: number }>('/api/articles', {
      query: {
        category: activeTab.value, page: currentPage.value, limit: PAGE_SIZE,
        sort: selectedSort.value,
        ...(selectedFeed.value ? { feedName: selectedFeed.value } : {}),
        ...(selectedTag.value ? { tag: selectedTag.value } : {}),
        ...(searchQuery.value ? { q: searchQuery.value } : {}),
        ...(selectedPeriod.value !== 'all' ? { period: selectedPeriod.value } : {}),
      },
    })
    articles.value = append ? [...articles.value, ...res.data] : res.data
    totalCount.value = res.total
    hasMore.value = articles.value.length < res.total
  } catch {
    toast.error('아티클을 불러오지 못했어요')
  } finally {
    pending.value = false
    loadingMore.value = false
  }
}

function resetAndFetch() {
  currentPage.value = 1
  articles.value = []
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  fetchArticles()
}

function selectTab(tab: ArticleTab) { activeTab.value = tab; selectedFeed.value = null; resetAndFetch(); router.replace({ query: { category: tab } }) }
function selectFeed(name: string | null) { selectedFeed.value = name; resetAndFetch() }
function selectTag(tag: string | null) { selectedTag.value = tag; resetAndFetch() }
function selectSort(s: Sort) { selectedSort.value = s; resetAndFetch() }
function selectPeriod(p: Period) { selectedPeriod.value = p; resetAndFetch() }
function submitSearch() { searchQuery.value = searchInput.value.trim(); resetAndFetch() }
function clearSearch() { searchInput.value = ''; searchQuery.value = ''; resetAndFetch() }

function goPage(page: number) { currentPage.value = page; fetchArticles(); window.scrollTo({ top: 0, behavior: 'smooth' }) }

// 공유
async function shareArticle(article: Article) {
  try {
    await navigator.clipboard.writeText(article.url)
    toast.success('링크가 복사됐어요')
  } catch {
    toast.error('복사에 실패했어요')
  }
}

// 무한 스크롤
let observer: IntersectionObserver | null = null
function setupInfiniteScroll() {
  observer?.disconnect()
  if (!import.meta.client) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value && !loadingMore.value && !pending.value && window.innerWidth < 1024) {
        currentPage.value++
        fetchArticles(true)
      }
    },
    { rootMargin: '200px' },
  )
  if (sentinelRef.value) observer.observe(sentinelRef.value)
}
watch(sentinelRef, () => { if (sentinelRef.value) setupInfiniteScroll() })

// ── 구독 관리 ──────────────────────────────────────
const subscribedFeeds = ref<Set<string>>(new Set())
const subscribedTags = ref<Set<string>>(new Set())
const subPending = ref(false)

async function fetchSubscriptions() {
  if (!authStore.isLoggedIn) return
  try {
    const res = await $fetch<{ data: { feedNames: string[]; tags: string[] } }>('/api/articles/subscriptions')
    subscribedFeeds.value = new Set(res.data.feedNames)
    subscribedTags.value = new Set(res.data.tags)
  } catch { /* ignore */ }
}

async function toggleSubscribeFeed(name: string) {
  if (!authStore.isLoggedIn) { showLoginModal.value = true; return }
  if (subPending.value) return
  subPending.value = true
  const prev = subscribedFeeds.value.has(name)
  if (prev) { const s = new Set(subscribedFeeds.value); s.delete(name); subscribedFeeds.value = s }
  else subscribedFeeds.value = new Set([...subscribedFeeds.value, name])
  try {
    const res = await $fetch<{ data: { subscribed: boolean } }>('/api/articles/subscriptions', {
      method: 'POST', body: { feedName: name },
    })
    if (res.data.subscribed) { subscribedFeeds.value = new Set([...subscribedFeeds.value, name]) }
    else { const s = new Set(subscribedFeeds.value); s.delete(name); subscribedFeeds.value = s }
    toast.success(res.data.subscribed ? '구독했어요' : '구독 해제했어요')
  } catch { if (prev) subscribedFeeds.value = new Set([...subscribedFeeds.value, name]); else { const s = new Set(subscribedFeeds.value); s.delete(name); subscribedFeeds.value = s }; toast.error('구독 처리에 실패했어요') }
  finally { subPending.value = false }
}

async function toggleSubscribeTag(tag: string) {
  if (!authStore.isLoggedIn) { showLoginModal.value = true; return }
  if (subPending.value) return
  subPending.value = true
  const prev = subscribedTags.value.has(tag)
  if (prev) { const s = new Set(subscribedTags.value); s.delete(tag); subscribedTags.value = s }
  else subscribedTags.value = new Set([...subscribedTags.value, tag])
  try {
    const res = await $fetch<{ data: { subscribed: boolean } }>('/api/articles/subscriptions', {
      method: 'POST', body: { tag },
    })
    if (res.data.subscribed) { subscribedTags.value = new Set([...subscribedTags.value, tag]) }
    else { const s = new Set(subscribedTags.value); s.delete(tag); subscribedTags.value = s }
    toast.success(res.data.subscribed ? '구독했어요' : '구독 해제했어요')
  } catch { if (prev) subscribedTags.value = new Set([...subscribedTags.value, tag]); else { const s = new Set(subscribedTags.value); s.delete(tag); subscribedTags.value = s }; toast.error('구독 처리에 실패했어요') }
  finally { subPending.value = false }
}

const bookmarkPending = ref<Set<string>>(new Set())
async function toggleBookmark(article: Article) {
  if (!authStore.isLoggedIn) { showLoginModal.value = true; return }
  if (bookmarkPending.value.has(article.id)) return
  bookmarkPending.value = new Set([...bookmarkPending.value, article.id])
  const prev = article.isBookmarked; article.isBookmarked = !prev
  try {
    const res = await $fetch<{ data: { isBookmarked: boolean } }>(`/api/articles/${article.id}/bookmarks`, { method: 'POST' })
    article.isBookmarked = res.data.isBookmarked
  } catch { article.isBookmarked = prev; toast.error('북마크 처리에 실패했어요') }
  finally { const next = new Set(bookmarkPending.value); next.delete(article.id); bookmarkPending.value = next }
}

function formatDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return m <= 1 ? '방금 전' : `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  if (d < 30) return `${Math.floor(d / 7)}주 전`
  if (d < 365) return `${Math.floor(d / 30)}개월 전`
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── 개인화 추천 ──────────────────────────────────────
interface RecommendArticle {
  id: string; feedName: string; title: string; url: string; tags: string[]; publishedAt: string
}

interface PersonalInsight {
  topTag: string | null
  topFeed: string | null
  hasHistory: boolean
}

const recBlog = ref<RecommendArticle[]>([])    // 국내 블로그 추천
const recNews = ref<RecommendArticle[]>([])    // 해외 뉴스 추천
const recInsight = ref<PersonalInsight>({ topTag: null, topFeed: null, hasHistory: false })

const recTitle = computed(() => {
  const nick = authStore.profile?.nickname
  return nick ? `${nick}님을 위한 추천` : '오늘의 추천'
})
const hasRec = computed(() => recBlog.value.length > 0 || recNews.value.length > 0)

function analyzeHistory(): PersonalInsight {
  if (!import.meta.client) return { topTag: null, topFeed: null, hasHistory: false }
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as Array<{ tags?: string[]; feedName?: string }>
    if (raw.length === 0) return { topTag: null, topFeed: null, hasHistory: false }

    const tagCount: Record<string, number> = {}
    raw.slice(0, 20).forEach((a, i) => {
      const weight = Math.max(1, 10 - i)
      ;(a.tags ?? []).forEach((t) => { tagCount[t] = (tagCount[t] ?? 0) + weight })
    })
    const feedCount: Record<string, number> = {}
    raw.slice(0, 20).forEach((a) => {
      if (a.feedName) feedCount[a.feedName] = (feedCount[a.feedName] ?? 0) + 1
    })

    return {
      topTag: Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      topFeed: Object.entries(feedCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      hasHistory: true,
    }
  } catch { return { topTag: null, topFeed: null, hasHistory: false } }
}

async function fetchRecommended() {
  const insight = analyzeHistory()
  recInsight.value = insight

  const tag = insight.topTag
  const feed = insight.topFeed

  const [blogPersonalRes, blogFallbackRes, newsPersonalRes, newsFallbackRes] = await Promise.allSettled([
    // 국내 블로그 — 개인화 (tag 또는 feed 기반, 최신순)
    (tag || feed)
      ? $fetch<{ data: RecommendArticle[] }>('/api/articles', {
          query: { category: 'domestic', sort: 'latest', limit: 6, ...(tag ? { tag } : { feedName: feed }) },
        })
      : Promise.resolve(null),
    // 국내 블로그 — fallback (이번 주 트렌딩)
    $fetch<{ data: RecommendArticle[] }>('/api/articles', {
      query: { category: 'domestic', sort: 'trending', period: 'week', limit: 6 },
    }),
    // 해외 뉴스 — 개인화
    tag
      ? $fetch<{ data: RecommendArticle[] }>('/api/articles', {
          query: { category: 'international', sort: 'latest', limit: 5, tag },
        })
      : Promise.resolve(null),
    // 해외 뉴스 — fallback
    $fetch<{ data: RecommendArticle[] }>('/api/articles', {
      query: { category: 'international', sort: 'trending', period: 'week', limit: 5 },
    }),
  ])

  // 국내: 개인화 결과 우선, 없으면 fallback
  const blogPersonal = blogPersonalRes.status === 'fulfilled' ? blogPersonalRes.value?.data ?? [] : []
  const blogFallback = blogFallbackRes.status === 'fulfilled' ? blogFallbackRes.value.data : []
  recBlog.value = (blogPersonal.length >= 3 ? blogPersonal : blogFallback).slice(0, 4)

  // 해외: 개인화 결과 우선, 없으면 fallback
  const newsPersonal = newsPersonalRes.status === 'fulfilled' ? newsPersonalRes.value?.data ?? [] : []
  const newsFallback = newsFallbackRes.status === 'fulfilled' ? newsFallbackRes.value.data : []
  recNews.value = (newsPersonal.length >= 2 ? newsPersonal : newsFallback).slice(0, 3)
}

watch([activeTab, selectedFeed, selectedTag, selectedPeriod, selectedSort, searchQuery], resetAndFetch)
onMounted(() => { loadReadIds(); fetchFeeds(); fetchArticles(); fetchSubscriptions(); fetchRecommended(); nextTick(setupInfiniteScroll) })
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
    <h1 class="mb-5 text-2xl font-black text-foreground">아티클</h1>

    <!-- 탭 -->
    <div class="mb-5 flex gap-1 border-b border-border">
      <button
        v-for="tab in tabs" :key="tab.value" type="button"
        class="px-4 pb-3 text-sm font-semibold transition-colors"
        :class="activeTab === tab.value ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'"
        @click="selectTab(tab.value)"
      >{{ tab.label }}</button>
    </div>

    <div class="flex gap-6">
      <!-- 사이드바 -->
      <aside class="hidden w-44 shrink-0 lg:block">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">출처</p>
        <ul v-if="feedsLoading" class="space-y-1">
          <li v-for="i in 8" :key="i" class="h-9 animate-pulse rounded-lg bg-muted" />
        </ul>
        <ul v-else class="max-h-[calc(100vh-220px)] space-y-0.5 overflow-y-auto scrollbar-none">
          <li>
            <button type="button"
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="selectedFeed === null ? 'bg-accent font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              @click="selectFeed(null)"
            ><span class="size-2 shrink-0 rounded-full bg-muted-foreground/40" />전체</button>
          </li>
          <li v-for="name in currentFeedNames" :key="name" class="group/item flex items-center">
            <button type="button"
              class="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="selectedFeed === name ? 'bg-accent font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              @click="selectFeed(name)"
            >
              <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: getBrandColor(name) }" />
              <span class="truncate">{{ shortName(name) }}</span>
            </button>
            <button
              type="button"
              class="mr-1 shrink-0 rounded p-1 opacity-0 transition-opacity group-hover/item:opacity-100"
              :class="subscribedFeeds.has(name) ? 'text-primary opacity-100' : 'text-muted-foreground hover:text-foreground'"
              :title="subscribedFeeds.has(name) ? '구독 해제' : '새 글 알림 구독'"
              @click.stop="toggleSubscribeFeed(name)"
            >
              <BellOff v-if="subscribedFeeds.has(name)" class="size-3" />
              <Bell v-else class="size-3" />
            </button>
          </li>
        </ul>

      </aside>

      <!-- 메인 -->
      <div class="min-w-0 flex-1">

        <!-- 컨트롤 바 -->
        <div class="mb-4 flex flex-col gap-3">
          <!-- 데스크탑 -->
          <div class="hidden items-center gap-2 lg:flex">
            <form class="relative flex-1" @submit.prevent="submitSearch">
              <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input v-model="searchInput" type="text" placeholder="제목 검색..."
                class="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button v-if="searchInput" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" @click="clearSearch">
                <X class="size-3.5" />
              </button>
            </form>
            <div class="flex shrink-0 overflow-hidden rounded-xl border border-border bg-background">
              <button type="button" class="px-4 py-2 text-xs font-medium transition-colors" :class="selectedSort === 'latest' ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'" @click="selectSort('latest')">최신순</button>
              <button type="button" class="px-4 py-2 text-xs font-medium transition-colors" :class="selectedSort === 'trending' ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'" @click="selectSort('trending')">트렌딩</button>
            </div>
            <div class="flex shrink-0 overflow-hidden rounded-xl border border-border bg-background">
              <button v-for="p in periods" :key="p.value" type="button" class="px-3 py-2 text-xs font-medium transition-colors" :class="selectedPeriod === p.value ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'" @click="selectPeriod(p.value)">{{ p.label }}</button>
            </div>
          </div>

          <!-- 모바일 검색 -->
          <form class="relative lg:hidden" @submit.prevent="submitSearch">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input v-model="searchInput" type="text" placeholder="제목 검색..."
              class="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button v-if="searchInput" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" @click="clearSearch">
              <X class="size-3.5" />
            </button>
          </form>

          <!-- 모바일 드롭다운 -->
          <div class="grid grid-cols-2 gap-2 pr-1 lg:hidden">
            <AppDropdown :model-value="selectedFeedValue" :options="[{ label: '출처', value: '' }, ...currentFeedNames.map(n => ({ label: shortName(n), value: n }))]" @update:model-value="selectedFeedValue = $event" />
            <AppDropdown :model-value="selectedTag ?? ''" :options="[{ label: '주제', value: '' }, ...TAGS.map(t => ({ label: t, value: t }))]" @update:model-value="selectTag($event || null)" />
            <AppDropdown :model-value="selectedSort" :options="[{ label: '최신순', value: 'latest' }, { label: '트렌딩', value: 'trending' }]" @update:model-value="selectSort($event as Sort)" />
            <AppDropdown :model-value="selectedPeriod" :options="periods.map(p => ({ label: p.label, value: p.value }))" @update:model-value="selectPeriod($event as Period)" />
          </div>

            <!-- 주제 태그 빠른 선택 (데스크탑 — 사이드바 스크롤 없이) -->
          <div class="hidden lg:flex items-center gap-1.5 flex-wrap">
            <button
              v-for="tag in TAGS" :key="tag" type="button"
              class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              :class="selectedTag === tag
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'"
              @click="selectTag(selectedTag === tag ? null : tag)"
            >{{ tag }}</button>
          </div>

        <!-- 활성 필터 태그 -->
          <div v-if="activeFilters.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="f in activeFilters" :key="f.label"
              class="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {{ f.label }}
              <button type="button" class="ml-0.5 rounded-full hover:bg-primary/20" @click="f.clear()">
                <X class="size-3" />
              </button>
            </span>
            <button type="button" class="text-xs text-muted-foreground underline-offset-2 hover:underline" @click="selectedFeed = null; selectedTag = null; selectedPeriod = 'all'; selectedSort = 'latest'; clearSearch()">
              전체 초기화
            </button>
          </div>
        </div>

        <!-- 로딩 -->
        <div v-if="pending" class="flex justify-center py-20">
          <Loader2 class="size-6 animate-spin text-muted-foreground" />
        </div>

        <!-- 카드 그리드 -->
        <div v-else-if="articles.length > 0">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" style="min-height: 600px; align-content: start;">
            <div v-for="article in articles" :key="article.id"
              class="group relative flex h-full flex-col rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
              :class="{ 'opacity-75': readIds.has(article.id) }"
            >
              <a :href="article.url" target="_blank" rel="noopener noreferrer"
                class="flex flex-1 flex-col gap-2 p-4 pr-10 md:p-5"
                @click="markAsRead(article)"
              >
                <span class="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium leading-none text-muted-foreground">
                  <span class="size-1.5 shrink-0 rounded-full" :style="{ backgroundColor: getBrandColor(article.feedName) }" />
                  <span>{{ shortName(article.feedName) }}</span>
                </span>
                <p class="line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary"
                  :class="readIds.has(article.id) ? 'text-muted-foreground' : 'text-foreground'"
                >{{ article.title }}</p>
                <p v-if="article.summary" class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{{ article.summary }}</p>
                <!-- 태그 배지 -->
                <div v-if="article.tags?.length" class="mt-1.5 flex flex-wrap gap-1">
                  <button
                    v-for="tag in article.tags.slice(0, 3)" :key="tag"
                    type="button"
                    class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    @click.prevent.stop="selectTag(selectedTag === tag ? null : tag)"
                  >{{ tag }}</button>
                </div>
              </a>
              <div class="flex items-center justify-between border-t border-border px-4 py-3 md:px-5">
                <span class="text-xs text-muted-foreground">{{ formatDate(article.publishedAt) }}</span>
                <div class="flex items-center gap-1">
                  <!-- 공유 버튼 -->
                  <button type="button"
                    class="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    @click.stop="shareArticle(article)"
                  >
                    <Share2 class="size-3.5" />
                  </button>
                  <!-- 북마크 버튼 -->
                  <button type="button"
                    class="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-accent"
                    :class="article.isBookmarked ? 'text-primary' : 'text-muted-foreground'"
                    @click.stop="toggleBookmark(article)"
                  >
                    <BookmarkCheck v-if="article.isBookmarked" class="size-4" />
                    <Bookmark v-else class="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="totalPages > 1" class="mt-6 hidden lg:block">
            <Pagination :current="currentPage" :total="totalPages" @change="goPage" />
          </div>

          <div ref="sentinelRef" class="flex justify-center py-4 lg:hidden">
            <Loader2 v-if="loadingMore" class="size-5 animate-spin text-muted-foreground" />
            <span v-else-if="!hasMore" class="text-xs text-muted-foreground">모든 아티클을 불러왔어요</span>
          </div>
        </div>

        <AppEmptyState v-else :title="emptyTitle" :description="emptyDesc" />
      </div>
    </div>
  </div>

  <!-- 1440px 컨테이너 밖, 오른쪽 여백에 고정 추천 패널 (뷰포트 1700px+ 전용) -->
  <Teleport to="body">
    <div
      v-if="hasRec"
      class="fixed bottom-6 z-20 hidden w-64 min-[1700px]:block"
      style="left: calc(50% + 730px)"
    >
      <div class="max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl scrollbar-none">
        <!-- 헤더 -->
        <div class="bg-primary/5 px-4 py-3.5">
          <div class="flex items-center gap-2">
            <Sparkles class="size-4 text-primary" />
            <p class="text-sm font-bold text-foreground">{{ recTitle }}</p>
          </div>
        </div>

        <div class="space-y-5 p-4">
          <!-- 블로그 섹션 -->
          <div v-if="recBlog.length > 0">
            <p class="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">블로그</p>
            <ul class="space-y-2">
              <li v-for="rec in recBlog" :key="rec.id">
                <a :href="rec.url" target="_blank" rel="noopener noreferrer"
                  class="block rounded-xl border border-border p-3 transition-all hover:border-primary/30 hover:bg-muted"
                  @click="markAsRead(rec as Article)"
                >
                  <span class="mb-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span class="size-1.5 rounded-full" :style="{ backgroundColor: getBrandColor(rec.feedName) }" />
                    {{ shortName(rec.feedName) }}
                  </span>
                  <p class="line-clamp-2 text-xs font-semibold leading-snug text-foreground">{{ rec.title }}</p>
                </a>
              </li>
            </ul>
          </div>

          <!-- 뉴스 섹션 -->
          <div v-if="recNews.length > 0">
            <p class="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">해외 뉴스</p>
            <ul class="space-y-2">
              <li v-for="rec in recNews" :key="rec.id">
                <a :href="rec.url" target="_blank" rel="noopener noreferrer"
                  class="block rounded-xl border border-border p-3 transition-all hover:border-primary/30 hover:bg-muted"
                  @click="markAsRead(rec as Article)"
                >
                  <span class="mb-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span class="size-1.5 rounded-full" :style="{ backgroundColor: getBrandColor(rec.feedName) }" />
                    {{ shortName(rec.feedName) }}
                  </span>
                  <p class="line-clamp-2 text-xs font-semibold leading-snug text-foreground">{{ rec.title }}</p>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <LoginModal :open="showLoginModal" context="아티클 북마크" @close="showLoginModal = false" />
</template>
