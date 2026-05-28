<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, resolveComponent } from 'vue'
import {
  Camera,
  Clock,
  Lock,
  Unlock,
  Heart,
  MessageSquare,
  ArrowUpRight,
  Pencil,
  Check,
  X,
  Loader2,
  Trash2,
} from '@lucide/vue'

const RECENT_KEY = 'poljjak_recent_articles'

interface RecentArticle {
  id: string
  title: string
  url: string
  feedName: string
  publishedAt: string
  visitedAt: string
}

definePageMeta({ middleware: 'auth' })

const showWithdrawDialog = ref(false)
const withdrawing = ref(false)
const authStore = useAuthStore()
const toast = useToastStore()
const { signOut } = useAuth()

// ── 프로필 수정 ──────────────────────────────────────────
const editMode = ref(false)
const editNickname = ref('')
const editJobType = ref<'developer' | 'designer' | null>(null)
const editAvatarPreview = ref<string | null>(null)
const editAvatarFile = ref<File | null>(null)
const saving = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,15}$/
type NicknameCheckState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
const nicknameCheckState = ref<NicknameCheckState>('idle')
const nicknameCheckTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const nicknameHint = computed(() => {
  switch (nicknameCheckState.value) {
    case 'available':
      return '사용할 수 있는 닉네임이에요'
    case 'taken':
      return '이미 사용 중인 닉네임이에요'
    case 'invalid':
      return '한글·영문·숫자만 2~15자로 입력해주세요'
    default:
      return '한글·영문·숫자만 사용 가능, 특수문자·공백 불가'
  }
})

const nicknameHintColor = computed(() => {
  if (nicknameCheckState.value === 'available') return 'text-emerald-600'
  if (nicknameCheckState.value === 'taken' || nicknameCheckState.value === 'invalid')
    return 'text-destructive'
  return 'text-muted-foreground'
})

function openEdit() {
  editNickname.value = profile.value?.nickname ?? ''
  editJobType.value = profile.value?.jobType ?? null
  editAvatarPreview.value = null
  editAvatarFile.value = null
  nicknameCheckState.value = 'available'
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
}

function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  editAvatarFile.value = file
  editAvatarPreview.value = URL.createObjectURL(file)
}

async function saveProfile() {
  if (saving.value) return
  const nick = editNickname.value.trim()
  if (nicknameCheckState.value !== 'available') {
    toast.error(nicknameHint.value)
    return
  }
  saving.value = true
  try {
    // 아바타 이미지 먼저 업로드
    if (editAvatarFile.value) {
      const fd = new FormData()
      fd.append('file', editAvatarFile.value)
      const res = await $fetch<{ data: { avatarUrl: string } }>('/api/uploads/avatar', {
        method: 'POST',
        body: fd,
      })
      void res.data.avatarUrl
    }

    // 닉네임·직업 업데이트
    await $fetch<{ data: { nickname: string; jobType: string | null; avatarUrl: string | null } }>(
      '/api/users/me',
      { method: 'PATCH', body: { nickname: nick, jobType: editJobType.value } }
    )
    await authStore.fetchProfile()
    toast.success('프로필이 업데이트됐어요')
    editMode.value = false
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '저장에 실패했어요')
  } finally {
    saving.value = false
  }
}

watch(editNickname, (value) => {
  if (!editMode.value) return
  if (nicknameCheckTimer.value) clearTimeout(nicknameCheckTimer.value)

  const nextNickname = value.trim()
  if (!nextNickname) {
    nicknameCheckState.value = 'idle'
    return
  }
  if (!NICKNAME_REGEX.test(nextNickname)) {
    nicknameCheckState.value = 'invalid'
    return
  }
  if (nextNickname === profile.value?.nickname) {
    nicknameCheckState.value = 'available'
    return
  }

  nicknameCheckState.value = 'checking'
  nicknameCheckTimer.value = setTimeout(async () => {
    try {
      const res = await $fetch<{ data: { available: boolean } }>('/api/users/check-nickname', {
        query: { nickname: nextNickname },
      })
      if (editNickname.value.trim() !== nextNickname) return
      nicknameCheckState.value = res.data.available ? 'available' : 'taken'
    } catch {
      if (editNickname.value.trim() !== nextNickname) return
      nicknameCheckState.value = 'taken'
    }
  }, 500)
})

onUnmounted(() => {
  if (nicknameCheckTimer.value) clearTimeout(nicknameCheckTimer.value)
})

async function handleWithdraw() {
  if (withdrawing.value) return
  withdrawing.value = true
  try {
    await $fetch('/api/users/me', { method: 'DELETE' })
    authStore.clear()
    await signOut()
  } catch {
    withdrawing.value = false
  }
}

const profile = computed(() => authStore.profile ?? authStore.displayProfile)
const userInitial = computed(() => profile.value?.nickname?.[0]?.toUpperCase() ?? 'U')
const jobTypeLabel = computed(() => {
  if (profile.value?.jobType === 'developer') return '개발자'
  if (profile.value?.jobType === 'designer') return '디자이너'
  return null
})

// ── 탭 데이터 ────────────────────────────────────────────
interface AnalysisItem {
  id: string
  title: string
  createdAt: string
  isPublic: boolean
  status: string
}

interface MyPost {
  id: string
  category: string
  title: string
  createdAt: string
  commentCount: number
  likeCount: number
}

interface MyComment {
  id: string
  content: string
  createdAt: string
  postId: string
  postTitle: string | null
}

/** 저장한 글 목록 아이템 */
interface BookmarkedPost {
  bookmarkId: string
  postId: string | null
  category: string | null
  title: string | null
  bookmarkedAt: string
  isDeleted: boolean
}

/** 저장한 아티클 아이템 */
interface BookmarkedArticle {
  id: string
  feedName: string
  category: 'domestic' | 'international'
  title: string
  url: string
  publishedAt: string
  bookmarkedAt: string
}

const analyses = ref<AnalysisItem[]>([])
const analysesPending = ref(false)
const myPosts = ref<MyPost[]>([])
const myPostsPending = ref(false)
const myComments = ref<MyComment[]>([])
const myCommentsPending = ref(false)
const likedPosts = ref<MyPost[]>([])
const likedPending = ref(false)
const bookmarkedPosts = ref<BookmarkedPost[]>([])
const bookmarkedPending = ref(false)
const bookmarkedArticles = ref<BookmarkedArticle[]>([])
const bookmarkedArticlesPending = ref(false)
const recentArticles = ref<RecentArticle[]>([])

const activeTab = ref<
  | 'analyses'
  | 'posts'
  | 'comments'
  | 'likes'
  | 'bookmarks'
  | 'article-bookmarks'
  | 'recent-articles'
>('analyses')
const pages = ref({
  analyses: 1,
  posts: 1,
  comments: 1,
  likes: 1,
  bookmarks: 1,
  'article-bookmarks': 1,
  'recent-articles': 1,
})
const PAGE_SIZE = 10

function paged<T>(list: T[], tab: keyof typeof pages.value) {
  const p = pages.value[tab]
  return list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE)
}

function totalPages(list: { length: number }, _tab: keyof typeof pages.value) {
  return Math.max(1, Math.ceil(list.length / PAGE_SIZE))
}

function goPage(tab: keyof typeof pages.value, p: number) {
  pages.value[tab] = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  analysesPending.value = true
  myPostsPending.value = true
  myCommentsPending.value = true
  likedPending.value = true
  bookmarkedPending.value = true
  bookmarkedArticlesPending.value = true

  const [analysesRes, postsRes, commentsRes, likesRes, bookmarksRes, articleBookmarksRes] =
    await Promise.allSettled([
      $fetch<{ data: AnalysisItem[] }>('/api/analyses'),
      $fetch<{ data: MyPost[] }>('/api/users/me/posts'),
      $fetch<{ data: MyComment[] }>('/api/users/me/comments'),
      $fetch<{ data: MyPost[] }>('/api/users/me/likes'),
      $fetch<{ data: BookmarkedPost[] }>('/api/users/me/bookmarks'),
      $fetch<{ data: BookmarkedArticle[] }>('/api/users/me/article-bookmarks'),
    ])

  if (analysesRes.status === 'fulfilled') analyses.value = analysesRes.value.data
  analysesPending.value = false
  if (postsRes.status === 'fulfilled') myPosts.value = postsRes.value.data
  myPostsPending.value = false
  if (commentsRes.status === 'fulfilled') myComments.value = commentsRes.value.data
  myCommentsPending.value = false
  if (likesRes.status === 'fulfilled') likedPosts.value = likesRes.value.data
  likedPending.value = false
  if (bookmarksRes.status === 'fulfilled') bookmarkedPosts.value = bookmarksRes.value.data
  bookmarkedPending.value = false
  if (articleBookmarksRes.status === 'fulfilled')
    bookmarkedArticles.value = articleBookmarksRes.value.data
  bookmarkedArticlesPending.value = false

  // 최근 본 아티클 localStorage에서 로드
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    recentArticles.value = raw ? JSON.parse(raw) : []
  } catch {
    recentArticles.value = []
  }
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return m <= 1 ? '방금 전' : `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  if (d < 30) return `${Math.floor(d / 7)}주 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function clearRecentArticles() {
  localStorage.removeItem(RECENT_KEY)
  recentArticles.value = []
}

function removeRecentArticle(id: string) {
  recentArticles.value = recentArticles.value.filter((a) => a.id !== id)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recentArticles.value))
}

const tabs = [
  { key: 'analyses' as const, label: '분석 기록', shortLabel: '분석' },
  { key: 'posts' as const, label: '내가 쓴 글', shortLabel: '게시글' },
  { key: 'comments' as const, label: '내 댓글', shortLabel: '댓글' },
  { key: 'likes' as const, label: '좋아요한 글', shortLabel: '좋아요' },
  { key: 'bookmarks' as const, label: '저장한 글', shortLabel: '저장' },
  { key: 'article-bookmarks' as const, label: '저장한 아티클', shortLabel: '아티클' },
  { key: 'recent-articles' as const, label: '최근 본 아티클', shortLabel: '최근 본' },
]

function selectTab(
  key:
    | 'analyses'
    | 'posts'
    | 'comments'
    | 'likes'
    | 'bookmarks'
    | 'article-bookmarks'
    | 'recent-articles'
) {
  activeTab.value = key
  pages.value[key] = 1
}

/** 동적 :is 바인딩을 위해 NuxtLink 컴포넌트 참조 */
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
    <!-- 모바일: 프로필 카드 풀너비 -->
    <div class="lg:hidden">
      <div class="rounded-2xl border border-border bg-card p-5">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="group relative size-14 shrink-0 overflow-hidden rounded-full bg-primary"
            @click="openEdit"
          >
            <img
              v-if="profile?.avatarUrl"
              :src="profile.avatarUrl"
              alt="프로필"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center text-lg font-bold text-primary-foreground"
            >
              {{ userInitial }}
            </div>
            <div
              class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Camera class="size-4 text-white" />
            </div>
          </button>
          <div class="min-w-0 flex-1">
            <p class="truncate font-black text-foreground">{{ profile?.nickname ?? '사용자' }}</p>
            <p v-if="jobTypeLabel" class="mt-1 text-xs font-semibold text-primary">
              {{ jobTypeLabel }}
            </p>
          </div>
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            @click="openEdit"
          >
            <Pencil class="size-3.5" />
          </button>
        </div>
      </div>

      <!-- 모바일 탭 -->
      <div class="mt-4 overflow-x-auto rounded-xl border border-border scrollbar-none">
        <div class="flex min-w-max">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="shrink-0 whitespace-nowrap border-r border-border px-4 py-3 text-xs font-semibold transition-colors outline-none last:border-r-0"
            :class="
              activeTab === tab.key
                ? 'bg-primary/[0.07] text-primary'
                : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
            "
            @click="selectTab(tab.key)"
          >
            {{ tab.shortLabel }}
          </button>
        </div>
      </div>
    </div>

    <!-- 데스크탑: 사이드바 + 콘텐츠 -->
    <div class="flex gap-8">
      <!-- 사이드바 (lg+) -->
      <aside class="hidden w-56 shrink-0 lg:block">
        <!-- 프로필 카드 -->
        <div class="rounded-2xl border border-border bg-card p-5">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="group relative size-14 shrink-0 overflow-hidden rounded-full bg-primary"
              @click="openEdit"
            >
              <img
                v-if="profile?.avatarUrl"
                :src="profile.avatarUrl"
                alt="프로필"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-lg font-bold text-primary-foreground"
              >
                {{ userInitial }}
              </div>
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Camera class="size-4 text-white" />
              </div>
            </button>
            <div class="min-w-0 flex-1">
              <p class="truncate font-black text-foreground">{{ profile?.nickname ?? '사용자' }}</p>
              <p
                v-if="jobTypeLabel"
                class="mt-1.5 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
              >
                {{ jobTypeLabel }}
              </p>
            </div>
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              @click="openEdit"
            >
              <Pencil class="size-3.5" />
            </button>
          </div>
        </div>

        <!-- 사이드 네비 -->
        <nav class="mt-4 grid gap-0.5">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
            :class="
              activeTab === tab.key
                ? 'bg-primary/[0.07] text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            "
            @click="selectTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </nav>

        <!-- 계정 관리 -->
        <div class="mt-6 border-t border-border pt-4">
          <button
            type="button"
            class="w-full rounded-lg px-3 py-2 text-left text-xs text-muted-foreground/60 transition-colors hover:text-destructive"
            @click="showWithdrawDialog = true"
          >
            회원탈퇴
          </button>
        </div>
      </aside>

      <!-- 콘텐츠 -->
      <div class="min-w-0 flex-1">
        <!-- lg+ 탭 제목 -->
        <h2 class="hidden text-lg font-black text-foreground lg:block">
          {{ tabs.find((t) => t.key === activeTab)?.label }}
        </h2>
        <div class="mt-4 lg:mt-4">
          <!-- 분석 기록 -->
          <template v-if="activeTab === 'analyses'">
            <div v-if="analysesPending" class="flex justify-center py-12">
              <div
                class="size-6 animate-spin rounded-full border-2 border-border border-t-primary"
              />
            </div>

            <div v-else-if="analyses.length > 0" class="grid gap-2">
              <NuxtLink
                v-for="item in paged(analyses, 'analyses')"
                :key="item.id"
                :to="`/analysis/${item.id}`"
                class="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-foreground">{{ item.title }}</p>
                  <p class="mt-0.5 text-xs text-muted-foreground">
                    {{ formatDate(item.createdAt) }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <AppBadge :variant="item.isPublic ? 'green' : 'gray'">
                    <Unlock v-if="item.isPublic" class="mr-1 size-3" />
                    <Lock v-else class="mr-1 size-3" />
                    {{ item.isPublic ? '공개' : '비공개' }}
                  </AppBadge>
                  <ArrowUpRight class="size-4 text-muted-foreground" />
                </div>
              </NuxtLink>

              <Pagination
                v-if="totalPages(analyses, 'analyses') > 1"
                :current="pages.analyses"
                :total="totalPages(analyses, 'analyses')"
                @change="goPage('analyses', $event)"
              />
            </div>

            <AppEmptyState
              v-else
              title="아직 분석한 포트폴리오가 없어요"
              description="PDF 포트폴리오를 올리면 AI가 항목별로 분석해드려요."
            >
              <template #action>
                <NuxtLink to="/analyze"><AppButton>포트폴리오 분석하기</AppButton></NuxtLink>
              </template>
            </AppEmptyState>
          </template>

          <!-- 내가 쓴 글 -->
          <template v-else-if="activeTab === 'posts'">
            <div v-if="myPostsPending" class="flex justify-center py-12">
              <div
                class="size-6 animate-spin rounded-full border-2 border-border border-t-primary"
              />
            </div>

            <div v-else-if="myPosts.length > 0" class="grid gap-2">
              <NuxtLink
                v-for="post in paged(myPosts, 'posts')"
                :key="post.id"
                :to="`/community/${post.id}`"
                class="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <AppBadge variant="blue" class="shrink-0">{{ post.category }}</AppBadge>
                    <p class="truncate text-sm font-semibold text-foreground">{{ post.title }}</p>
                  </div>
                  <div class="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{{ post.createdAt }}</span>
                    <span class="flex items-center gap-1"
                      ><Heart class="size-3" />{{ post.likeCount }}</span
                    >
                    <span class="flex items-center gap-1"
                      ><MessageSquare class="size-3" />{{ post.commentCount }}</span
                    >
                  </div>
                </div>
                <ArrowUpRight class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </NuxtLink>

              <Pagination
                v-if="totalPages(myPosts, 'posts') > 1"
                :current="pages.posts"
                :total="totalPages(myPosts, 'posts')"
                @change="goPage('posts', $event)"
              />
            </div>

            <AppEmptyState
              v-else
              title="아직 작성한 글이 없어요"
              description="커뮤니티에서 첫 번째 글을 써보세요."
            >
              <template #action>
                <NuxtLink to="/community?tab=feedback"
                  ><AppButton>글 쓰러 가기</AppButton></NuxtLink
                >
              </template>
            </AppEmptyState>
          </template>

          <!-- 내 댓글 -->
          <template v-else-if="activeTab === 'comments'">
            <div v-if="myCommentsPending" class="flex justify-center py-12">
              <div
                class="size-6 animate-spin rounded-full border-2 border-border border-t-primary"
              />
            </div>

            <div v-else-if="myComments.length > 0" class="grid gap-2">
              <NuxtLink
                v-for="comment in paged(myComments, 'comments')"
                :key="comment.id"
                :to="comment.postTitle ? `/community/${comment.postId}` : '#'"
                class="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors"
                :class="comment.postTitle ? 'hover:bg-muted' : 'cursor-default opacity-60'"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-foreground line-clamp-2">{{ comment.content }}</p>
                  <div class="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{{ comment.createdAt }}</span>
                    <span>·</span>
                    <span class="truncate">{{ comment.postTitle ?? '삭제된 게시글' }}</span>
                  </div>
                </div>
                <ArrowUpRight
                  v-if="comment.postTitle"
                  class="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
              </NuxtLink>

              <Pagination
                v-if="totalPages(myComments, 'comments') > 1"
                :current="pages.comments"
                :total="totalPages(myComments, 'comments')"
                @change="goPage('comments', $event)"
              />
            </div>

            <AppEmptyState
              v-else
              title="아직 작성한 댓글이 없어요"
              description="게시글에 댓글을 달아보세요."
            />
          </template>

          <!-- 좋아요한 글 -->
          <template v-else-if="activeTab === 'likes'">
            <div v-if="likedPending" class="flex justify-center py-12">
              <div
                class="size-6 animate-spin rounded-full border-2 border-border border-t-primary"
              />
            </div>

            <div v-else-if="likedPosts.length > 0" class="grid gap-2">
              <NuxtLink
                v-for="post in paged(likedPosts, 'likes')"
                :key="post.id"
                :to="`/community/${post.id}`"
                class="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <AppBadge variant="blue" class="shrink-0">{{ post.category }}</AppBadge>
                    <p class="truncate text-sm font-semibold text-foreground">{{ post.title }}</p>
                  </div>
                  <div class="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{{ post.createdAt }}</span>
                    <span class="flex items-center gap-1"
                      ><Heart class="size-3 text-rose-400" />{{ post.likeCount }}</span
                    >
                    <span class="flex items-center gap-1"
                      ><MessageSquare class="size-3" />{{ post.commentCount }}</span
                    >
                  </div>
                </div>
                <ArrowUpRight class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </NuxtLink>

              <Pagination
                v-if="totalPages(likedPosts, 'likes') > 1"
                :current="pages.likes"
                :total="totalPages(likedPosts, 'likes')"
                @change="goPage('likes', $event)"
              />
            </div>

            <AppEmptyState
              v-else
              title="아직 좋아요한 글이 없어요"
              description="마음에 드는 게시글에 좋아요를 눌러보세요."
            >
              <template #action>
                <NuxtLink to="/community?tab=feedback"
                  ><AppButton>커뮤니티 보러 가기</AppButton></NuxtLink
                >
              </template>
            </AppEmptyState>
          </template>

          <!-- 저장한 글 -->
          <template v-else-if="activeTab === 'bookmarks'">
            <div v-if="bookmarkedPending" class="flex justify-center py-12">
              <div
                class="size-6 animate-spin rounded-full border-2 border-border border-t-primary"
              />
            </div>

            <div v-else-if="bookmarkedPosts.length > 0" class="grid gap-2">
              <component
                :is="post.isDeleted ? 'div' : NuxtLink"
                v-for="post in paged(bookmarkedPosts, 'bookmarks')"
                :key="post.bookmarkId"
                v-bind="post.isDeleted ? {} : { to: `/community/${post.postId}` }"
                class="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors"
                :class="post.isDeleted ? 'cursor-default opacity-50' : 'hover:bg-muted'"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <AppBadge :variant="post.isDeleted ? 'gray' : 'blue'" class="shrink-0">
                      {{ post.isDeleted ? '삭제됨' : post.category }}
                    </AppBadge>
                    <p
                      class="truncate text-sm font-semibold"
                      :class="post.isDeleted ? 'text-muted-foreground' : 'text-foreground'"
                    >
                      {{ post.isDeleted ? '삭제된 게시글' : post.title }}
                    </p>
                  </div>
                  <p class="mt-1.5 text-xs text-muted-foreground">{{ post.bookmarkedAt }} 저장</p>
                </div>
                <ArrowUpRight
                  v-if="!post.isDeleted"
                  class="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
              </component>

              <Pagination
                v-if="totalPages(bookmarkedPosts, 'bookmarks') > 1"
                :current="pages.bookmarks"
                :total="totalPages(bookmarkedPosts, 'bookmarks')"
                @change="goPage('bookmarks', $event)"
              />
            </div>

            <AppEmptyState
              v-else
              title="아직 저장한 글이 없어요"
              description="게시글의 북마크 아이콘을 눌러 저장해보세요."
            >
              <template #action>
                <NuxtLink to="/community?tab=feedback"
                  ><AppButton>커뮤니티 보러 가기</AppButton></NuxtLink
                >
              </template>
            </AppEmptyState>
          </template>

          <!-- 저장한 아티클 -->
          <template v-else-if="activeTab === 'article-bookmarks'">
            <div v-if="bookmarkedArticlesPending" class="flex justify-center py-12">
              <div
                class="size-6 animate-spin rounded-full border-2 border-border border-t-primary"
              />
            </div>

            <div v-else-if="bookmarkedArticles.length > 0" class="grid gap-2">
              <NuxtLink
                v-for="article in paged(bookmarkedArticles, 'article-bookmarks')"
                :key="article.id"
                :to="`/articles/${article.id}`"
                class="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <AppBadge variant="blue" class="shrink-0">{{ article.feedName }}</AppBadge>
                    <p class="truncate text-sm font-semibold text-foreground">
                      {{ article.title }}
                    </p>
                  </div>
                  <p class="mt-1.5 text-xs text-muted-foreground">
                    {{ formatDate(article.bookmarkedAt) }} 저장
                  </p>
                </div>
                <ArrowUpRight class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </NuxtLink>

              <Pagination
                v-if="totalPages(bookmarkedArticles, 'article-bookmarks') > 1"
                :current="pages['article-bookmarks']"
                :total="totalPages(bookmarkedArticles, 'article-bookmarks')"
                @change="goPage('article-bookmarks', $event)"
              />
            </div>

            <AppEmptyState
              v-else
              title="아직 저장한 아티클이 없어요"
              description="아티클의 북마크 아이콘을 눌러 저장해보세요."
            >
              <template #action>
                <NuxtLink to="/articles"><AppButton>아티클 보러 가기</AppButton></NuxtLink>
              </template>
            </AppEmptyState>
          </template>

          <!-- 최근 본 아티클 -->
          <template v-else-if="activeTab === 'recent-articles'">
            <div v-if="recentArticles.length > 0">
              <div class="mb-3 flex items-center justify-between">
                <p class="text-sm text-muted-foreground">
                  최근 본 아티클 {{ recentArticles.length }}개
                </p>
                <button
                  type="button"
                  class="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
                  @click="clearRecentArticles"
                >
                  <Trash2 class="size-3" />
                  전체 삭제
                </button>
              </div>

              <div class="grid gap-2">
                <div
                  v-for="article in paged(recentArticles, 'recent-articles')"
                  :key="article.id"
                  class="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
                >
                  <NuxtLink :to="`/articles/${article.id}`" class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <AppBadge variant="blue" class="shrink-0">{{ article.feedName }}</AppBadge>
                      <p class="truncate text-sm font-semibold text-foreground">
                        {{ article.title }}
                      </p>
                    </div>
                    <div class="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock class="size-3 shrink-0" />
                      {{ timeAgo(article.visitedAt) }} 읽음
                    </div>
                  </NuxtLink>
                  <div class="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      class="flex size-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      title="목록에서 삭제"
                      @click="removeRecentArticle(article.id)"
                    >
                      <X class="size-3.5" />
                    </button>
                    <ArrowUpRight class="size-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <Pagination
                v-if="totalPages(recentArticles, 'recent-articles') > 1"
                :current="pages['recent-articles']"
                :total="totalPages(recentArticles, 'recent-articles')"
                @change="goPage('recent-articles', $event)"
              />
            </div>

            <AppEmptyState
              v-else
              title="최근 본 아티클이 없어요"
              description="아티클을 읽으면 여기에 기록돼요."
            >
              <template #action>
                <NuxtLink to="/articles"><AppButton>아티클 보러 가기</AppButton></NuxtLink>
              </template>
            </AppEmptyState>
          </template>
        </div>
      </div>
      <!-- /콘텐츠 -->
    </div>
    <!-- /데스크탑 flex -->
  </div>

  <!-- 프로필 수정 모달 -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="editMode"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="cancelEdit"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cancelEdit" />
        <div
          class="relative w-full max-w-md rounded-2xl bg-popover p-6 text-popover-foreground shadow-2xl sm:p-8"
        >
          <button
            type="button"
            class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click="cancelEdit"
          >
            <X class="size-4" />
          </button>

          <h2 class="text-xl font-black text-foreground">프로필 수정</h2>
          <p class="mt-1 text-sm text-muted-foreground">커뮤니티에 표시되는 정보를 변경해요.</p>

          <div class="mt-6 flex flex-col gap-5 sm:flex-row sm:gap-6">
            <!-- 아바타 변경 -->
            <div class="flex flex-col items-center gap-2">
              <label class="group relative cursor-pointer">
                <div class="size-20 overflow-hidden rounded-full bg-primary">
                  <img
                    v-if="editAvatarPreview || profile?.avatarUrl"
                    :src="editAvatarPreview ?? profile?.avatarUrl ?? ''"
                    alt="프로필"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-2xl font-bold text-primary-foreground"
                  >
                    {{ userInitial }}
                  </div>
                </div>
                <div
                  class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Camera class="size-5 text-white" />
                </div>
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="sr-only"
                  @change="onAvatarChange"
                />
              </label>
              <p class="text-xs text-muted-foreground">클릭해서 변경</p>
            </div>

            <!-- 닉네임·직업 폼 -->
            <div class="grid flex-1 gap-4">
              <div>
                <div class="flex items-center justify-between">
                  <label class="text-sm font-bold text-foreground">닉네임</label>
                  <span class="text-xs text-muted-foreground">{{ editNickname.length }}/15</span>
                </div>
                <div class="relative mt-1.5">
                  <input
                    v-model="editNickname"
                    type="text"
                    maxlength="15"
                    placeholder="2~15자"
                    class="h-10 w-full rounded-lg border border-border bg-background px-3 pr-9 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2
                      v-if="nicknameCheckState === 'checking'"
                      class="size-4 animate-spin text-muted-foreground"
                    />
                    <Check
                      v-else-if="nicknameCheckState === 'available'"
                      class="size-4 text-emerald-500"
                    />
                    <X
                      v-else-if="nicknameCheckState === 'taken' || nicknameCheckState === 'invalid'"
                      class="size-4 text-destructive"
                    />
                  </div>
                </div>
                <p class="mt-1.5 text-xs" :class="nicknameHintColor">
                  {{ nicknameHint }}
                </p>
              </div>

              <div>
                <label class="text-sm font-bold text-foreground">직업</label>
                <div class="mt-1.5 flex gap-2">
                  <button
                    v-for="opt in [
                      { value: 'developer', label: '개발자' },
                      { value: 'designer', label: '디자이너' },
                    ]"
                    :key="opt.value"
                    type="button"
                    class="flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors"
                    :class="
                      editJobType === opt.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                    "
                    @click="
                      editJobType =
                        editJobType === opt.value ? null : (opt.value as 'developer' | 'designer')
                    "
                  >
                    {{ opt.label }}
                  </button>
                </div>
                <p v-if="editJobType" class="mt-1.5 text-right text-xs text-muted-foreground">
                  클릭하면 선택 해제
                </p>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <AppButton variant="outline" @click="cancelEdit"> 취소 </AppButton>
            <AppButton
              :disabled="saving || nicknameCheckState !== 'available'"
              @click="saveProfile"
            >
              <Check class="size-3.5" />
              {{ saving ? '저장 중...' : '저장' }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 탈퇴 확인 다이얼로그 -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showWithdrawDialog"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showWithdrawDialog = false"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="showWithdrawDialog = false"
        />
        <div
          class="relative w-full max-w-sm rounded-2xl bg-popover p-8 text-popover-foreground shadow-2xl"
        >
          <h2 class="text-xl font-black text-foreground">정말 탈퇴하시겠어요?</h2>
          <p class="mt-3 text-sm leading-6 text-muted-foreground">
            탈퇴하면 이메일과 프로필 정보가 익명화되고 로그아웃돼요. 같은 OAuth 계정으로 다시
            로그인하면 30일 이내에는 기존 활동 기록과 연결된 계정을 복구할 수 있어요. 30일이 지나면
            계정 정보와 분석 PDF, 프로필 이미지는 영구 삭제돼요.
          </p>
          <div class="mt-6 flex gap-3">
            <AppButton variant="outline" class="flex-1" @click="showWithdrawDialog = false"
              >취소</AppButton
            >
            <AppButton
              variant="destructive"
              class="flex-1"
              :disabled="withdrawing"
              @click="handleWithdraw"
            >
              {{ withdrawing ? '처리 중...' : '탈퇴 신청' }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
