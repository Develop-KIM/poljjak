<script setup lang="ts">
import { MessageSquare, Heart } from '@lucide/vue'

type PostCategory = '피드백' | '프로젝트 모집' | '스터디 모집'

defineProps<{
  id: string
  category: PostCategory
  title: string
  excerpt?: string
  author: string
  commentCount: number
  likeCount: number
  createdAt: string
  thumbnailUrl?: string | null
}>()

const badgeVariant: Record<PostCategory, 'blue' | 'green' | 'yellow'> = {
  피드백: 'blue',
  '프로젝트 모집': 'green',
  '스터디 모집': 'yellow',
}
</script>

<template>
  <NuxtLink
    :to="`/community/${id}`"
    class="flex h-full flex-col rounded-lg border border-border bg-card transition-colors hover:border-primary/30 hover:bg-slate-50"
  >
    <!-- 썸네일 (피드백은 이미지 없으면 영역 숨김) -->
    <div
      v-if="thumbnailUrl || category !== '피드백'"
      class="aspect-video w-full overflow-hidden rounded-t-lg"
    >
      <img
        v-if="thumbnailUrl"
        :src="thumbnailUrl"
        alt=""
        class="h-full w-full object-cover"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center"
        :class="category === '프로젝트 모집' ? 'bg-emerald-50' : 'bg-amber-50'"
      >
        <span
          class="text-4xl font-black opacity-20"
          :class="category === '프로젝트 모집' ? 'text-emerald-600' : 'text-amber-600'"
        >{{ category[0] }}</span>
      </div>
    </div>

    <div class="flex flex-1 flex-col p-5">
      <AppBadge :variant="badgeVariant[category]" class="self-start">{{ category }}</AppBadge>
      <h3 class="mt-3 line-clamp-2 font-semibold leading-6 text-foreground">{{ title }}</h3>
      <p v-if="excerpt" class="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
        {{ excerpt }}
      </p>
      <div class="mt-auto pt-4 flex items-center justify-between gap-4">
        <span class="truncate text-sm text-muted-foreground">{{ author }}</span>
        <div class="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <MessageSquare class="size-3.5" />
            {{ commentCount }}
          </span>
          <span class="flex items-center gap-1">
            <Heart class="size-3.5" />
            {{ likeCount }}
          </span>
          <span>{{ createdAt }}</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
