<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PenLine } from '@lucide/vue'
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
  createdAt: string
}

const posts = ref<Post[]>([])
const currentPosts = computed(() => posts.value)

async function fetchPosts() {
  if (activeTab.value === 'feedback' && !authStore.isLoggedIn) {
    posts.value = []
    return
  }

  pending.value = true
  try {
    const query: Record<string, string> = { category: activeTab.value }
    if (activeTab.value === 'feedback' && feedbackJobType.value !== 'all') {
      query.jobType = feedbackJobType.value
    }
    const res = await $fetch<{ data: Post[] }>('/api/posts', { query })
    posts.value = res.data
  } catch (e: unknown) {
    const error = e as { data?: { statusMessage?: string } }
    posts.value = []
    toast.error(error.data?.statusMessage ?? '게시글을 불러오지 못했어요')
  } finally {
    pending.value = false
  }
}

onMounted(fetchPosts)
watch(activeTab, () => {
  feedbackJobType.value = 'all'
  fetchPosts()
})
watch(feedbackJobType, fetchPosts)

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

    <!-- 피드백 서브 탭 (개발자/디자이너) -->
    <div
      v-if="activeTab === 'feedback' && authStore.isLoggedIn"
      class="mt-4 flex gap-2"
    >
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

    <!-- 피드백 탭 비로그인 안내 -->
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

    <!-- 게시글 목록 -->
    <div v-else class="mt-6">
      <div v-if="pending" class="flex justify-center py-16">
        <div class="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
      <div v-else-if="currentPosts.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <PostCard
          v-for="post in currentPosts"
          :id="post.id"
          :key="post.id"
          :category="post.category"
          :title="post.title"
          :excerpt="post.excerpt"
          :author="post.author"
          :comment-count="post.commentCount"
          :like-count="post.likeCount"
          :created-at="post.createdAt"
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
