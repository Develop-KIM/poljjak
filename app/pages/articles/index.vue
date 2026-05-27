<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Bookmark, BookmarkCheck, Loader2, Search, X } from '@lucide/vue'
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
  title: string; url: string; summary: string | null
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
  '무신사 기술 블로그': '#222222', '왓챠 기술 블로그': '#FF2F6E',
  '인프런 기술 블로그': '#00C471', '리디 기술 블로그': '#1E9EFF',
  '하이퍼커넥트 기술 블로그': '#E31D1C', '올리브영 기술 블로그': '#3DAA6D',
  '29CM 기술 블로그': '#1A1A1A',
  'Hacker News': '#FF6600', 'dev.to': '#0A0A0A',
  'Smashing Magazine': '#E85A4F', 'CSS-Tricks': '#FF453A',
  'Engineering at Meta': '#0866FF', 'Google Developers': '#4285F4',
  'Netflix Tech Blog': '#E50914', 'Uber Engineering': '#1B1B1B',
  'Airbnb Engineering': '#FF5A5F', 'Shopify Engineering': '#96BF48',
  'GitHub Blog': '#24292F', 'Stripe Blog': '#635BFF',
  'Cloudflare Blog': '#F48120', 'Vercel Blog': '#000000',
  'Discord Blog': '#5865F2', 'Figma Blog': '#F24E1E',
  'Notion Blog': '#000000', 'Slack Engineering': '#4A154B',
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

const tabs: Array<{ label: string; value: ArticleTab }> = [
  { label: '기술 블로그', value: 'domestic' },
  { label: 'IT 뉴스', value: 'international' },
]
const periods: Array<{ label: string; value: Period }> = [
  { label: '전체', value: 'all' }, { label: '오늘', value: 'today' },
  { label: '이번 주', value: 'week' }, { label: '이번 달', value: 'month' },
]
const currentFeedNames = computed(() =>
  activeTab.value === 'domestic' ? feedNames.value.domestic : feedNames.value.international,
)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))
const isDesktop = computed(() => import.meta.client ? window.innerWidth >= 1024 : true)

// 모바일 select용 feedName 값 (null → '')
const selectedFeedValue = computed({
  get: () => selectedFeed.value ?? '',
  set: (v: string) => { selectedFeed.value = v || null; currentPage.value = 1 },
})

async function fetchFeeds() {
  feedsLoading.value = true
  try {
    const res = await $fetch<{ data: { domestic: string[]; international: string[] } }>('/api/articles/feeds')
    feedNames.value = res.data
  } catch { /* 피드 목록 로드 실패 시 필터 숨김 */ }
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

function resetAndFetch() { currentPage.value = 1; articles.value = []; fetchArticles() }

function selectTab(tab: ArticleTab) {
  activeTab.value = tab; selectedFeed.value = null; resetAndFetch()
  router.replace({ query: { category: tab } })
}
function selectFeed(name: string | null) { selectedFeed.value = name; resetAndFetch() }
function selectTag(tag: string | null) { selectedTag.value = tag; resetAndFetch() }
function selectSort(s: Sort) { selectedSort.value = s; resetAndFetch() }
function selectPeriod(p: Period) { selectedPeriod.value = p; resetAndFetch() }
function submitSearch() { searchQuery.value = searchInput.value.trim(); resetAndFetch() }
function clearSearch() { searchInput.value = ''; searchQuery.value = ''; resetAndFetch() }

// 데스크탑 페이지네이션
function goPage(page: number) { currentPage.value = page; fetchArticles(); window.scrollTo({ top: 0, behavior: 'smooth' }) }

// 모바일 무한 스크롤
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
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

watch([activeTab, selectedFeed, selectedTag, selectedPeriod, selectedSort, searchQuery], resetAndFetch)
onMounted(() => { fetchFeeds(); fetchArticles(); nextTick(setupInfiniteScroll) })
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

    <div class="flex gap-8">
      <!-- ── 데스크탑 사이드바 (항상 공간 확보) ── -->
      <aside class="hidden w-44 shrink-0 lg:block">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">출처</p>
        <!-- 스켈레톤 -->
        <ul v-if="feedsLoading" class="space-y-1">
          <li v-for="i in 8" :key="i" class="h-9 animate-pulse rounded-lg bg-muted" />
        </ul>
        <!-- 실제 목록 -->
        <ul v-else class="space-y-0.5">
          <li>
            <button type="button"
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="selectedFeed === null ? 'bg-accent font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              @click="selectFeed(null)"
            ><span class="size-2 shrink-0 rounded-full bg-muted-foreground/40" />전체</button>
          </li>
          <li v-for="name in currentFeedNames" :key="name">
            <button type="button"
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="selectedFeed === name ? 'bg-accent font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              @click="selectFeed(name)"
            >
              <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: getBrandColor(name) }" />
              {{ shortName(name) }}
            </button>
          </li>
        </ul>

        <!-- 태그 필터 -->
        <p class="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">주제</p>
        <ul class="space-y-0.5" v-if="!feedsLoading">
          <li>
            <button type="button"
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="selectedTag === null ? 'bg-accent font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              @click="selectTag(null)"
            >전체</button>
          </li>
          <li v-for="tag in TAGS" :key="tag">
            <button type="button"
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="selectedTag === tag ? 'bg-accent font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              @click="selectTag(tag)"
            >{{ tag }}</button>
          </li>
        </ul>
      </aside>

      <!-- ── 메인 ── -->
      <div class="min-w-0 flex-1">

        <!-- 컨트롤 바 -->
        <div class="mb-5 flex flex-col gap-3">
          <!-- 검색 -->
          <form class="relative" @submit.prevent="submitSearch">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="searchInput" type="text" placeholder="아티클 검색"
              class="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button v-if="searchInput" type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              @click="clearSearch"
            ><X class="size-3.5" /></button>
          </form>

          <!-- 모바일: select 드롭다운 -->
          <div class="grid grid-cols-2 gap-2 lg:hidden">
            <!-- 출처 -->
            <select v-model="selectedFeedValue"
              class="h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">전체 출처</option>
              <option v-for="name in currentFeedNames" :key="name" :value="name">{{ shortName(name) }}</option>
            </select>
            <!-- 주제 -->
            <select
              :value="selectedTag ?? ''"
              class="h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none"
              @change="selectTag(($event.target as HTMLSelectElement).value || null)"
            >
              <option value="">전체 주제</option>
              <option v-for="tag in TAGS" :key="tag" :value="tag">{{ tag }}</option>
            </select>
            <!-- 정렬 -->
            <select
              :value="selectedSort"
              class="h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none"
              @change="selectSort(($event.target as HTMLSelectElement).value as Sort)"
            >
              <option value="latest">최신순</option>
              <option value="trending">트렌딩</option>
            </select>
            <!-- 기간 -->
            <select
              :value="selectedPeriod"
              class="h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none"
              @change="selectPeriod(($event.target as HTMLSelectElement).value as Period)"
            >
              <option v-for="p in periods" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
          </div>

          <!-- 데스크탑: 토글 버튼 -->
          <div class="hidden items-center gap-2 lg:flex">
            <div class="flex rounded-xl border border-border bg-background p-1">
              <button type="button"
                class="rounded-lg px-4 py-1.5 text-xs font-medium transition-colors"
                :class="selectedSort === 'latest' ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'"
                @click="selectSort('latest')"
              >최신순</button>
              <button type="button"
                class="rounded-lg px-4 py-1.5 text-xs font-medium transition-colors"
                :class="selectedSort === 'trending' ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'"
                @click="selectSort('trending')"
              >트렌딩</button>
            </div>
            <div class="flex rounded-xl border border-border bg-background p-1">
              <button v-for="p in periods" :key="p.value" type="button"
                class="rounded-lg px-4 py-1.5 text-xs font-medium transition-colors"
                :class="selectedPeriod === p.value ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'"
                @click="selectPeriod(p.value)"
              >{{ p.label }}</button>
            </div>
          </div>
        </div>

        <!-- 로딩 -->
        <div v-if="pending" class="flex justify-center py-20">
          <Loader2 class="size-6 animate-spin text-muted-foreground" />
        </div>

        <!-- 카드 그리드 -->
        <div v-else-if="articles.length > 0">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div v-for="article in articles" :key="article.id"
              class="group relative flex flex-col rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
            >
              <a :href="article.url" target="_blank" rel="noopener noreferrer"
                class="flex flex-1 flex-col gap-2 p-4 pr-10 md:p-5"
              >
                <span class="w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  :style="{ backgroundColor: getBrandColor(article.feedName) + '18', color: getBrandColor(article.feedName) }"
                >{{ shortName(article.feedName) }}</span>
                <p class="line-clamp-2 text-sm font-bold leading-snug text-foreground group-hover:text-primary">{{ article.title }}</p>
                <p v-if="article.summary" class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{{ article.summary }}</p>
              </a>
              <div class="flex items-center justify-between border-t border-border px-4 py-3 md:px-5">
                <span class="text-xs text-muted-foreground">{{ formatDate(article.publishedAt) }}</span>
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

          <!-- 데스크탑: 페이지네이션 -->
          <div v-if="totalPages > 1" class="mt-6 hidden lg:block">
            <Pagination :current="currentPage" :total="totalPages" @change="goPage" />
          </div>

          <!-- 모바일: 무한 스크롤 센티넬 -->
          <div ref="sentinelRef" class="flex justify-center py-4 lg:hidden">
            <Loader2 v-if="loadingMore" class="size-5 animate-spin text-muted-foreground" />
            <span v-else-if="!hasMore" class="text-xs text-muted-foreground">모든 아티클을 불러왔어요</span>
          </div>
        </div>

        <AppEmptyState v-else title="아티클이 없어요" description="검색어나 필터를 바꿔보세요." />
      </div>
    </div>
  </div>

  <LoginModal :open="showLoginModal" context="아티클 북마크" @close="showLoginModal = false" />
</template>
