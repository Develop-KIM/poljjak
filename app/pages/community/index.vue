<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PenLine, Search, X } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'

useSeoMeta({
  title: '커뮤니티',
  description: '피드백, 프로젝트 모집, 스터디 모집 게시판에서 개발자·디자이너와 교류하세요.',
  ogTitle: '커뮤니티 · 폴짝',
  ogDescription: '피드백, 프로젝트 모집, 스터디 모집 게시판에서 개발자·디자이너와 교류하세요.',
  ogUrl: 'https://poljjak.kr/community',
})

const authStore = useAuthStore()
const route = useRoute()
const validTabs = ['feedback', 'project', 'study'] as const
const validSorts = ['latest', 'popular'] as const

type CommunityTab = (typeof validTabs)[number]
type SortType = (typeof validSorts)[number]

function getQueryString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getInitialTab(): CommunityTab {
  const tab = getQueryString(route.query.tab)
  return validTabs.includes(tab as CommunityTab) ? (tab as CommunityTab) : 'project'
}

function getInitialSort(): SortType {
  const sort = getQueryString(route.query.sort)
  return validSorts.includes(sort as SortType) ? (sort as SortType) : 'latest'
}

const initialKeyword = getQueryString(route.query.keyword)?.trim() ?? ''
const initialPage = Number.parseInt(getQueryString(route.query.page) ?? '1', 10)

const activeTab = ref<CommunityTab>(getInitialTab())
const activeSort = ref<SortType>(getInitialSort())
const showLoginModal = ref(false)
const loginContext = ref('계속하기')
const toast = useToastStore()
const pending = ref(true)

const keyword = ref(initialKeyword)
const searchInput = ref(initialKeyword)
const currentPage = ref(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1)
const totalCount = ref(0)
const PAGE_SIZE = 15

const tabs: Array<{ label: string; value: CommunityTab }> = [
  { label: '피드백', value: 'feedback' },
  { label: '프로젝트 모집', value: 'project' },
  { label: '스터디 모집', value: 'study' },
]

type PostCategory = '피드백' | '프로젝트 모집' | '스터디 모집'

interface Post {
  id: string
  category: PostCategory
  title: string
  excerpt: string
  author: string
  commentCount: number
  likeCount: number
  viewCount: number
  recruitmentStatus: 'open' | 'closed' | null
  createdAt: string
  thumbnailUrl?: string | null
  isBookmarked?: boolean
}

const posts = ref<Post[]>([])

/** 각 게시글의 북마크 상태를 로컬에서 관리 (Optimistic UI용) */
const bookmarkStates = ref<Record<string, boolean>>({})

/** 북마크 상태 조회 헬퍼 */
function getBookmarked(postId: string): boolean {
  return bookmarkStates.value[postId] ?? false
}

/** 북마크 토글 (Optimistic UI + 실패 시 롤백) */
async function handleBookmarkToggle(postId: string) {
  // 비로그인이면 로그인 모달 표시
  if (!authStore.isLoggedIn) {
    loginContext.value = '북마크 추가'
    showLoginModal.value = true
    return
  }

  // Optimistic: 즉시 로컬 상태 토글
  const prev = getBookmarked(postId)
  bookmarkStates.value[postId] = !prev

  try {
    const res = await $fetch<{ data: { bookmarked: boolean } }>(`/api/posts/${postId}/bookmarks`, {
      method: 'POST',
    })
    // 서버 응답으로 상태 확정
    bookmarkStates.value[postId] = res.data.bookmarked
  } catch {
    // 실패 시 이전 상태로 롤백
    bookmarkStates.value[postId] = prev
    toast.error('북마크 처리에 실패했어요')
  }
}
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

async function fetchPosts() {
  pending.value = true
  try {
    const query: Record<string, string | number> = {
      category: activeTab.value,
      page: currentPage.value,
    }
    if (keyword.value) query.keyword = keyword.value
    if (activeSort.value === 'popular') query.sort = 'popular'

    const res = await $fetch<{ data: Post[]; total: number; page: number }>('/api/posts', { query })
    posts.value = res.data
    totalCount.value = res.total
    // API 응답에 isBookmarked 포함 시 로컬 상태 초기화
    res.data.forEach((post) => {
      bookmarkStates.value[post.id] = post.isBookmarked ?? false
    })
  } catch (e: unknown) {
    const error = e as { data?: { statusMessage?: string } }
    posts.value = []
    if (import.meta.client) {
      toast.error(error.data?.statusMessage ?? '게시글을 불러오지 못했어요')
    }
  } finally {
    pending.value = false
  }
}

function resetAndFetch() {
  currentPage.value = 1
  fetchPosts()
}

function submitSearch() {
  keyword.value = searchInput.value.trim()
  resetAndFetch()
}

function clearSearch() {
  searchInput.value = ''
  keyword.value = ''
  resetAndFetch()
}

onMounted(fetchPosts)
watch(activeTab, () => {
  activeSort.value = 'latest'
  keyword.value = ''
  searchInput.value = ''
  resetAndFetch()
})
watch(activeSort, resetAndFetch)

function handleTabChange(value: string) {
  if (!validTabs.includes(value as CommunityTab)) return
  activeTab.value = value as CommunityTab
}

const TAB_CATEGORY_MAP: Record<string, string> = {
  feedback: '피드백',
  project: '프로젝트 모집',
  study: '스터디 모집',
}

function handleWrite() {
  if (!authStore.isLoggedIn) {
    loginContext.value = '글쓰기'
    showLoginModal.value = true
    return
  }
  const category = TAB_CATEGORY_MAP[activeTab.value]
  const params = new URLSearchParams({ tab: activeTab.value })
  if (category) params.set('category', category)
  navigateTo(`/community/write?${params.toString()}`)
}

function goPage(p: number) {
  currentPage.value = p
  fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-foreground">커뮤니티</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          포트폴리오 피드백, 프로젝트·스터디 모집까지
        </p>
      </div>
      <AppButton @click="handleWrite">
        <PenLine class="size-4" />
        글쓰기
      </AppButton>
    </div>

    <!-- 탭 -->
    <div class="mt-6">
      <AppTabs :model-value="activeTab" :tabs="tabs" @update:model-value="handleTabChange" />
    </div>

    <!-- 검색 + 정렬 -->
    <div class="mt-5 flex flex-col gap-3">
      <form class="relative" @submit.prevent="submitSearch">
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
      <p v-if="keyword" class="mt-2 text-xs text-muted-foreground">
        "<span class="font-semibold text-foreground">{{ keyword }}</span
        >" 검색 결과 {{ totalCount }}건
      </p>
      <!-- 정렬 -->
      <div class="flex h-10 w-fit overflow-hidden rounded-xl border border-border bg-background">
        <button
          v-for="s in [
            { label: '최신순', value: 'latest' },
            { label: '인기순', value: 'popular' },
          ]"
          :key="s.value"
          type="button"
          class="px-4 text-xs font-medium transition-colors"
          :class="
            activeSort === s.value
              ? 'bg-accent text-primary'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="activeSort = s.value as SortType"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <!-- 게시글 목록 -->
    <div class="mt-4">
      <div v-if="pending" class="flex justify-center py-16">
        <div class="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>

      <div v-else-if="posts.length > 0">
        <PostCard
          v-for="post in posts"
          :id="post.id"
          :key="post.id"
          :category="post.category"
          :title="post.title"
          :excerpt="post.excerpt"
          :author="post.author"
          :comment-count="post.commentCount"
          :like-count="post.likeCount"
          :view-count="post.viewCount"
          :recruitment-status="post.recruitmentStatus"
          :created-at="post.createdAt"
          :thumbnail-url="post.thumbnailUrl"
          :requires-auth="post.category === '피드백' && !authStore.isLoggedIn"
          :show-bookmark="true"
          :is-bookmarked="getBookmarked(post.id)"
          @auth-required="
            () => {
              loginContext = '피드백 보기'
              showLoginModal = true
            }
          "
          @bookmark-toggle="handleBookmarkToggle(post.id)"
        />

        <!-- 페이지네이션 -->
        <Pagination
          v-if="totalPages > 1"
          :current="currentPage"
          :total="totalPages"
          class="mt-6"
          @change="goPage"
        />
      </div>

      <AppEmptyState v-else title="아직 게시글이 없어요" description="첫 번째 글을 작성해보세요.">
        <template #action>
          <AppButton @click="handleWrite">글쓰기</AppButton>
        </template>
      </AppEmptyState>
    </div>
  </div>

  <LoginModal :open="showLoginModal" :context="loginContext" @close="showLoginModal = false" />
</template>
