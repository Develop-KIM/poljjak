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
const likeCount = ref(0)

const post = ref<null | {
  id: string
  category: string
  title: string
  body: string
  author: string
  authorInitial: string
  createdAt: string
  commentCount: number
}>(null)

interface Comment {
  id: number
  author: string
  initial: string
  content: string
  createdAt: string
}

const comments = ref<Comment[]>([])

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

    <!-- 게시글 없음 -->
    <AppEmptyState
      v-if="!post"
      title="게시글을 찾을 수 없어요"
      description="삭제되었거나 존재하지 않는 게시글이에요."
    />

    <!-- 게시글 -->
    <template v-else>
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
    </template>
  </div>

  <ShareLinkDialog :open="showShareDialog" @close="showShareDialog = false" />
  <ReportDialog :open="showReportDialog" @close="showReportDialog = false" />
  <LoginModal :open="showLoginModal" :context="loginContext" @close="showLoginModal = false" />
</template>
