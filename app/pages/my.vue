<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Camera, ExternalLink, Lock, Unlock, Heart, MessageSquare, ArrowUpRight } from '@lucide/vue'

const showWithdrawDialog = ref(false)
const withdrawing = ref(false)
const authStore = useAuthStore()
const { signOut } = useAuth()

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

const profile = authStore.profile

const userInitial = computed(() => profile?.nickname?.[0]?.toUpperCase() ?? 'U')

const jobTypeLabel = computed(() => {
  if (profile?.jobType === 'developer') return '개발자'
  if (profile?.jobType === 'designer') return '디자이너'
  return null
})

interface AnalysisItem {
  id: string
  title: string
  createdAt: string
  isPublic: boolean
  status: string
}

const analyses = ref<AnalysisItem[]>([])
const analysesPending = ref(false)

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

const myPosts = ref<MyPost[]>([])
const myPostsPending = ref(false)
const myComments = ref<MyComment[]>([])
const myCommentsPending = ref(false)

onMounted(async () => {
  analysesPending.value = true
  myPostsPending.value = true
  myCommentsPending.value = true

  const [analysesRes, postsRes, commentsRes] = await Promise.allSettled([
    $fetch<{ data: AnalysisItem[] }>('/api/analyses'),
    $fetch<{ data: MyPost[] }>('/api/users/me/posts'),
    $fetch<{ data: MyComment[] }>('/api/users/me/comments'),
  ])

  if (analysesRes.status === 'fulfilled') analyses.value = analysesRes.value.data
  analysesPending.value = false

  if (postsRes.status === 'fulfilled') myPosts.value = postsRes.value.data
  myPostsPending.value = false

  if (commentsRes.status === 'fulfilled') myComments.value = commentsRes.value.data
  myCommentsPending.value = false
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-10">
    <!-- 프로필 -->
    <section>
      <h1 class="text-2xl font-black text-foreground">마이페이지</h1>

      <div class="mt-6 flex items-center gap-5">
        <!-- 프로필 사진 -->
        <label class="group relative cursor-pointer">
          <div class="size-16 overflow-hidden rounded-full bg-primary">
            <img
              v-if="profile?.avatarUrl"
              :src="profile.avatarUrl"
              alt="프로필 이미지"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center text-xl font-bold text-primary-foreground"
            >
              {{ userInitial }}
            </div>
          </div>
          <div
            class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Camera class="size-5 text-white" />
          </div>
          <input type="file" accept="image/*" class="sr-only" />
        </label>

        <div>
          <p class="text-lg font-black text-foreground">{{ profile?.nickname ?? '사용자' }}</p>
          <div class="mt-0.5 flex items-center gap-2">
            <p class="text-sm text-muted-foreground">{{ profile?.email ?? '' }}</p>
            <span
              v-if="jobTypeLabel"
              class="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary"
            >
              {{ jobTypeLabel }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <hr class="my-8 border-border" />

    <!-- 분석 기록 -->
    <section>
      <h2 class="text-lg font-black text-foreground">분석 기록</h2>

      <div v-if="analysesPending" class="mt-4 flex justify-center py-8">
        <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>

      <div v-else-if="analyses.length > 0" class="mt-4 grid gap-3">
        <div
          v-for="item in analyses"
          :key="item.id"
          class="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-slate-50"
        >
          <div class="flex items-center gap-3">
            <div class="flex size-9 items-center justify-center rounded-lg bg-accent">
              <span class="text-xs font-bold text-primary">AI</span>
            </div>
            <div>
              <p class="text-sm font-semibold text-foreground">{{ item.title }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ formatDate(item.createdAt) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <AppBadge :variant="item.isPublic ? 'green' : 'gray'">
              <Unlock v-if="item.isPublic" class="mr-1 size-3" />
              <Lock v-else class="mr-1 size-3" />
              {{ item.isPublic ? '공개' : '비공개' }}
            </AppBadge>
            <NuxtLink :to="`/analysis/${item.id}`">
              <AppButton variant="ghost" size="icon">
                <ExternalLink class="size-4" />
              </AppButton>
            </NuxtLink>
          </div>
        </div>
      </div>

      <AppEmptyState
        v-else
        title="아직 분석한 포트폴리오가 없어요"
        description="PDF 포트폴리오를 올리면 AI가 항목별로 분석해드려요."
      >
        <template #action>
          <NuxtLink to="/analyze">
            <AppButton>포트폴리오 분석하기</AppButton>
          </NuxtLink>
        </template>
      </AppEmptyState>
    </section>

    <hr class="my-8 border-border" />

    <!-- 내가 쓴 글 -->
    <section>
      <h2 class="text-lg font-black text-foreground">내가 쓴 글</h2>

      <div v-if="myPostsPending" class="mt-4 flex justify-center py-8">
        <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>

      <div v-else-if="myPosts.length > 0" class="mt-4 grid gap-2">
        <NuxtLink
          v-for="post in myPosts"
          :key="post.id"
          :to="`/community/${post.id}`"
          class="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-slate-50"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <AppBadge variant="blue" class="shrink-0">{{ post.category }}</AppBadge>
              <p class="truncate text-sm font-semibold text-foreground">{{ post.title }}</p>
            </div>
            <div class="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{{ post.createdAt }}</span>
              <span class="flex items-center gap-1">
                <Heart class="size-3" />
                {{ post.likeCount }}
              </span>
              <span class="flex items-center gap-1">
                <MessageSquare class="size-3" />
                {{ post.commentCount }}
              </span>
            </div>
          </div>
          <ArrowUpRight class="ml-3 size-4 shrink-0 text-muted-foreground" />
        </NuxtLink>
      </div>

      <AppEmptyState
        v-else
        title="아직 작성한 글이 없어요"
        description="커뮤니티에서 첫 번째 글을 써보세요."
      >
        <template #action>
          <NuxtLink to="/community?tab=feedback">
            <AppButton>글 쓰러 가기</AppButton>
          </NuxtLink>
        </template>
      </AppEmptyState>
    </section>

    <hr class="my-8 border-border" />

    <!-- 내 댓글 -->
    <section>
      <h2 class="text-lg font-black text-foreground">내 댓글</h2>

      <div v-if="myCommentsPending" class="mt-4 flex justify-center py-8">
        <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>

      <div v-else-if="myComments.length > 0" class="mt-4 grid gap-2">
        <NuxtLink
          v-for="comment in myComments"
          :key="comment.id"
          :to="comment.postTitle ? `/community/${comment.postId}` : '#'"
          class="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors"
          :class="comment.postTitle ? 'hover:bg-slate-50' : 'opacity-60 cursor-default'"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-foreground">{{ comment.content }}</p>
            <div class="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{{ comment.createdAt }}</span>
              <span>·</span>
              <span class="truncate">{{ comment.postTitle ?? '삭제된 게시글' }}</span>
            </div>
          </div>
          <ArrowUpRight
            v-if="comment.postTitle"
            class="ml-3 size-4 shrink-0 text-muted-foreground"
          />
        </NuxtLink>
      </div>

      <AppEmptyState
        v-else
        title="아직 작성한 댓글이 없어요"
        description="게시글에 댓글을 달아보세요."
      />
    </section>

    <hr class="my-8 border-border" />

    <!-- 계정 -->
    <section>
      <h2 class="text-lg font-black text-foreground">계정</h2>
      <div class="mt-4 flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p class="text-sm font-semibold text-foreground">회원 탈퇴</p>
          <p class="mt-0.5 text-xs text-muted-foreground">
            탈퇴 신청 후 30일이 지나면 계정이 영구 삭제돼요.
          </p>
        </div>
        <AppButton variant="destructive" size="sm" @click="showWithdrawDialog = true">
          탈퇴 신청
        </AppButton>
      </div>
    </section>
  </div>

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
        <div class="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <h2 class="text-xl font-black text-foreground">정말 탈퇴하시겠어요?</h2>
          <p class="mt-3 text-sm leading-6 text-muted-foreground">
            탈퇴 신청 후 <strong class="text-foreground">30일</strong>이 지나면 계정과 분석 기록,
            게시글 등 모든 데이터가 영구적으로 삭제돼요. 삭제된 데이터는 복구할 수 없어요.
          </p>
          <div class="mt-6 flex gap-3">
            <AppButton variant="outline" class="flex-1" @click="showWithdrawDialog = false">
              취소
            </AppButton>
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
