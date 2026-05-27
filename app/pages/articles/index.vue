<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Bookmark, BookmarkCheck, Loader2 } from '@lucide/vue'
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
  publishedAt: string
  isBookmarked: boolean
}

// 브랜드 컬러 매핑
const BRAND_COLORS: Record<string, string> = {
  '네이버 D2': '#03C75A',
  '네이버 클라우드': '#03C75A',
  '카카오 기술 블로그': '#FFCD00',
  '카카오페이 기술 블로그': '#E8341C',
  '카카오엔터 기술 블로그': '#FFCD00',
  '카카오뱅크 기술 블로그': '#FFCD00',
  '라인 기술 블로그': '#00B900',
  '쿠팡 기술 블로그': '#FF6000',
  '우아한형제들 기술 블로그': '#2AC1BC',
  '당근 기술 블로그': '#FF6F0F',
  '토스 기술 블로그': '#0064FF',
  '직방 기술 블로그': '#FF6A00',
  '야놀자 기술 블로그': '#FF5F00',
  '컬리 기술 블로그': '#5F0080',
  '뱅크샐러드 기술 블로그': '#54D37F',
  '쏘카 기술 블로그': '#00BAB3',
  '올리브영 기술 블로그': '#3DAA6D',
  'NHN 기술 블로그': '#00B0F0',
  '11번가 기술 블로그': '#FF0000',
  '리디 기술 블로그': '#1E9EFF',
  '하이퍼커넥트 기술 블로그': '#E31D1C',
  '오늘의집 기술 블로그': '#3B82F6',
  '무신사 기술 블로그': '#222222',
  '왓챠 기술 블로그': '#FF2F6E',
  '인프런 기술 블로그': '#00C471',
  'Hacker News': '#FF6600',
  'dev.to': '#0A0A0A',
  'Smashing Magazine': '#E85A4F',
  'CSS-Tricks': '#FF453A',
  'Engineering at Meta': '#0866FF',
  'Google Developers': '#4285F4',
  'Netflix Tech Blog': '#E50914',
  'Uber Engineering': '#1B1B1B',
  'Airbnb Engineering': '#FF5A5F',
  'Shopify Engineering': '#96BF48',
  'GitHub Blog': '#24292F',
  'Stripe Blog': '#635BFF',
  'Cloudflare Blog': '#F48120',
  'Vercel Blog': '#000000',
  'Discord Blog': '#5865F2',
  'Figma Blog': '#F24E1E',
  'Notion Blog': '#000000',
  'Slack Engineering': '#4A154B',
  'Spotify Engineering': '#1DB954',
}

function getBrandColor(feedName: string): string {
  return BRAND_COLORS[feedName] ?? '#6B7280'
}

// feedName에서 " 기술 블로그" 등 접미사 제거해 짧은 이름 반환
function shortName(feedName: string): string {
  return feedName
    .replace(' 기술 블로그', '')
    .replace(' Tech Blog', '')
    .replace(' Engineering', '')
    .replace(' Developers', '')
}

const authStore = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()

type ArticleTab = 'domestic' | 'international'

function getInitialTab(): ArticleTab {
  return route.query.category === 'international' ? 'international' : 'domestic'
}

const activeTab = ref<ArticleTab>(getInitialTab())
const selectedFeed = ref<string | null>(null)
const feedNames = ref<{ domestic: string[]; international: string[] }>({ domestic: [], international: [] })
const articles = ref<Article[]>([])
const pending = ref(false)
const currentPage = ref(1)
const totalCount = ref(0)
const PAGE_SIZE = 21

const tabs: Array<{ label: string; value: ArticleTab }> = [
  { label: '기술 블로그', value: 'domestic' },
  { label: '아티클', value: 'international' },
]

const currentFeedNames = computed(() =>
  activeTab.value === 'domestic' ? feedNames.value.domestic : feedNames.value.international,
)

async function fetchFeeds() {
  try {
    const res = await $fetch<{ data: { domestic: string[]; international: string[] } }>('/api/articles/feeds')
    feedNames.value = res.data
  } catch { /* 필터 목록 로드 실패 시 숨김 */ }
}

async function fetchArticles() {
  pending.value = true
  try {
    const res = await $fetch<{ data: Article[]; total: number; page: number }>('/api/articles', {
      query: {
        category: activeTab.value,
        page: currentPage.value,
        limit: PAGE_SIZE,
        ...(selectedFeed.value ? { feedName: selectedFeed.value } : {}),
      },
    })
    articles.value = res.data
    totalCount.value = res.total
  } catch {
    toast.error('아티클을 불러오지 못했어요')
  } finally {
    pending.value = false
  }
}

function selectTab(tab: ArticleTab) {
  activeTab.value = tab
  selectedFeed.value = null
  currentPage.value = 1
  router.replace({ query: { category: tab } })
}

function selectFeed(name: string | null) {
  selectedFeed.value = name
  currentPage.value = 1
}

function goPage(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const bookmarkPending = ref<Set<string>>(new Set())

async function toggleBookmark(article: Article) {
  if (!authStore.isLoggedIn) {
    toast.error('로그인 후 이용할 수 있어요')
    return
  }
  if (bookmarkPending.value.has(article.id)) return
  bookmarkPending.value = new Set([...bookmarkPending.value, article.id])
  const prev = article.isBookmarked
  article.isBookmarked = !prev
  try {
    const res = await $fetch<{ data: { isBookmarked: boolean } }>(
      `/api/articles/${article.id}/bookmarks`,
      { method: 'POST' },
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
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

watch(activeTab, fetchArticles)
watch(currentPage, fetchArticles)
watch(selectedFeed, fetchArticles)

onMounted(() => {
  fetchFeeds()
  fetchArticles()
})
</script>

<template>
  <div class="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-10">
    <h1 class="mb-6 text-2xl font-black text-foreground">아티클</h1>

    <!-- 탭 -->
    <div class="mb-6 flex gap-1 border-b border-border">
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

    <div class="flex gap-8">
      <!-- ── 왼쪽 사이드바 필터 (데스크탑) ── -->
      <aside v-if="currentFeedNames.length > 0" class="hidden w-48 shrink-0 lg:block">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">출처</p>
        <ul class="space-y-0.5">
          <!-- 전체 -->
          <li>
            <button
              type="button"
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="
                selectedFeed === null
                  ? 'bg-accent font-semibold text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              "
              @click="selectFeed(null)"
            >
              <span
                class="size-2 shrink-0 rounded-full"
                style="background-color: #6B7280"
              />
              전체
            </button>
          </li>
          <!-- 개별 출처 -->
          <li v-for="name in currentFeedNames" :key="name">
            <button
              type="button"
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="
                selectedFeed === name
                  ? 'bg-accent font-semibold text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              "
              @click="selectFeed(name)"
            >
              <span
                class="size-2 shrink-0 rounded-full"
                :style="{ backgroundColor: getBrandColor(name) }"
              />
              {{ shortName(name) }}
            </button>
          </li>
        </ul>
      </aside>

      <!-- ── 메인 영역 ── -->
      <div class="min-w-0 flex-1">
        <!-- 모바일 칩 필터 -->
        <div v-if="currentFeedNames.length > 0" class="mb-5 flex flex-wrap gap-2 lg:hidden">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            :class="selectedFeed === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'"
            @click="selectFeed(null)"
          >
            전체
          </button>
          <button
            v-for="name in currentFeedNames"
            :key="name"
            type="button"
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            :class="selectedFeed === name ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'"
            @click="selectFeed(name)"
          >
            <span
              class="size-1.5 rounded-full"
              :style="{ backgroundColor: selectedFeed === name ? 'white' : getBrandColor(name) }"
            />
            {{ shortName(name) }}
          </button>
        </div>

        <!-- 로딩 -->
        <div v-if="pending" class="flex justify-center py-20">
          <Loader2 class="size-6 animate-spin text-muted-foreground" />
        </div>

        <!-- 카드 그리드 -->
        <div v-else-if="articles.length > 0">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="article in articles"
              :key="article.id"
              class="group relative flex flex-col rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
            >
              <a
                :href="article.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-1 flex-col gap-2 p-5 pr-10"
              >
                <!-- 브랜드 컬러 뱃지 -->
                <span
                  class="w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  :style="{
                    backgroundColor: getBrandColor(article.feedName) + '18',
                    color: getBrandColor(article.feedName),
                  }"
                >
                  {{ shortName(article.feedName) }}
                </span>

                <p class="line-clamp-2 text-sm font-bold leading-snug text-foreground group-hover:text-primary">
                  {{ article.title }}
                </p>

                <p v-if="article.summary" class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {{ article.summary }}
                </p>
              </a>

              <div class="flex items-center justify-between border-t border-border px-5 py-3">
                <span class="text-xs text-muted-foreground">{{ formatDate(article.publishedAt) }}</span>
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

          <div class="mt-6">
            <Pagination
              v-if="totalPages > 1"
              :current="currentPage"
              :total="totalPages"
              @change="goPage"
            />
          </div>
        </div>

        <AppEmptyState
          v-else
          title="아직 수집된 아티클이 없어요"
          description="곧 최신 기술 블로그 글이 올라올 예정이에요."
        />
      </div>
    </div>
  </div>
</template>
