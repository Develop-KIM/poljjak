<script setup lang="ts">
import { ref, computed } from 'vue'
import { PenLine } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const activeTab = ref('project')
const showLoginModal = ref(false)
const loginContext = ref('계속하기')

const tabs = [
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
  createdAt: string
}

const feedbackPosts: Post[] = [
  {
    id: '1',
    category: '피드백',
    title: '신입 프론트엔드 포트폴리오 피드백 부탁드려요',
    excerpt:
      '2년 동안 공부해서 드디어 첫 포트폴리오를 완성했는데, 실무자분들 시각에서 봐주시면 정말 감사할 것 같아요.',
    author: '김개발',
    commentCount: 15,
    likeCount: 31,
    createdAt: '2시간 전',
  },
  {
    id: '2',
    category: '피드백',
    title: 'UX/UI 디자이너 취준 포트폴리오 피드백 요청드립니다',
    excerpt: '케이스 스터디 위주로 구성했는데, 전반적인 흐름이 자연스러운지 봐주세요.',
    author: '이디자인',
    commentCount: 8,
    likeCount: 14,
    createdAt: '4시간 전',
  },
  {
    id: '3',
    category: '피드백',
    title: '백엔드 1년차 이직 포트폴리오 봐주세요',
    excerpt:
      'Spring Boot, PostgreSQL 기반 프로젝트들인데 성과 표현이 너무 기술 나열인 것 같아 걱정돼요.',
    author: '박백엔드',
    commentCount: 6,
    likeCount: 9,
    createdAt: '어제',
  },
]

const projectPosts: Post[] = [
  {
    id: '4',
    category: '프로젝트 모집',
    title: '포트폴리오 리뷰 플랫폼 MVP 같이 만들 프론트엔드 구해요',
    excerpt: 'Next.js + TypeScript 스택, 주 2회 온라인 미팅, 3개월 프로젝트예요.',
    author: '최기획',
    commentCount: 4,
    likeCount: 12,
    createdAt: '3시간 전',
  },
  {
    id: '5',
    category: '프로젝트 모집',
    title: '소셜 커머스 앱 Flutter 개발 팀원 모집 (디자이너 + 백엔드)',
    excerpt: '크로스플랫폼 앱 개발합니다. 포트폴리오 프로젝트로 삼기 좋아요.',
    author: '정모바일',
    commentCount: 11,
    likeCount: 23,
    createdAt: '1일 전',
  },
  {
    id: '6',
    category: '프로젝트 모집',
    title: '개발자 매칭 플랫폼 기획부터 함께 할 분 구합니다',
    excerpt: '사이드 프로젝트로 꾸준히 이어갈 수 있는 분이면 좋겠어요. 경력 무관.',
    author: '한풀스택',
    commentCount: 7,
    likeCount: 18,
    createdAt: '2일 전',
  },
]

const studyPosts: Post[] = [
  {
    id: '7',
    category: '스터디 모집',
    title: '주니어 개발자 포트폴리오 주 1회 피드백 스터디',
    excerpt: '매주 서로의 포트폴리오를 리뷰하고 피드백을 주고받는 스터디예요. 5인 이하로 운영해요.',
    author: '장스터디',
    commentCount: 7,
    likeCount: 18,
    createdAt: '2일 전',
  },
  {
    id: '8',
    category: '스터디 모집',
    title: 'React + TypeScript 실무 패턴 심화 스터디 (4주)',
    excerpt: '상태 관리, 컴포넌트 설계, 성능 최적화 중심으로 진행해요. 주 1회 온라인.',
    author: '윤프론트',
    commentCount: 9,
    likeCount: 27,
    createdAt: '3일 전',
  },
  {
    id: '9',
    category: '스터디 모집',
    title: '알고리즘 + CS 면접 준비 스터디 모집 (6주)',
    excerpt: '코딩 테스트 + 기술 면접 동시에 준비해요. 매주 2~3문제씩 풀고 리뷰합니다.',
    author: '문알고',
    commentCount: 13,
    likeCount: 34,
    createdAt: '4일 전',
  },
]

const currentPosts = computed(() => {
  if (activeTab.value === 'feedback') return feedbackPosts
  if (activeTab.value === 'project') return projectPosts
  return studyPosts
})

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
    <div v-else class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
  </div>

  <LoginModal :open="showLoginModal" :context="loginContext" @close="showLoginModal = false" />
</template>
