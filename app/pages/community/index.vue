<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PenLine, Search, X } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const validTabs = ['feedback', 'project', 'study']
const initialTab = validTabs.includes(route.query.tab as string)
  ? (route.query.tab as string)
  : 'project'
const activeTab = ref(initialTab)
const feedbackJobType = ref<'all' | 'developer' | 'designer'>('all')
const showLoginModal = ref(false)
const loginContext = ref('계속하기')
const toast = useToastStore()
const pending = ref(false)

const keyword = ref('')
const searchInput = ref('')
const currentPage = ref(1)
const totalCount = ref(0)
const PAGE_SIZE = 15

const tabs = [
  { label: '피드백', value: 'feedback' },
  { label: '프로젝트 모집', value: 'project' },
  { label: '스터디 모집', value: 'study' },
]

const feedbackSubTabs = [
  { label: '전체', value: 'all' },
  { label: '개발자', value: 'developer' },
  { label: '디자이너', value: 'designer' },
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
}

const posts = ref<Post[]>([])
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

async function fetchPosts() {
  if (activeTab.value === 'feedback' && !authStore.isLoggedIn) {
    posts.value = []
    return
  }

  pending.value = true
  try {
    const query: Record<string, string | number> = {
      category: activeTab.value,
      page: currentPage.value,
    }
    if (activeTab.value === 'feedback' && feedbackJobType.value !== 'all') {
      query.jobType = feedbackJobType.value
    }
    if (keyword.value) query.keyword = keyword.value

    const res = await $fetch<{ data: Post[]; total: number; page: number }>('/api/posts', { query })
    posts.value = res.data
    totalCount.value = res.total
  } catch (e: unknown) {
    const error = e as { data?: { statusMessage?: string } }
    posts.value = []
    toast.error(error.data?.statusMessage ?? '게시글을 불러오지 못했어요')
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
  feedbackJobType.value = 'all'
  keyword.value = ''
  searchInput.value = ''
  resetAndFetch()
})
watch(feedbackJobType, resetAndFetch)

function handleTabChange(value: string) {
  if (value === 'feedback' && !authStore.isLoggedIn) {
    loginContext.value = '피드백 보기'
    showLoginModal.value = true
    return
  }
  activeTab.value = value
}

function handleWrite() {
  if (!authStore.isLoggedIn) {
    loginContext.value = '글쓰기'
    showLoginModal.value = true
    return
  }
  navigateTo('/community/write')
}

function goPage(p: number) {
  currentPage.value = p
  fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-10">
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

    <!-- 피드백 서브 탭 -->
    <div v-if="activeTab === 'feedback' && authStore.isLoggedIn" class="mt-4 flex gap-2">
      <button
        v-for="sub in feedbackSubTabs"
        :key="sub.value"
        type="button"
        class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
        :class="
          feedbackJobType === sub.value
            ? 'bg-foreground text-background'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        "
        @click="feedbackJobType = sub.value as typeof feedbackJobType"
      >
        {{ sub.label }}
      </button>
    </div>

    <!-- 피드백 비로그인 -->
    <div v-if="activeTab === 'feedback' && !authStore.isLoggedIn" class="mt-10">
      <AppEmptyState
        title="피드백 게시판은 로그인이 필요해요"
        description="로그인하면 포트폴리오 피드백을 요청하고 다른 분들의 피드백을 볼 수 있어요."
      >
        <template #action>
          <AppButton
            @click="
              () => {
                loginContext = '피드백 보기'
                showLoginModal = true
              }
            "
          >
            로그인하기
          </AppButton>
        </template>
      </AppEmptyState>
    </div>

    <template v-else>
      <!-- 검색 -->
      <div class="mt-5">
        <form class="relative flex flex-col gap-2 sm:flex-row" @submit.prevent="submitSearch">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="searchInput"
              type="text"
              placeholder="제목 검색..."
              class="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              v-if="searchInput"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              @click="clearSearch"
            >
              <X class="size-4" />
            </button>
          </div>
          <AppButton type="submit" variant="outline" class="w-full sm:w-auto">검색</AppButton>
        </form>
        <p v-if="keyword" class="mt-2 text-xs text-muted-foreground">
          "<span class="font-semibold text-foreground">{{ keyword }}</span
          >" 검색 결과 {{ totalCount }}건
        </p>
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
    </template>
  </div>

  <LoginModal :open="showLoginModal" :context="loginContext" @close="showLoginModal = false" />
</template>
