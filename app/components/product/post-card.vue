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
    class="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-slate-50"
  >
    <AppBadge :variant="badgeVariant[category]">{{ category }}</AppBadge>
    <h3 class="mt-3 line-clamp-2 font-semibold leading-6 text-foreground">{{ title }}</h3>
    <p v-if="excerpt" class="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
      {{ excerpt }}
    </p>
    <div class="mt-4 flex items-center justify-between gap-4">
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
  </NuxtLink>
</template>
