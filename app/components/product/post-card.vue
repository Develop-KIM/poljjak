<script setup lang="ts">
import { MessageSquare, Heart, Eye, Bookmark, BookmarkCheck } from '@lucide/vue'

type PostCategory = '피드백' | '프로젝트 모집' | '스터디 모집'
type RecruitmentStatus = 'open' | 'closed' | null

defineProps<{
  id: string
  category: PostCategory
  title: string
  excerpt?: string
  author: string
  commentCount: number
  likeCount: number
  viewCount?: number
  recruitmentStatus?: RecruitmentStatus
  createdAt: string
  thumbnailUrl?: string | null
  requiresAuth?: boolean
  /** 북마크 아이콘 표시 여부 */
  showBookmark?: boolean
  /** 현재 북마크 상태 */
  isBookmarked?: boolean
}>()

const emit = defineEmits<{
  'auth-required': []
  /** 북마크 토글 요청 */
  'bookmark-toggle': []
}>()
</script>

<template>
  <!-- 공통 내부 콘텐츠 슬롯 (button / NuxtLink 양쪽에서 사용) -->
  <template v-if="false" />

  <button
    v-if="requiresAuth"
    type="button"
    class="w-full border-b border-border py-1 text-left"
    @click="emit('auth-required')"
  >
    <div
      class="flex flex-col gap-2 rounded-lg px-2 pt-3 pb-2.5 transition-colors hover:bg-muted/60"
    >
      <div class="flex items-start gap-2.5">
        <template v-if="recruitmentStatus !== null && recruitmentStatus !== undefined">
          <span
            class="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
            :class="
              recruitmentStatus === 'open'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-muted text-muted-foreground'
            "
          >
            {{ recruitmentStatus === 'open' ? '모집중' : '모집완료' }}
          </span>
        </template>
        <h3 class="line-clamp-2 font-bold leading-6 text-foreground">{{ title }}</h3>
      </div>
      <p v-if="excerpt" class="line-clamp-1 text-sm leading-5 text-muted-foreground">
        {{ excerpt }}
      </p>
      <div class="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>{{ author }} · {{ createdAt }}</span>
        <div class="flex shrink-0 items-center gap-3">
          <span v-if="viewCount !== undefined" class="flex items-center gap-1">
            <Eye class="size-3.5" />{{ viewCount }}
          </span>
          <span class="flex items-center gap-1"><Heart class="size-3.5" />{{ likeCount }}</span>
          <span class="flex items-center gap-1">
            <MessageSquare class="size-3.5" />{{ commentCount }}
          </span>
          <button
            v-if="showBookmark"
            type="button"
            class="flex items-center transition-colors"
            :class="isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'"
            @click.prevent.stop="emit('bookmark-toggle')"
          >
            <BookmarkCheck v-if="isBookmarked" class="size-3.5" />
            <Bookmark v-else class="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  </button>

  <NuxtLink v-else :to="`/community/${id}`" class="block border-b border-border py-1">
    <div
      class="flex flex-col gap-2 rounded-lg px-2 pt-3 pb-2.5 transition-colors hover:bg-muted/60"
    >
      <div class="flex items-start gap-2.5">
        <template v-if="recruitmentStatus !== null && recruitmentStatus !== undefined">
          <span
            class="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
            :class="
              recruitmentStatus === 'open'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-muted text-muted-foreground'
            "
          >
            {{ recruitmentStatus === 'open' ? '모집중' : '모집완료' }}
          </span>
        </template>
        <h3 class="line-clamp-2 font-bold leading-6 text-foreground">{{ title }}</h3>
      </div>
      <p v-if="excerpt" class="line-clamp-1 text-sm leading-5 text-muted-foreground">
        {{ excerpt }}
      </p>
      <div class="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>{{ author }} · {{ createdAt }}</span>
        <div class="flex shrink-0 items-center gap-3">
          <span v-if="viewCount !== undefined" class="flex items-center gap-1">
            <Eye class="size-3.5" />{{ viewCount }}
          </span>
          <span class="flex items-center gap-1"><Heart class="size-3.5" />{{ likeCount }}</span>
          <span class="flex items-center gap-1">
            <MessageSquare class="size-3.5" />{{ commentCount }}
          </span>
          <button
            v-if="showBookmark"
            type="button"
            class="flex items-center transition-colors"
            :class="isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'"
            @click.prevent.stop="emit('bookmark-toggle')"
          >
            <BookmarkCheck v-if="isBookmarked" class="size-3.5" />
            <Bookmark v-else class="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
