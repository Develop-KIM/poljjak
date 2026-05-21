<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Heart,
  MessageSquare,
  Share2,
  Flag,
  Send,
  ArrowLeft,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
} from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import type { AnalysisResult } from '~~/server/utils/clova'

const authStore = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const id = route.params.id as string

const showLoginModal = ref(false)
const loginContext = ref('계속하기')
const showReportDialog = ref(false)
const pending = ref(true)
const error = ref<string | null>(null)

const liked = ref(false)
const likeCount = ref(0)
const showScores = ref(false)
const liking = ref(false)

const editing = ref(false)
const editTitle = ref('')
const editBody = ref('')
const editImageUrls = ref<string[]>([])
const editShowScores = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)

interface AnalysisEmbed {
  id: string
  result: AnalysisResult
}

interface PostDetail {
  id: string
  category: string
  title: string
  body: string
  author: string
  authorInitial: string
  authorAvatarUrl: string | null
  viewCount: number
  createdAt: string
  commentCount: number
  likeCount: number
  authorId: string
  isOwner: boolean
  isLiked: boolean
  analysisId?: string | null
  analysis?: AnalysisEmbed | null
  imageUrls?: string[]
}

const categoryTabMap: Record<string, string> = {
  피드백: 'feedback',
  '프로젝트 모집': 'project',
  '스터디 모집': 'study',
}

const backLink = computed(() => {
  if (!post.value) return '/community'
  const tab = categoryTabMap[post.value.category] ?? 'project'
  return `/community?tab=${tab}`
})

const canSaveEdit = computed(() => editTitle.value.trim().length > 0)

const isFromAnalysis = computed(() => !!post.value?.analysisId)
const editBodyLabel = computed(() =>
  post.value?.category === '피드백' && !isFromAnalysis.value ? '피드백 내용' : '본문'
)

const post = ref<PostDetail | null>(null)
const analysisEmbed = ref<AnalysisEmbed | null>(null)

useSeoMeta({
  title: () => post.value?.title ?? '커뮤니티 게시글',
  description: () => post.value?.body?.slice(0, 150) ?? '폴짝 커뮤니티 게시글',
  ogTitle: () => post.value?.title ?? '커뮤니티 게시글',
  ogDescription: () => post.value?.body?.slice(0, 150) ?? '폴짝 커뮤니티 게시글',
  ogUrl: `https://poljjak.kr/community/${id}`,
})

onMounted(async () => {
  try {
    const res = await $fetch<{ data: PostDetail }>(`/api/posts/${id}`)
    post.value = res.data
    likeCount.value = res.data.likeCount
    liked.value = res.data.isLiked
    analysisEmbed.value = res.data.analysis ?? null
  } catch (e: unknown) {
    const err = e as { data?: { statusCode?: number; statusMessage?: string } }
    error.value = err.data?.statusMessage ?? '게시글을 불러오지 못했어요'
    if (err.data?.statusCode === 401) {
      loginContext.value = '피드백 보기'
      showLoginModal.value = true
    }
  } finally {
    pending.value = false
  }

  $fetch(`/api/posts/${id}/views`, { method: 'POST' }).catch(() => {})
  fetchComments()
})

interface CommentReply {
  id: string
  author: string
  authorInitial: string
  authorAvatarUrl: string | null
  content: string
  createdAt: string
  isOwner: boolean
  mentionNickname: string | null
}

interface Comment extends CommentReply {
  isDeleted: boolean
  replies: CommentReply[]
}

interface ReplyTarget {
  parentId: string
  mentionNickname: string
}

const comments = ref<Comment[]>([])
const commentsPending = ref(false)
const submittingComment = ref(false)

const replyTarget = ref<ReplyTarget | null>(null)
const replyContent = ref('')
const submittingReply = ref(false)

const totalCommentCount = computed(() =>
  comments.value.reduce((sum, c) => sum + 1 + c.replies.length, 0)
)

async function fetchComments() {
  commentsPending.value = true
  try {
    const res = await $fetch<{ data: Comment[] }>(`/api/posts/${id}/comments`)
    comments.value = res.data
  } catch {
    // 댓글 로드 실패는 조용히 무시
  } finally {
    commentsPending.value = false
  }
}

function openReply(parentId: string, mentionNickname: string) {
  if (!authStore.isLoggedIn) {
    loginContext.value = '답글 달기'
    showLoginModal.value = true
    return
  }
  replyTarget.value = { parentId, mentionNickname }
  replyContent.value = ''
}

function closeReply() {
  replyTarget.value = null
  replyContent.value = ''
}

function renderBody(raw: string): string {
  const escaped = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 break-all hover:opacity-80">$1</a>'
  )
  return linked.replace(/\n/g, '<br>')
}

async function toggleLike() {
  if (!authStore.isLoggedIn) {
    loginContext.value = '좋아요 누르기'
    showLoginModal.value = true
    return
  }
  if (liking.value) return
  liking.value = true
  try {
    const res = await $fetch<{ data: { liked: boolean } }>(`/api/posts/${id}/likes`, {
      method: 'POST',
    })
    liked.value = res.data.liked
    likeCount.value += res.data.liked ? 1 : -1
  } catch {
    toast.error('좋아요 처리에 실패했어요')
  } finally {
    liking.value = false
  }
}

const dmPending = ref(false)

async function handleDM() {
  if (!authStore.isLoggedIn) {
    loginContext.value = 'DM 보내기'
    showLoginModal.value = true
    return
  }
  if (!post.value || dmPending.value) return
  dmPending.value = true
  try {
    const res = await $fetch<{ data: { id: string } }>('/api/chats', {
      method: 'POST',
      body: {
        targetUserId: post.value.authorId,
        sourcePostId: post.value.id,
        sourcePostTitle: post.value.title,
      },
    })
    await navigateTo(`/chat?roomId=${res.data.id}`)
  } catch {
    toast.error('채팅방을 열 수 없어요')
  } finally {
    dmPending.value = false
  }
}

async function handleComment(content: string) {
  if (submittingComment.value) return
  submittingComment.value = true
  try {
    const res = await $fetch<{ data: Comment }>(`/api/posts/${id}/comments`, {
      method: 'POST',
      body: { content },
    })
    comments.value.push({ ...res.data, replies: [] })
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '댓글 등록에 실패했어요')
  } finally {
    submittingComment.value = false
  }
}

async function submitReply() {
  if (!replyTarget.value || !replyContent.value.trim() || submittingReply.value) return
  submittingReply.value = true
  try {
    const res = await $fetch<{ data: CommentReply }>(`/api/posts/${id}/comments`, {
      method: 'POST',
      body: {
        content: replyContent.value.trim(),
        parentId: replyTarget.value.parentId,
        mentionNickname: replyTarget.value.mentionNickname,
      },
    })
    const parent = comments.value.find((c) => c.id === replyTarget.value!.parentId)
    if (parent) parent.replies.push(res.data)
    closeReply()
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '답글 등록에 실패했어요')
  } finally {
    submittingReply.value = false
  }
}

async function deleteComment(commentId: string, parentId?: string) {
  try {
    await $fetch(`/api/posts/${id}/comments/${commentId}`, { method: 'DELETE' })
    if (parentId) {
      // 대댓글: 목록에서 완전 제거
      const parent = comments.value.find((c) => c.id === parentId)
      if (parent) parent.replies = parent.replies.filter((r) => r.id !== commentId)
    } else {
      // 최상위 댓글: 대댓글이 있으면 삭제 표시만, 없으면 제거
      const target = comments.value.find((c) => c.id === commentId)
      if (target) {
        if (target.replies.length > 0) {
          target.isDeleted = true
          target.content = ''
          target.isOwner = false
        } else {
          comments.value = comments.value.filter((c) => c.id !== commentId)
        }
      }
    }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '댓글 삭제에 실패했어요')
  }
}

function startEdit() {
  if (!post.value) return
  editTitle.value = post.value.title
  editBody.value = post.value.body
  editImageUrls.value = [...(post.value.imageUrls ?? [])]
  editing.value = true
}

async function saveEdit() {
  if (!canSaveEdit.value || saving.value) return
  saving.value = true
  try {
    await $fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      body: {
        title: editTitle.value.trim(),
        body: editBody.value.trim(),
        imageUrls: editImageUrls.value,
      },
    })
    if (post.value) {
      post.value.title = editTitle.value.trim()
      post.value.body = editBody.value.trim()
      post.value.imageUrls = [...editImageUrls.value]
    }
    editing.value = false
    toast.success('게시글이 수정됐어요')
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '수정에 실패했어요')
  } finally {
    saving.value = false
  }
}

async function copyLink() {
  await navigator.clipboard.writeText(window.location.href)
  toast.success('링크가 복사됐어요')
}

async function deletePost() {
  if (deleting.value) return
  deleting.value = true
  try {
    await $fetch(`/api/posts/${id}`, { method: 'DELETE' })
    toast.success('게시글이 삭제됐어요')
    navigateTo(backLink.value)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '삭제에 실패했어요')
    deleting.value = false
    showDeleteConfirm.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-10">
    <!-- 뒤로가기 -->
    <NuxtLink
      :to="backLink"
      class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="size-4" />
      뒤로가기
    </NuxtLink>

    <!-- 로딩 -->
    <div v-if="pending" class="flex justify-center py-20">
      <div class="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
    </div>

    <!-- 에러 -->
    <AppEmptyState
      v-else-if="error || !post"
      :title="error ?? '게시글을 찾을 수 없어요'"
      description="삭제되었거나 존재하지 않는 게시글이에요."
    />

    <!-- 게시글 -->
    <template v-else>
      <!-- ── 수정 모드 ── -->
      <template v-if="editing">
        <!-- 분석 기반: 2열 (분석 결과 + 폼) -->
        <template v-if="isFromAnalysis && analysisEmbed?.result">
          <div class="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <!-- 좌: 분석 결과 -->
            <div class="rounded-xl border border-primary/20 bg-accent/30 p-5">
              <div class="mb-4 flex items-center gap-2">
                <AppBadge variant="green">AI 분석 결과</AppBadge>
              </div>
              <AppCard>
                <h3 class="text-sm font-black text-foreground">종합 피드백</h3>
                <p class="mt-2 text-sm leading-7 text-muted-foreground">
                  {{ analysisEmbed.result.summary }}
                </p>
              </AppCard>
              <div class="mt-4 grid gap-3">
                <BeforeAfterBlock
                  v-for="(s, i) in analysisEmbed.result.suggestions"
                  :key="i"
                  :category="s.category"
                  :context="s.context"
                  :before="s.before"
                  :after="s.after"
                />
              </div>
              <button
                type="button"
                class="mt-4 flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-foreground hover:bg-muted"
                @click="editShowScores = !editShowScores"
              >
                항목별 점수 보기
                <ChevronDown
                  class="size-4 text-muted-foreground transition-transform"
                  :class="{ 'rotate-180': editShowScores }"
                />
              </button>
              <div v-if="editShowScores" class="mt-3 grid auto-rows-fr gap-3 md:grid-cols-2">
                <AnalysisScoreCard
                  v-for="score in analysisEmbed.result.scores"
                  :key="score.title"
                  :title="score.title"
                  :score="score.score"
                  :comment="score.comment"
                  :improvement="score.improvement"
                />
              </div>
            </div>

            <!-- 우: 폼 -->
            <div class="grid gap-5">
              <div>
                <label class="text-sm font-bold text-foreground">제목</label>
                <AppInput v-model="editTitle" placeholder="제목을 입력해주세요" class="mt-2" />
              </div>
              <div>
                <label class="text-sm font-bold text-foreground">
                  추가로 하고 싶은 말
                  <span class="ml-1 font-normal text-muted-foreground">(선택)</span>
                </label>
                <AppTextarea
                  v-model="editBody"
                  placeholder="특별히 봐줬으면 하는 부분이나 궁금한 점을 적어주세요."
                  :rows="6"
                  :maxlength="5000"
                  :show-count="true"
                  class="mt-2"
                />
              </div>
              <div class="flex gap-3">
                <AppButton variant="outline" class="flex-1" @click="editing = false"
                  >취소</AppButton
                >
                <AppButton
                  class="flex-1"
                  :disabled="!canSaveEdit"
                  :loading="saving"
                  @click="saveEdit"
                >
                  저장
                </AppButton>
              </div>
            </div>
          </div>
        </template>

        <!-- 커뮤니티 직접 작성: 단일 컬럼 -->
        <template v-else>
          <div class="grid gap-5">
            <div>
              <label class="text-sm font-bold text-foreground">제목</label>
              <AppInput v-model="editTitle" placeholder="제목을 입력해주세요" class="mt-2" />
            </div>
            <PostImageUploader v-model="editImageUrls" />
            <div>
              <label class="text-sm font-bold text-foreground">{{ editBodyLabel }}</label>
              <AppTextarea
                v-model="editBody"
                placeholder="내용을 입력해주세요."
                :rows="12"
                :maxlength="5000"
                :show-count="true"
                class="mt-2"
              />
            </div>
            <div class="flex gap-3">
              <AppButton variant="outline" class="flex-1" @click="editing = false">취소</AppButton>
              <AppButton
                class="flex-1"
                :disabled="!canSaveEdit"
                :loading="saving"
                @click="saveEdit"
              >
                저장
              </AppButton>
            </div>
          </div>
        </template>
      </template>

      <!-- ── 조회 모드 ── -->
      <template v-else>
        <!-- 헤더 -->
        <div>
          <AppBadge variant="blue">{{ post.category }}</AppBadge>
          <h1 class="mt-3 text-2xl font-black leading-tight text-foreground md:text-3xl">
            {{ post.title }}
          </h1>
          <div class="mt-3 flex items-center justify-between gap-4">
            <!-- 작성자 정보 -->
            <div class="flex flex-wrap items-center gap-2">
              <img
                v-if="post.authorAvatarUrl"
                :src="post.authorAvatarUrl"
                alt=""
                class="size-7 rounded-full object-cover"
              />
              <div
                v-else
                class="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
              >
                {{ post.authorInitial }}
              </div>
              <span class="text-sm font-semibold text-foreground">{{ post.author }}</span>
              <span class="text-sm text-muted-foreground">{{ post.createdAt }}</span>
              <span class="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye class="size-3.5" />
                {{ post.viewCount.toLocaleString() }}
              </span>
            </div>
            <!-- 액션 버튼 -->
            <div class="flex shrink-0 items-center gap-2">
              <template v-if="post.isOwner">
                <AppButton variant="outline" size="sm" @click="startEdit">
                  <Pencil class="size-3.5" />
                  수정
                </AppButton>
                <AppButton
                  variant="outline"
                  size="sm"
                  class="text-destructive hover:border-destructive hover:bg-destructive/10"
                  @click="showDeleteConfirm = true"
                >
                  <Trash2 class="size-3.5" />
                  삭제
                </AppButton>
              </template>
              <AppButton v-else variant="outline" size="sm" :loading="dmPending" @click="handleDM">
                <Send class="size-3.5" />
                1:1 채팅
              </AppButton>
            </div>
          </div>
        </div>

        <!-- 분석 결과 임베드 -->
        <div
          v-if="analysisEmbed?.result"
          class="mt-6 rounded-xl border border-primary/20 bg-accent/30 p-5"
        >
          <div class="mb-4 flex items-center gap-2">
            <AppBadge variant="green">AI 분석 결과</AppBadge>
          </div>

          <AppCard>
            <h3 class="text-sm font-black text-foreground">종합 피드백</h3>
            <p class="mt-2 text-sm leading-7 text-muted-foreground">
              {{ analysisEmbed.result.summary }}
            </p>
          </AppCard>

          <div class="mt-4 grid gap-3">
            <BeforeAfterBlock
              v-for="(s, i) in analysisEmbed.result.suggestions"
              :key="i"
              :category="s.category"
              :context="s.context"
              :before="s.before"
              :after="s.after"
            />
          </div>

          <button
            type="button"
            class="mt-4 flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-foreground hover:bg-muted"
            @click="showScores = !showScores"
          >
            항목별 점수 보기
            <ChevronDown
              class="size-4 text-muted-foreground transition-transform"
              :class="{ 'rotate-180': showScores }"
            />
          </button>
          <div v-if="showScores" class="mt-3 grid auto-rows-fr gap-3 md:grid-cols-2">
            <AnalysisScoreCard
              v-for="score in analysisEmbed.result.scores"
              :key="score.title"
              :title="score.title"
              :score="score.score"
              :comment="score.comment"
              :improvement="score.improvement"
            />
          </div>
        </div>

        <hr v-if="post.body.trim()" class="my-6 border-border" />

        <!-- 이미지 -->
        <PostImageGrid v-if="post.imageUrls?.length" :urls="post.imageUrls" class="mt-6" />

        <!-- 본문 -->
        <!-- eslint-disable vue/no-v-html -->
        <div
          v-if="post.body.trim()"
          class="mt-6 text-base leading-8 text-foreground"
          v-html="renderBody(post.body)"
        />
        <!-- eslint-enable vue/no-v-html -->

        <!-- 액션 바 -->
        <div class="mt-8 flex items-center gap-1 border-b border-t border-border py-4">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
            :class="liked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'"
            @click="toggleLike"
          >
            <Heart class="size-4" :class="{ 'fill-red-500': liked }" />
            {{ likeCount }}
          </button>

          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MessageSquare class="size-4" />
            {{ commentsPending ? post.commentCount : totalCommentCount }}
          </button>

          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click="copyLink"
          >
            <Share2 class="size-4" />
            공유
          </button>

          <button
            type="button"
            class="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            @click="
              authStore.isLoggedIn
                ? (showReportDialog = true)
                : ((loginContext = '신고하기'), (showLoginModal = true))
            "
          >
            <Flag class="size-4" />
            신고
          </button>
        </div>

        <!-- 댓글 -->
        <section class="mt-8">
          <h2 class="text-base font-black text-foreground">
            댓글
            <span class="text-muted-foreground">
              {{ commentsPending ? post.commentCount : totalCommentCount }}
            </span>
          </h2>

          <!-- 댓글 로딩 -->
          <div v-if="commentsPending" class="mt-5 flex justify-center py-8">
            <div class="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>

          <div v-else class="mt-5 grid gap-6">
            <p v-if="comments.length === 0" class="py-4 text-center text-sm text-muted-foreground">
              첫 번째 댓글을 남겨보세요.
            </p>

            <div v-for="comment in comments" :key="comment.id">
              <!-- 최상위 댓글 -->
              <div class="flex gap-3">
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
                  :class="{ 'opacity-40': comment.isDeleted }"
                >
                  <template v-if="!comment.isDeleted && comment.authorAvatarUrl">
                    <img
                      :src="comment.authorAvatarUrl"
                      alt=""
                      class="h-full w-full rounded-full object-cover"
                    />
                  </template>
                  <template v-else>{{ comment.isDeleted ? '?' : comment.authorInitial }}</template>
                </div>
                <div class="flex-1">
                  <template v-if="comment.isDeleted">
                    <p class="text-sm italic text-muted-foreground">삭제된 메시지입니다.</p>
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-foreground">{{
                        comment.author
                      }}</span>
                      <span class="text-xs text-muted-foreground">{{ comment.createdAt }}</span>
                      <button
                        v-if="comment.isOwner"
                        type="button"
                        class="ml-auto text-xs text-muted-foreground transition-colors hover:text-destructive"
                        @click="deleteComment(comment.id)"
                      >
                        삭제
                      </button>
                    </div>
                    <p class="mt-1.5 text-sm leading-6 text-foreground">{{ comment.content }}</p>
                  </template>
                  <button
                    type="button"
                    class="mt-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
                    @click="openReply(comment.id, comment.author)"
                  >
                    답글
                  </button>
                </div>
              </div>

              <!-- 답글 입력창 -->
              <div v-if="replyTarget?.parentId === comment.id" class="ml-11 mt-3">
                <div
                  class="flex flex-1 items-start rounded-xl border border-primary bg-background px-3.5 py-3 ring-2 ring-ring/20"
                >
                  <div class="flex-1">
                    <span class="text-xs font-semibold text-primary"
                      >@{{ replyTarget.mentionNickname }}</span
                    >
                    <textarea
                      v-model="replyContent"
                      placeholder="답글을 입력해주세요."
                      rows="1"
                      class="mt-1 block w-full resize-none bg-transparent text-sm leading-5 outline-none placeholder:text-muted-foreground"
                      @keydown.enter.prevent="submitReply"
                      @keydown.esc="closeReply"
                    />
                  </div>
                  <div class="ml-2 flex shrink-0 flex-col gap-1">
                    <AppButton
                      size="sm"
                      :disabled="!replyContent.trim()"
                      :loading="submittingReply"
                      @click="submitReply"
                    >
                      등록
                    </AppButton>
                    <AppButton size="sm" variant="ghost" class="text-xs" @click="closeReply">
                      취소
                    </AppButton>
                  </div>
                </div>
              </div>

              <!-- 답글 목록 (depth 2) -->
              <div v-if="comment.replies.length > 0" class="ml-11 mt-3 grid gap-4">
                <div v-for="reply in comment.replies" :key="reply.id" class="flex gap-3">
                  <img
                    v-if="reply.authorAvatarUrl"
                    :src="reply.authorAvatarUrl"
                    alt=""
                    class="size-7 shrink-0 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
                  >
                    {{ reply.authorInitial }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-foreground">{{ reply.author }}</span>
                      <span class="text-xs text-muted-foreground">{{ reply.createdAt }}</span>
                      <button
                        v-if="reply.isOwner"
                        type="button"
                        class="ml-auto text-xs text-muted-foreground transition-colors hover:text-destructive"
                        @click="deleteComment(reply.id, comment.id)"
                      >
                        삭제
                      </button>
                    </div>
                    <p class="mt-1.5 text-sm leading-6 text-foreground">
                      <span v-if="reply.mentionNickname" class="font-semibold text-primary"
                        >@{{ reply.mentionNickname }}</span
                      >
                      {{ reply.mentionNickname ? ' ' + reply.content : reply.content }}
                    </p>
                    <button
                      type="button"
                      class="mt-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
                      @click="openReply(comment.id, reply.author)"
                    >
                      답글
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <CommentComposer
              :is-logged-in="authStore.isLoggedIn"
              :loading="submittingComment"
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
    </template>
  </div>

  <!-- 삭제 확인 모달 -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="showDeleteConfirm = false"
      >
        <div class="w-full max-w-sm rounded-2xl bg-popover p-6 text-popover-foreground shadow-xl">
          <h3 class="text-lg font-black text-foreground">게시글을 삭제할까요?</h3>
          <p class="mt-2 text-sm text-muted-foreground">삭제한 게시글은 복구할 수 없어요.</p>
          <div class="mt-6 flex gap-3">
            <AppButton variant="outline" class="flex-1" @click="showDeleteConfirm = false">
              취소
            </AppButton>
            <AppButton
              class="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              :loading="deleting"
              @click="deletePost"
            >
              삭제
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ReportDialog
    :open="showReportDialog"
    target-type="post"
    :target-id="post?.id ?? ''"
    @close="showReportDialog = false"
  />
  <LoginModal :open="showLoginModal" :context="loginContext" @close="showLoginModal = false" />
</template>
