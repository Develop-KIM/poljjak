<script setup lang="ts">
import { Bookmark, BookmarkCheck, Share2, ArrowLeft, ExternalLink, Tag, Calendar } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { useToastStore } from '~/stores/toast'

const route = useRoute()
const authStore = useAuthStore()
const toast = useToastStore()

const BRAND_COLORS: Record<string, string> = {
  '네이버 D2': '#03C75A', '네이버 클라우드': '#03C75A',
  '카카오 기술 블로그': '#FFCD00', '카카오페이 기술 블로그': '#E8341C',
  '카카오엔터 기술 블로그': '#FFCD00', '라인 기술 블로그': '#00B900',
  '쿠팡 기술 블로그': '#FF6000', '우아한형제들 기술 블로그': '#2AC1BC',
  '당근 기술 블로그': '#FF6F0F', '토스 기술 블로그': '#0064FF',
  '직방 기술 블로그': '#FF6A00', '야놀자 기술 블로그': '#FF5F00',
  '쏘카 기술 블로그': '#00BAB3', 'NHN 기술 블로그': '#00B0F0',
  '무신사 기술 블로그': '#555555', '왓챠 기술 블로그': '#FF2F6E',
  '인프런 기술 블로그': '#00C471', '리디 기술 블로그': '#1E9EFF',
  '하이퍼커넥트 기술 블로그': '#E31D1C', '올리브영 기술 블로그': '#3DAA6D',
  'Hacker News': '#FF6600', 'dev.to': '#6366F1',
  'Smashing Magazine': '#E85A4F', 'CSS-Tricks': '#FF453A',
  'Engineering at Meta': '#0866FF', 'Google Developers': '#4285F4',
  'Netflix Tech Blog': '#E50914', 'Uber Engineering': '#9CA3AF',
  'Airbnb Engineering': '#FF5A5F', 'Shopify Engineering': '#96BF48',
  'GitHub Blog': '#6B7280', 'Stripe Blog': '#635BFF',
  'Cloudflare Blog': '#F48120', 'Vercel Blog': '#6B7280',
  'Discord Blog': '#5865F2', 'Figma Blog': '#F24E1E',
  'Notion Blog': '#6B7280', 'Slack Engineering': '#E01E5A',
  'Spotify Engineering': '#1DB954',
}
function getBrandColor(feedName: string) { return BRAND_COLORS[feedName] ?? '#6B7280' }
function shortName(feedName: string) {
  return feedName.replace(' 기술 블로그', '').replace(' Tech Blog', '')
    .replace(' Engineering', '').replace(' Developers', '').replace(' Blog', '')
}

interface ArticleDetail {
  id: string; feedName: string; category: 'domestic' | 'international'
  title: string; url: string; summary: string | null
  tags: string[]; publishedAt: string; collectedAt: string
  bookmarkCount: number; isBookmarked: boolean
  related: Array<{ id: string; title: string; publishedAt: string; feedName: string }>
}

const { data: res, status } = await useFetch<{ data: ArticleDetail }>(`/api/articles/${route.params.id}`)
const article = computed(() => res.value?.data ?? null)

useSeoMeta({
  title: computed(() => article.value ? `${article.value.title} · 폴짝` : '아티클 · 폴짝'),
  description: computed(() => article.value?.summary ?? '폴짝에서 기술 아티클을 확인하세요.'),
  ogTitle: computed(() => article.value?.title ?? '아티클'),
  ogDescription: computed(() => article.value?.summary ?? ''),
  ogUrl: computed(() => `https://poljjak.kr/articles/${route.params.id}`),
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

const showLoginModal = ref(false)
const bookmarkPending = ref(false)

async function toggleBookmark() {
  if (!article.value) return
  if (!authStore.isLoggedIn) { showLoginModal.value = true; return }
  if (bookmarkPending.value) return
  bookmarkPending.value = true
  const prev = article.value.isBookmarked
  article.value.isBookmarked = !prev
  try {
    const res = await $fetch<{ data: { isBookmarked: boolean } }>(`/api/articles/${article.value.id}/bookmarks`, { method: 'POST' })
    article.value.isBookmarked = res.data.isBookmarked
  } catch {
    article.value.isBookmarked = prev
    toast.error('북마크 처리에 실패했어요')
  } finally {
    bookmarkPending.value = false
  }
}

async function share() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('링크가 복사됐어요')
  } catch {
    toast.error('복사에 실패했어요')
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
    <!-- 뒤로 가기 -->
    <NuxtLink
      to="/articles"
      class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="size-4" />
      아티클 목록
    </NuxtLink>

    <!-- 로딩 -->
    <div v-if="status === 'pending'" class="flex justify-center py-32">
      <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>

    <!-- 404 -->
    <div v-else-if="!article" class="py-32 text-center text-muted-foreground">
      <p class="text-lg font-semibold text-foreground">아티클을 찾을 수 없어요</p>
      <p class="mt-1 text-sm">삭제됐거나 잘못된 주소예요</p>
    </div>

    <div v-else class="flex gap-10">
      <!-- 본문 -->
      <article class="min-w-0 flex-1">
        <!-- 출처 배지 -->
        <div class="mb-4 flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium leading-none text-muted-foreground">
            <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: getBrandColor(article.feedName) }" />
            {{ shortName(article.feedName) }}
          </span>
          <span class="text-xs text-muted-foreground">
            <Calendar class="mr-0.5 inline size-3" />
            {{ formatDate(article.publishedAt) }}
          </span>
        </div>

        <!-- 제목 -->
        <h1 class="text-2xl font-black leading-snug text-foreground md:text-3xl">
          {{ article.title }}
        </h1>

        <!-- 태그 -->
        <div v-if="article.tags.length > 0" class="mt-4 flex flex-wrap gap-1.5">
          <span
            v-for="tag in article.tags" :key="tag"
            class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          >
            <Tag class="size-3" />
            {{ tag }}
          </span>
        </div>

        <!-- 구분선 -->
        <hr class="my-6 border-border" />

        <!-- 요약 -->
        <div v-if="article.summary" class="rounded-2xl border border-border bg-muted/40 p-5">
          <p class="text-sm font-semibold text-muted-foreground mb-2">요약</p>
          <p class="text-base leading-7 text-foreground">{{ article.summary }}</p>
        </div>
        <div v-else class="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          요약 정보가 없어요
        </div>

        <!-- 액션 -->
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <!-- 원문 읽기 -->
          <a
            :href="article.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            원문 읽기
            <ExternalLink class="size-4" />
          </a>

          <!-- 북마크 -->
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            :class="article.isBookmarked ? 'text-primary border-primary/30 bg-primary/5' : 'text-muted-foreground'"
            @click="toggleBookmark"
          >
            <BookmarkCheck v-if="article.isBookmarked" class="size-4" />
            <Bookmark v-else class="size-4" />
            {{ article.isBookmarked ? '저장됨' : '저장' }}
          </button>

          <!-- 공유 -->
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            @click="share"
          >
            <Share2 class="size-4" />
            공유
          </button>
        </div>
      </article>

      <!-- 사이드: 관련 아티클 -->
      <aside v-if="article.related.length > 0" class="hidden w-64 shrink-0 xl:block">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {{ shortName(article.feedName) }}의 다른 글
        </p>
        <ul class="space-y-2">
          <li v-for="r in article.related" :key="r.id">
            <NuxtLink
              :to="`/articles/${r.id}`"
              class="block rounded-xl border border-border bg-card p-3 text-sm transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <p class="line-clamp-2 font-medium leading-snug text-foreground">{{ r.title }}</p>
              <p class="mt-1.5 text-xs text-muted-foreground">{{ formatDate(r.publishedAt) }}</p>
            </NuxtLink>
          </li>
        </ul>
      </aside>
    </div>
  </div>

  <LoginModal :open="showLoginModal" context="아티클 북마크" @close="showLoginModal = false" />
</template>
