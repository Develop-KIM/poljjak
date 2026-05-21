<script setup lang="ts">
import { MessageSquare, Heart, Eye } from '@lucide/vue'

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
}>()
</script>

<template>
  <NuxtLink
    :to="`/community/${id}`"
    class="-mx-1 flex flex-col gap-2 border-b border-border px-1 py-5 transition-colors first:pt-0 hover:bg-muted/60"
  >
    <!-- 제목 행 -->
    <div class="flex items-start gap-2.5">
      <!-- 모집 상태 배지 (project·study만) -->
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

    <!-- 본문 발췌 -->
    <p v-if="excerpt" class="line-clamp-1 text-sm leading-5 text-muted-foreground">
      {{ excerpt }}
    </p>

    <!-- 메타 행 -->
    <div class="flex items-center justify-between gap-4 text-xs text-muted-foreground">
      <span>{{ author }} · {{ createdAt }}</span>
      <div class="flex shrink-0 items-center gap-3">
        <span v-if="viewCount !== undefined" class="flex items-center gap-1">
          <Eye class="size-3.5" />{{ viewCount }}
        </span>
        <span class="flex items-center gap-1"> <Heart class="size-3.5" />{{ likeCount }} </span>
        <span class="flex items-center gap-1">
          <MessageSquare class="size-3.5" />{{ commentCount }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
