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
  { label: '국내', value: 'domestic' },
  { label: '해외', value: 'international' },
]

const currentFeedNames = computed(() =>
  activeTab.value === 'domestic' ? feedNames.value.domestic : feedNames.value.international,
)

async function fetchFeeds() {
  try {
    const res = await $fetch<{ data: { domestic: string[]; international: string[] } }>('/api/articles/feeds')
    feedNames.value = res.data
  } catch {
    // 피드 목록 로드 실패 시 필터 숨김
  }
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

function toggleFeed(name: string) {
  selectedFeed.value = selectedFeed.value === name ? null : name
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

    <!-- 국내/해외 탭 -->
    <div class="mb-4 flex gap-1 border-b border-border">
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

    <!-- 기업 필터 칩 (국내일 때만) -->
    <div v-if="currentFeedNames.length > 0" class="mb-6 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
        :class="
          selectedFeed === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
        "
        @click="toggleFeed(selectedFeed ?? '')"
      >
        전체
      </button>
      <button
        v-for="name in currentFeedNames"
        :key="name"
        type="button"
        class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
        :class="
          selectedFeed === name
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
        "
        @click="toggleFeed(name)"
      >
        {{ name.replace(' 기술 블로그', '').replace(' Tech Blog', '') }}
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="pending" class="flex justify-center py-20">
      <Loader2 class="size-6 animate-spin text-muted-foreground" />
    </div>

    <!-- 목록 -->
    <div v-else-if="articles.length > 0">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="article in articles"
          :key="article.id"
          class="group relative flex flex-col rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
        >
          <!-- 카드 본문 -->
          <a
            :href="article.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-1 flex-col gap-2 p-5 pr-10"
          >
            <!-- 출처 배지 -->
            <span class="w-fit rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {{ article.feedName }}
            </span>

            <!-- 제목 -->
            <p class="line-clamp-2 text-sm font-bold leading-snug text-foreground group-hover:text-primary">
              {{ article.title }}
            </p>

            <!-- 요약 -->
            <p v-if="article.summary" class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {{ article.summary }}
            </p>
          </a>

          <!-- 카드 하단: 날짜 + 북마크 -->
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

      <!-- 페이지네이션 -->
      <div class="mt-6">
        <Pagination
          v-if="totalPages > 1"
          :current="currentPage"
          :total="totalPages"
          @change="goPage"
        />
      </div>
    </div>

    <!-- 빈 상태 -->
    <AppEmptyState
      v-else
      title="아직 수집된 아티클이 없어요"
      description="곧 최신 기술 블로그 글이 올라올 예정이에요."
    />
  </div>
</template>
