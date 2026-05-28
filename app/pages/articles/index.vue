<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Bell,
  BellOff,
  Bookmark,
  BookmarkCheck,
  Loader2,
  Search,
  Sparkles,
  X,
  Share2,
} from '@lucide/vue'
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
  id: string
  feedName: string
  category: 'domestic' | 'international'
  title: string
  url: string
  summary: string | null
  imageUrl: string | null
  tags: string[]
  publishedAt: string
  isBookmarked: boolean
  bookmarkCount: number
}

const BRAND_COLORS: Record<string, string> = {
  네이버: '#03C75A',
  카카오: '#FFCD00',
  '네이버 D2': '#03C75A',
  '네이버 클라우드': '#03C75A',
  '카카오 기술 블로그': '#FFCD00',
  '카카오페이 기술 블로그': '#E8341C',
  '카카오엔터 기술 블로그': '#FFCD00',
  '라인 기술 블로그': '#00B900',
  '쿠팡 기술 블로그': '#FF6000',
  '우아한형제들 기술 블로그': '#2AC1BC',
  '당근 기술 블로그': '#FF6F0F',
  '토스 기술 블로그': '#0064FF',
  '직방 기술 블로그': '#FF6A00',
  '야놀자 기술 블로그': '#FF5F00',
  '쏘카 기술 블로그': '#00BAB3',
  'NHN 기술 블로그': '#00B0F0',
  '무신사 기술 블로그': '#555555',
  '왓챠 기술 블로그': '#FF2F6E',
  '인프런 기술 블로그': '#00C471',
  '리디 기술 블로그': '#1E9EFF',
  '하이퍼커넥트 기술 블로그': '#E31D1C',
  '올리브영 기술 블로그': '#3DAA6D',
  'Hacker News': '#FF6600',
  'dev.to': '#6366F1',
  'Smashing Magazine': '#E85A4F',
  'CSS-Tricks': '#FF453A',
  'Engineering at Meta': '#0866FF',
  'Google Developers': '#4285F4',
  'Netflix Tech Blog': '#E50914',
  'Uber Engineering': '#9CA3AF',
  'Airbnb Engineering': '#FF5A5F',
  'Shopify Engineering': '#96BF48',
  'GitHub Blog': '#6B7280',
  'Stripe Blog': '#635BFF',
  'Cloudflare Blog': '#F48120',
  'Vercel Blog': '#6B7280',
  'Discord Blog': '#5865F2',
  'Figma Blog': '#F24E1E',
  'Notion Blog': '#6B7280',
  'Slack Engineering': '#E01E5A',
  'Spotify Engineering': '#1DB954',
}
function getBrandColor(feedName: string) {
  return BRAND_COLORS[feedName] ?? '#6B7280'
}
function shortName(feedName: string) {
  if (feedName.startsWith('네이버')) return '네이버'
  if (feedName.startsWith('카카오')) return '카카오'
  return feedName
    .replace(' 기술 블로그', '')
    .replace(' Tech Blog', '')
    .replace(' Engineering', '')
    .replace(' Developers', '')
    .replace(' Blog', '')
}

const authStore = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()

type ArticleTab = 'domestic' | 'international'
type Period = 'all' | 'today' | 'week' | 'month'
type Sort = 'latest' | 'trending'

const TAGS = [
  'Frontend',
  'Backend',
  'DevOps',
  'AI/ML',
  'Database',
  'Architecture',
  'Mobile',
  'Security',
  'Performance',
  'Data',
]
const READ_KEY = 'poljjak_read_articles'
const RECENT_KEY = 'poljjak_recent_articles'
const CLIENT_ID_KEY = 'poljjak_article_client_id'
const MAX_RECENT = 20
const periods: Array<{ label: string; value: Period }> = [
  { label: '전체', value: 'all' },
  { label: '오늘', value: 'today' },
  { label: '이번 주', value: 'week' },
  { label: '이번 달', value: 'month' },
]
const initialPeriod = periods.find((p) => p.value === route.query.period)?.value ?? 'all'
const initialSort: Sort = route.query.sort === 'trending' ? 'trending' : 'latest'

const activeTab = ref<ArticleTab>(
  route.query.category === 'international' ? 'international' : 'domestic'
)
const selectedFeed = ref<string | null>(
  typeof route.query.feedName === 'string' ? route.query.feedName : null
)
const selectedTag = ref<string | null>(typeof route.query.tag === 'string' ? route.query.tag : null)
const selectedPeriod = ref<Period>(initialPeriod)
const selectedSort = ref<Sort>(initialSort)
const searchInput = ref(typeof route.query.q === 'string' ? route.query.q : '')
const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
interface FeedItem {
  name: string
  lastPublishedAt: string | null
}
const feedNames = ref<{ domestic: FeedItem[]; international: FeedItem[] }>({
  domestic: [],
  international: [],
})
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
  try {
    readIds.value = new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'))
  } catch {
    /* ignore */
  }
}
function getArticleClientId() {
  if (!import.meta.client) return null
  let clientId = localStorage.getItem(CLIENT_ID_KEY)
  if (!clientId) {
    clientId = crypto.randomUUID()
    localStorage.setItem(CLIENT_ID_KEY, clientId)
  }
  return clientId
}
function recordArticleClick(articleId: string) {
  if (!import.meta.client) return
  void $fetch(`/api/articles/${articleId}/clicks`, {
    method: 'POST',
    body: { clientId: getArticleClientId() },
  }).catch(() => {})
}
function markAsRead(article: Article | RecommendArticle) {
  if (!import.meta.client) return
  readIds.value = new Set([...readIds.value, article.id])
  recordArticleClick(article.id)
  // 최근 본 아티클 저장
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as Array<{
      id: string
      title: string
      url: string
      feedName: string
      publishedAt: string
      visitedAt: string
      tags?: string[]
    }>
    const filtered = raw.filter((r) => r.id !== article.id)
    filtered.unshift({
      id: article.id,
      title: article.title,
      url: article.url,
      feedName: article.feedName,
      publishedAt: article.publishedAt,
      visitedAt: new Date().toISOString(),
      tags: article.tags ?? [],
    })
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)))
    localStorage.setItem(READ_KEY, JSON.stringify([...readIds.value]))
  } catch {
    /* ignore */
  }
}

const tabs: Array<{ label: string; value: ArticleTab }> = [
  { label: '국내 블로그', value: 'domestic' },
  { label: '해외 뉴스', value: 'international' },
]
const currentFeeds = computed(() => {
  const feeds =
    activeTab.value === 'domestic' ? feedNames.value.domestic : feedNames.value.international
  return [...feeds].sort((a, b) => {
    if (!a.lastPublishedAt && !b.lastPublishedAt) return 0
    if (!a.lastPublishedAt) return 1
    if (!b.lastPublishedAt) return -1
    return new Date(b.lastPublishedAt).getTime() - new Date(a.lastPublishedAt).getTime()
  })
})
const currentFeedNames = computed(() => currentFeeds.value.map((f) => f.name))
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

const selectedFeedValue = computed({
  get: () => selectedFeed.value ?? '',
  set: (v: string) => {
    selectedFeed.value = v || null
  },
})

const hasActiveFilter = computed(
  () =>
    !!selectedFeed.value ||
    !!selectedTag.value ||
    selectedPeriod.value !== 'all' ||
    selectedSort.value !== 'latest' ||
    !!searchQuery.value
)

// 빈 상태 메시지
const emptyTitle = computed(() => {
  if (searchQuery.value) return `"${searchQuery.value}"에 대한 결과가 없어요`
  if (hasActiveFilter.value) return '선택한 조건에 맞는 아티클이 없어요'
  return '아직 수집된 아티클이 없어요'
})
const emptyDesc = computed(() => {
  if (searchQuery.value || hasActiveFilter.value) return '다른 검색어나 필터를 시도해보세요'
  return '곧 최신 기술 블로그 글이 올라올 예정이에요'
})

async function fetchFeeds() {
  feedsLoading.value = true
  try {
    const res = await $fetch<{ data: { domestic: FeedItem[]; international: FeedItem[] } }>(
      '/api/articles/feeds'
    )
    feedNames.value = res.data
  } catch {
    /* ignore */
  } finally {
    feedsLoading.value = false
  }
}

async function fetchArticles(append = false) {
  if (append) loadingMore.value = true
  else pending.value = true
  try {
    const res = await $fetch<{ data: Article[]; total: number }>('/api/articles', {
      query: {
        category: activeTab.value,
        page: currentPage.value,
        limit: PAGE_SIZE,
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

function syncArticleQuery() {
  router.replace({
    query: {
      category: activeTab.value,
      ...(selectedFeed.value ? { feedName: selectedFeed.value } : {}),
      ...(selectedTag.value ? { tag: selectedTag.value } : {}),
      ...(selectedSort.value !== 'latest' ? { sort: selectedSort.value } : {}),
      ...(selectedPeriod.value !== 'all' ? { period: selectedPeriod.value } : {}),
      ...(searchQuery.value ? { q: searchQuery.value } : {}),
    },
  })
}

function resetAndFetch() {
  currentPage.value = 1
  articles.value = []
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  syncArticleQuery()
  fetchArticles()
}

function selectTab(tab: ArticleTab) {
  activeTab.value = tab
  selectedFeed.value = null
}
function selectFeed(name: string | null) {
  selectedFeed.value = name
}
function selectTag(tag: string | null) {
  selectedTag.value = tag
}
function selectSort(s: Sort) {
  selectedSort.value = s
}
function selectPeriod(p: Period) {
  selectedPeriod.value = p
}
function submitSearch() {
  const next = searchInput.value.trim()
  if (searchQuery.value === next) resetAndFetch()
  else searchQuery.value = next
}
function clearSearch() {
  searchInput.value = ''
  if (searchQuery.value) searchQuery.value = ''
  else resetAndFetch()
}

function goPage(page: number) {
  currentPage.value = page
  fetchArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 읽은 글 숨기기
const hideRead = ref(false)
const visibleArticles = computed(() =>
  hideRead.value ? articles.value.filter((a) => !readIds.value.has(a.id)) : articles.value
)

// 공유
async function shareArticle(article: Article) {
  try {
    await navigator.clipboard.writeText(article.url)
    toast.success('링크가 복사됐어요')
  } catch {
    toast.error('복사에 실패했어요')
  }
}

function shareTwitter(article: Article) {
  const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(article.url)}&text=${encodeURIComponent(article.title)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

function shareLinkedIn(article: Article) {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(article.url)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 무한 스크롤
let observer: IntersectionObserver | null = null
function setupInfiniteScroll() {
  observer?.disconnect()
  if (!import.meta.client) return
  observer = new IntersectionObserver(
    (entries) => {
      if (
        entries[0]?.isIntersecting &&
        hasMore.value &&
        !loadingMore.value &&
        !pending.value &&
        window.innerWidth < 2000
      ) {
        currentPage.value++
        fetchArticles(true)
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinelRef.value) observer.observe(sentinelRef.value)
}
watch(sentinelRef, () => {
  if (sentinelRef.value) setupInfiniteScroll()
})

// ── 구독 관리 ──────────────────────────────────────
const subscribedFeeds = ref<Set<string>>(new Set())
const subPending = ref(false)

async function fetchSubscriptions() {
  if (!authStore.isLoggedIn) return
  try {
    const res = await $fetch<{ data: { feedNames: string[]; tags: string[] } }>(
      '/api/articles/subscriptions'
    )
    subscribedFeeds.value = new Set(res.data.feedNames)
  } catch {
    /* ignore */
  }
}

async function toggleSubscribeFeed(name: string) {
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
    return
  }
  if (subPending.value) return
  subPending.value = true
  const prev = subscribedFeeds.value.has(name)
  if (prev) {
    const s = new Set(subscribedFeeds.value)
    s.delete(name)
    subscribedFeeds.value = s
  } else subscribedFeeds.value = new Set([...subscribedFeeds.value, name])
  try {
    const res = await $fetch<{ data: { subscribed: boolean } }>('/api/articles/subscriptions', {
      method: 'POST',
      body: { feedName: name },
    })
    if (res.data.subscribed) {
      subscribedFeeds.value = new Set([...subscribedFeeds.value, name])
    } else {
      const s = new Set(subscribedFeeds.value)
      s.delete(name)
      subscribedFeeds.value = s
    }
    toast.success(res.data.subscribed ? '구독했어요' : '구독 해제했어요')
  } catch {
    if (prev) subscribedFeeds.value = new Set([...subscribedFeeds.value, name])
    else {
      const s = new Set(subscribedFeeds.value)
      s.delete(name)
      subscribedFeeds.value = s
    }
    toast.error('구독 처리에 실패했어요')
  } finally {
    subPending.value = false
  }
}

const bookmarkPending = ref<Set<string>>(new Set())
async function toggleBookmark(article: Article) {
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
    return
  }
  if (bookmarkPending.value.has(article.id)) return
  bookmarkPending.value = new Set([...bookmarkPending.value, article.id])
  const prev = article.isBookmarked
  article.isBookmarked = !prev
  try {
    const res = await $fetch<{ data: { isBookmarked: boolean } }>(
      `/api/articles/${article.id}/bookmarks`,
      { method: 'POST' }
    )
    article.isBookmarked = res.data.isBookmarked
  } catch {
    article.isBookmarked = prev
    toast.error('북마크 처리에 실패했어요')
  } finally {
    const next = new Set(bookmarkPending.value)
    next.delete(article.id)
    bookmarkPending.value = next
  }
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
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ── 개인화 추천 ──────────────────────────────────────
interface RecommendArticle {
  id: string
  feedName: string
  title: string
  url: string
  tags: string[]
  publishedAt: string
}

interface PersonalInsight {
  topTag: string | null
  topFeed: string | null
  hasHistory: boolean
}

const recBlog = ref<RecommendArticle[]>([]) // 국내 블로그 추천
const recNews = ref<RecommendArticle[]>([]) // 해외 뉴스 추천
const recInsight = ref<PersonalInsight>({ topTag: null, topFeed: null, hasHistory: false })
const recSheetOpen = ref(false)

function clickRec(rec: RecommendArticle) {
  markAsRead(rec)
  recSheetOpen.value = false
}

const recTitle = computed(() => {
  const nick = authStore.profile?.nickname
  return nick ? `${nick}님을 위한 추천` : '오늘의 추천'
})
const hasRec = computed(() => recBlog.value.length > 0 || recNews.value.length > 0)
watch(hasRec, (value) => {
  if (!value) recSheetOpen.value = false
})

function toggleRecommendationBubble() {
  recSheetOpen.value = !recSheetOpen.value
  if (recSheetOpen.value && !hasRec.value) {
    fetchRecommended()
  }
}

function analyzeHistory(): PersonalInsight {
  if (!import.meta.client) return { topTag: null, topFeed: null, hasHistory: false }
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as Array<{
      tags?: string[]
      feedName?: string
    }>
    if (raw.length === 0) return { topTag: null, topFeed: null, hasHistory: false }

    const tagCount: Record<string, number> = {}
    raw.slice(0, 20).forEach((a, i) => {
      const weight = Math.max(1, 10 - i)
      ;(a.tags ?? []).forEach((t) => {
        tagCount[t] = (tagCount[t] ?? 0) + weight
      })
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
  } catch {
    return { topTag: null, topFeed: null, hasHistory: false }
  }
}

async function fetchRecommended() {
  const insight = analyzeHistory()
  recInsight.value = insight

  const tag = insight.topTag
  const feed = insight.topFeed

  const [blogPersonalRes, blogFallbackRes, newsPersonalRes, newsFallbackRes] =
    await Promise.allSettled([
      // 국내 블로그 — 개인화 (tag 또는 feed 기반, 최신순)
      tag || feed
        ? $fetch<{ data: RecommendArticle[] }>('/api/articles', {
            query: {
              category: 'domestic',
              sort: 'latest',
              limit: 6,
              ...(tag ? { tag } : { feedName: feed }),
            },
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
  const blogPersonal =
    blogPersonalRes.status === 'fulfilled' ? (blogPersonalRes.value?.data ?? []) : []
  const blogFallback = blogFallbackRes.status === 'fulfilled' ? blogFallbackRes.value.data : []
  recBlog.value = (blogPersonal.length >= 3 ? blogPersonal : blogFallback).slice(0, 4)

  // 해외: 개인화 결과 우선, 없으면 fallback
  const newsPersonal =
    newsPersonalRes.status === 'fulfilled' ? (newsPersonalRes.value?.data ?? []) : []
  const newsFallback = newsFallbackRes.status === 'fulfilled' ? newsFallbackRes.value.data : []
  recNews.value = (newsPersonal.length >= 2 ? newsPersonal : newsFallback).slice(0, 3)
}

watch(
  [activeTab, selectedFeed, selectedTag, selectedPeriod, selectedSort, searchQuery],
  resetAndFetch
)
onMounted(() => {
  loadReadIds()
  fetchFeeds()
  fetchArticles()
  fetchSubscriptions()
  fetchRecommended()
  nextTick(setupInfiniteScroll)
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
    <h1 class="mb-5 text-2xl font-black text-foreground">아티클</h1>

    <!-- 탭 -->
    <div class="mb-5 flex gap-1 border-b border-border">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="px-4 pb-3 text-sm font-semibold transition-colors"
        :class="
          activeTab === tab.value
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="selectTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="flex gap-6">
      <!-- 사이드바 -->
      <aside class="hidden w-48 shrink-0 lg:block">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          출처
        </p>
        <ul v-if="feedsLoading" class="space-y-1">
          <li v-for="i in 8" :key="i" class="h-9 animate-pulse rounded-lg bg-muted" />
        </ul>
        <ul v-else class="max-h-[calc(100vh-220px)] space-y-0.5 overflow-y-auto scrollbar-none">
          <li>
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors"
              :class="
                selectedFeed === null
                  ? 'bg-accent font-semibold text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              "
              @click="selectFeed(null)"
            >
              <span class="size-2 shrink-0 rounded-full bg-muted-foreground/40" />전체
            </button>
          </li>
          <li v-for="feed in currentFeeds" :key="feed.name" class="group/item flex items-center">
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors"
              :class="
                selectedFeed === feed.name
                  ? 'bg-accent font-semibold text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              "
              @click="selectFeed(feed.name)"
            >
              <span
                class="size-2 shrink-0 rounded-full"
                :style="{ backgroundColor: getBrandColor(feed.name) }"
              />
              <span class="min-w-0 flex-1 truncate">{{ shortName(feed.name) }}</span>
              <span
                v-if="feed.lastPublishedAt"
                class="shrink-0 text-[10px] text-muted-foreground/50"
              >
                {{ formatDate(feed.lastPublishedAt) }}
              </span>
            </button>
            <button
              type="button"
              class="mr-1 shrink-0 rounded p-1 opacity-0 transition-opacity group-hover/item:opacity-100"
              :class="
                subscribedFeeds.has(feed.name)
                  ? 'text-primary opacity-100'
                  : 'text-muted-foreground hover:text-foreground'
              "
              :title="subscribedFeeds.has(feed.name) ? '구독 해제' : '새 글 알림 구독'"
              @click.stop="toggleSubscribeFeed(feed.name)"
            >
              <BellOff v-if="subscribedFeeds.has(feed.name)" class="size-3" />
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
              <Search
                class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                v-model="searchInput"
                type="text"
                placeholder="검색어를 입력하세요"
                class="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                v-if="searchInput"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                @click="clearSearch"
              >
                <X class="size-3.5" />
              </button>
            </form>
            <div
              class="flex h-10 shrink-0 overflow-hidden rounded-xl border border-border bg-background"
            >
              <button
                type="button"
                class="px-4 text-xs font-medium transition-colors"
                :class="
                  selectedSort === 'latest'
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                "
                @click="selectSort('latest')"
              >
                최신순
              </button>
              <button
                type="button"
                class="px-4 text-xs font-medium transition-colors"
                :class="
                  selectedSort === 'trending'
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                "
                @click="selectSort('trending')"
              >
                트렌딩
              </button>
            </div>
            <div
              class="flex h-10 shrink-0 overflow-hidden rounded-xl border border-border bg-background"
            >
              <button
                v-for="p in periods"
                :key="p.value"
                type="button"
                class="min-w-14 px-3 text-xs font-medium transition-colors"
                :class="
                  selectedPeriod === p.value
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                "
                @click="selectPeriod(p.value)"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- 모바일 검색 -->
          <form class="relative lg:hidden" @submit.prevent="submitSearch">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="searchInput"
              type="text"
              placeholder="검색어를 입력하세요"
              class="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              v-if="searchInput"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              @click="clearSearch"
            >
              <X class="size-3.5" />
            </button>
          </form>

          <!-- 모바일 드롭다운 -->
          <div class="grid grid-cols-2 gap-2 pr-1 lg:hidden">
            <AppDropdown
              :model-value="selectedFeedValue"
              :options="[
                { label: '출처', value: '' },
                ...currentFeedNames.map((n) => ({ label: shortName(n), value: n })),
              ]"
              @update:model-value="selectedFeedValue = $event"
            />
            <AppDropdown
              :model-value="selectedTag ?? ''"
              :options="[
                { label: '주제', value: '' },
                ...TAGS.map((t) => ({ label: t, value: t })),
              ]"
              @update:model-value="selectTag($event || null)"
            />
            <AppDropdown
              :model-value="selectedSort"
              :options="[
                { label: '최신순', value: 'latest' },
                { label: '트렌딩', value: 'trending' },
              ]"
              @update:model-value="selectSort($event as Sort)"
            />
            <AppDropdown
              :model-value="selectedPeriod"
              :options="periods.map((p) => ({ label: p.label, value: p.value }))"
              @update:model-value="selectPeriod($event as Period)"
            />
          </div>

          <!-- 주제 태그 빠른 선택 + 읽은 글 숨기기 (데스크탑) -->
          <div class="hidden lg:flex items-center justify-between gap-1.5">
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="tag in TAGS"
                :key="tag"
                type="button"
                class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                :class="
                  selectedTag === tag
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                "
                @click="selectTag(selectedTag === tag ? null : tag)"
              >
                {{ tag }}
              </button>
            </div>
            <button
              type="button"
              class="flex h-8 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors"
              :class="
                hideRead
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              "
              @click="hideRead = !hideRead"
            >
              읽은 글 숨기기
            </button>
          </div>
        </div>

        <!-- 로딩 -->
        <div v-if="pending" class="flex justify-center py-20">
          <Loader2 class="size-6 animate-spin text-muted-foreground" />
        </div>

        <!-- 카드 그리드 -->
        <div v-else-if="articles.length > 0">
          <div
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            style="min-height: 600px; align-content: start"
          >
            <div
              v-for="article in visibleArticles"
              :key="article.id"
              class="group relative flex h-full flex-col rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
              :class="{ 'opacity-75': readIds.has(article.id) }"
            >
              <!-- 썸네일 -->
              <a
                :href="article.url"
                target="_blank"
                rel="noopener noreferrer"
                class="block overflow-hidden rounded-t-2xl"
                @click="markAsRead(article)"
              >
                <img
                  v-if="article.imageUrl"
                  :src="article.imageUrl"
                  :alt="article.title"
                  class="aspect-[2/1] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  @error="
                    (
                      ($event.target as HTMLImageElement).parentElement as HTMLElement | null
                    )?.style.setProperty('display', 'none')
                  "
                />
                <div v-else class="aspect-[2/1] w-full flex items-center justify-center bg-muted">
                  <span
                    class="text-5xl font-black select-none"
                    :style="{ color: getBrandColor(article.feedName) + 'aa' }"
                    >{{ shortName(article.feedName).charAt(0) }}</span
                  >
                </div>
              </a>
              <a
                :href="article.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-1 flex-col gap-2 p-4 pr-10 md:p-5"
                @click="markAsRead(article)"
              >
                <span
                  class="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium leading-none text-muted-foreground"
                >
                  <span
                    class="size-1.5 shrink-0 rounded-full"
                    :style="{ backgroundColor: getBrandColor(article.feedName) }"
                  />
                  <span>{{ shortName(article.feedName) }}</span>
                </span>
                <p
                  class="line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary"
                  :class="readIds.has(article.id) ? 'text-muted-foreground' : 'text-foreground'"
                >
                  {{ article.title }}
                </p>
                <p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {{ article.summary || '요약 정보가 없어요' }}
                </p>
                <!-- 태그 배지 -->
                <div class="mt-auto pt-1.5 flex flex-wrap gap-1 min-h-[1.25rem]">
                  <button
                    v-for="tag in article.tags.slice(0, 3)"
                    :key="tag"
                    type="button"
                    class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    @click.prevent.stop="selectTag(selectedTag === tag ? null : tag)"
                  >
                    {{ tag }}
                  </button>
                </div>
              </a>
              <div
                class="flex items-center justify-between border-t border-border px-4 py-3 md:px-5"
              >
                <span class="text-xs text-muted-foreground">{{
                  formatDate(article.publishedAt)
                }}</span>
                <div class="flex items-center gap-1">
                  <!-- 공유 드롭다운 -->
                  <div class="group/share relative">
                    <button
                      type="button"
                      class="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Share2 class="size-3.5" />
                    </button>
                    <div
                      class="absolute bottom-8 right-0 hidden w-36 overflow-hidden rounded-xl border border-border bg-popover shadow-lg group-hover/share:block"
                    >
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                        @click.stop="shareArticle(article)"
                      >
                        <Share2 class="size-3 shrink-0" /> 링크 복사
                      </button>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                        @click.stop="shareTwitter(article)"
                      >
                        <svg class="size-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.734-8.85L1.254 2.25H8.08l4.253 5.622L18.244 2.25z"
                          />
                        </svg>
                        X(트위터)
                      </button>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                        @click.stop="shareLinkedIn(article)"
                      >
                        <svg class="size-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                          />
                        </svg>
                        LinkedIn
                      </button>
                    </div>
                  </div>
                  <!-- 북마크 버튼 -->
                  <button
                    type="button"
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

          <!-- 1700px 이상에서만 페이지네이션, 그 미만은 무한 스크롤 -->
          <div v-if="totalPages > 1" class="mt-6 hidden min-[2000px]:block">
            <Pagination :current="currentPage" :total="totalPages" @change="goPage" />
          </div>

          <div ref="sentinelRef" class="flex justify-center py-4 min-[2000px]:hidden">
            <Loader2 v-if="loadingMore" class="size-5 animate-spin text-muted-foreground" />
          </div>
        </div>

        <AppEmptyState v-else :title="emptyTitle" :description="emptyDesc" />
      </div>
    </div>
  </div>

  <!-- 데스크탑 추천 패널: 1440px 컨테이너 밖 오른쪽 고정 (1700px+ 뷰포트) -->
  <Teleport to="body">
    <div
      v-if="hasRec"
      class="fixed bottom-6 z-20 hidden w-64 min-[2000px]:block"
      style="left: calc(50% + 730px)"
    >
      <div
        class="max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl scrollbar-none"
      >
        <div class="bg-primary/5 px-4 py-3.5">
          <div class="flex items-center gap-2">
            <Sparkles class="size-4 text-primary" />
            <p class="text-sm font-bold text-foreground">{{ recTitle }}</p>
          </div>
        </div>
        <div class="space-y-5 p-4">
          <div v-if="recBlog.length > 0">
            <p class="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              블로그
            </p>
            <ul class="space-y-2">
              <li v-for="rec in recBlog" :key="rec.id">
                <a
                  :href="rec.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block rounded-xl border border-border p-3 transition-all hover:border-primary/30 hover:bg-muted"
                  @click="markAsRead(rec)"
                >
                  <span
                    class="mb-1.5 inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground"
                  >
                    <span
                      class="size-1.5 shrink-0 rounded-full"
                      :style="{ backgroundColor: getBrandColor(rec.feedName) }"
                    />
                    {{ shortName(rec.feedName) }}
                  </span>
                  <p class="line-clamp-3 text-xs font-semibold leading-snug text-foreground">
                    {{ rec.title }}
                  </p>
                </a>
              </li>
            </ul>
          </div>
          <div v-if="recNews.length > 0">
            <p class="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              해외 뉴스
            </p>
            <ul class="space-y-2">
              <li v-for="rec in recNews" :key="rec.id">
                <a
                  :href="rec.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block rounded-xl border border-border p-3 transition-all hover:border-primary/30 hover:bg-muted"
                  @click="markAsRead(rec)"
                >
                  <span
                    class="mb-1.5 inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground"
                  >
                    <span
                      class="size-1.5 shrink-0 rounded-full"
                      :style="{ backgroundColor: getBrandColor(rec.feedName) }"
                    />
                    {{ shortName(rec.feedName) }}
                  </span>
                  <p class="line-clamp-3 text-xs font-semibold leading-snug text-foreground">
                    {{ rec.title }}
                  </p>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 모바일/태블릿 추천 플로팅 버튼 (1700px 미만, 원형 FAB) -->
  <Teleport to="body">
    <div v-if="hasRec" class="fixed bottom-6 right-6 z-30 min-[2000px]:hidden">
      <!-- 말풍선 시트 -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-2"
      >
        <div v-if="recSheetOpen" class="absolute bottom-16 right-0 w-80 origin-bottom-right">
          <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div
              class="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-3"
            >
              <div class="flex items-center gap-2">
                <Sparkles class="size-4 text-primary" />
                <p class="text-sm font-bold text-foreground">{{ recTitle }}</p>
              </div>
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                @click="recSheetOpen = false"
              >
                <X class="size-4" />
              </button>
            </div>
            <div class="max-h-[60vh] space-y-4 overflow-y-auto p-4 scrollbar-none">
              <div v-if="recBlog.length > 0">
                <p
                  class="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  블로그
                </p>
                <ul class="space-y-2">
                  <li v-for="rec in recBlog.slice(0, 2)" :key="rec.id">
                    <a
                      :href="rec.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block rounded-xl border border-border p-3 transition-all hover:border-primary/30 hover:bg-muted"
                      @click="clickRec(rec)"
                    >
                      <span
                        class="mb-1.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <span
                          class="size-1.5 rounded-full"
                          :style="{ backgroundColor: getBrandColor(rec.feedName) }"
                        />
                        {{ shortName(rec.feedName) }}
                      </span>
                      <p class="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                        {{ rec.title }}
                      </p>
                    </a>
                  </li>
                </ul>
              </div>
              <div v-if="recNews.length > 0">
                <p
                  class="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  해외 뉴스
                </p>
                <ul class="space-y-2">
                  <li v-for="rec in recNews.slice(0, 2)" :key="rec.id">
                    <a
                      :href="rec.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block rounded-xl border border-border p-3 transition-all hover:border-primary/30 hover:bg-muted"
                      @click="clickRec(rec)"
                    >
                      <span
                        class="mb-1.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <span
                          class="size-1.5 rounded-full"
                          :style="{ backgroundColor: getBrandColor(rec.feedName) }"
                        />
                        {{ shortName(rec.feedName) }}
                      </span>
                      <p class="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                        {{ rec.title }}
                      </p>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 원형 FAB -->
      <button
        type="button"
        class="flex size-14 items-center justify-center rounded-full border border-border bg-card shadow-xl transition-all hover:border-primary/30 hover:shadow-2xl active:scale-95"
        @click="toggleRecommendationBubble"
      >
        <Sparkles class="size-6 text-primary" />
      </button>
    </div>
  </Teleport>

  <LoginModal :open="showLoginModal" context="아티클 북마크" @close="showLoginModal = false" />
</template>
