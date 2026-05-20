<script setup lang="ts">
import { ref } from 'vue'
import { Heart, MessageSquare, Share2, Flag, Send, ArrowLeft } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const showLoginModal = ref(false)
const loginContext = ref('계속하기')
const showShareDialog = ref(false)
const showReportDialog = ref(false)

const liked = ref(false)
const likeCount = ref(31)

const post = {
  id: '1',
  category: '피드백',
  title: '신입 프론트엔드 포트폴리오 피드백 부탁드려요',
  body: `2년 동안 공부해서 드디어 첫 포트폴리오를 완성했습니다.

실무자분들이나 취업하신 분들 시각에서 봐주시면 정말 감사할 것 같아요.

특히 다음 부분이 걱정됩니다.
- 프로젝트 설명이 너무 기술 나열 위주라 임팩트가 없어 보여요.
- GitHub 링크를 어디에 배치할지 모르겠어요.
- 전체 분량이 너무 많은 건 아닐지...

분석 결과도 첨부했어요: https://poljjak.com/analysis/abc123`,
  author: '김개발',
  authorInitial: '김',
  createdAt: '2026년 5월 21일',
  commentCount: 15,
}

interface Comment {
  id: number
  author: string
  initial: string
  content: string
  createdAt: string
}

const comments = ref<Comment[]>([
  {
    id: 1,
    author: '박리뷰어',
    initial: '박',
    content:
      '프로젝트 설명을 문제-행동-결과 순서로 구성하면 훨씬 설득력 있어 보여요. 특히 수치를 활용하면 좋겠어요.',
    createdAt: '1시간 전',
  },
  {
    id: 2,
    author: '이멘토',
    initial: '이',
    content:
      'GitHub 링크는 각 프로젝트 카드 안에 배치하는 게 자연스러워요. 전체 분량은 A4 기준 2~3장이 적당합니다.',
    createdAt: '30분 전',
  },
])

// XSS 방지 후 URL 링크화 + 줄바꿈 처리
function renderBody(raw: string): string {
  const escaped = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 break-all hover:opacity-80">$1</a>'
  )
  return linked.replace(/\n/g, '<br>')
}

function toggleLike() {
  if (!authStore.isLoggedIn) {
    loginContext.value = '좋아요 누르기'
    showLoginModal.value = true
    return
  }
  liked.value = !liked.value
  likeCount.value += liked.value ? 1 : -1
}

function handleDM() {
  if (!authStore.isLoggedIn) {
    loginContext.value = 'DM 보내기'
    showLoginModal.value = true
    return
  }
  navigateTo('/chat')
}

function handleComment(content: string) {
  comments.value.push({
    id: Date.now(),
    author: '나',
    initial: '나',
    content,
    createdAt: '방금',
  })
}
</script>

<template>
  <div class="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-10">
    <!-- 뒤로가기 -->
    <NuxtLink
      to="/community"
      class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="size-4" />
      커뮤니티
    </NuxtLink>

    <!-- 게시글 헤더 -->
    <div>
      <AppBadge variant="blue">{{ post.category }}</AppBadge>
      <h1 class="mt-3 text-2xl font-black leading-tight text-foreground md:text-3xl">
        {{ post.title }}
      </h1>
      <div class="mt-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div
            class="flex size-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700"
          >
            {{ post.authorInitial }}
          </div>
          <span class="text-sm font-semibold text-foreground">{{ post.author }}</span>
          <span class="text-sm text-muted-foreground">{{ post.createdAt }}</span>
        </div>
        <!-- DM 보내기 -->
        <AppButton variant="outline" size="sm" @click="handleDM">
          <Send class="size-3.5" />
          DM 보내기
        </AppButton>
      </div>
    </div>

    <hr class="my-6 border-border" />

    <!-- 본문 -->
    <div class="text-base leading-8 text-foreground" v-html="renderBody(post.body)" />

    <!-- 액션 바 -->
    <div class="mt-8 flex items-center gap-2 border-t border-b border-border py-4">
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
        :class="
          liked
            ? 'bg-red-50 text-red-500'
            : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
        "
        @click="toggleLike"
      >
        <Heart class="size-4" :class="{ 'fill-red-500': liked }" />
        {{ likeCount }}
      </button>

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
      >
        <MessageSquare class="size-4" />
        {{ post.commentCount }}
      </button>

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
        @click="showShareDialog = true"
      >
        <Share2 class="size-4" />
        공유
      </button>

      <button
        type="button"
        class="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-100 hover:text-destructive"
        @click="showReportDialog = true"
      >
        <Flag class="size-4" />
        신고
      </button>
    </div>

    <!-- 댓글 -->
    <section class="mt-8">
      <h2 class="text-base font-black text-foreground">
        댓글 <span class="text-muted-foreground">{{ comments.length }}</span>
      </h2>

      <div class="mt-5 grid gap-5">
        <div v-for="comment in comments" :key="comment.id" class="flex gap-3">
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700"
          >
            {{ comment.initial }}
          </div>
          <div class="flex-1">
            <div class="flex items-baseline gap-2">
              <span class="text-sm font-semibold text-foreground">{{ comment.author }}</span>
              <span class="text-xs text-muted-foreground">{{ comment.createdAt }}</span>
            </div>
            <p class="mt-1.5 text-sm leading-6 text-foreground">{{ comment.content }}</p>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <CommentComposer
          :is-logged-in="authStore.isLoggedIn"
          @submit="handleComment"
          @open-login="
            () => {
              loginContext = '댓글 달기'
              showLoginModal = true
            }
          "
        />
      </div>
    </section>
  </div>

  <ShareLinkDialog :open="showShareDialog" @close="showShareDialog = false" />
  <ReportDialog :open="showReportDialog" @close="showReportDialog = false" />
  <LoginModal :open="showLoginModal" :context="loginContext" @close="showLoginModal = false" />
</template>
