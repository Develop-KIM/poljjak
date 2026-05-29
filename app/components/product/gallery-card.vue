<script setup lang="ts">
import { ref } from 'vue'
import { AlertCircle } from '@lucide/vue'

interface GalleryItem {
  id: string
  shareToken: string
  jobRole: string | null
  seniority: string | null
  pdfUrl: string | null
  issueCount: number
  summary: string | null
  createdAt: string
}

defineProps<{ item: GalleryItem }>()

const JOB_ROLE_LABELS: Record<string, string> = {
  frontend: '프론트엔드',
  backend: '백엔드',
  fullstack: '풀스택',
  devops: 'DevOps',
  ml: 'ML/AI',
}
const SENIORITY_LABELS: Record<string, string> = {
  junior: '신입',
  mid: '주니어',
  senior: '시니어',
}

const thumbnailError = ref(false)
const thumbnailLoaded = ref(false)

function onThumbnailLoaded() {
  thumbnailLoaded.value = true
}
function onThumbnailError() {
  thumbnailError.value = true
}
</script>

<template>
  <NuxtLink
    :to="`/analysis/share/${item.shareToken}`"
    class="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
  >
    <!-- PDF 썸네일 -->
    <div class="relative aspect-[3/4] w-full overflow-hidden bg-muted/50">
      <ClientOnly>
        <vue-pdf-embed
          v-if="item.pdfUrl && !thumbnailError"
          :source="item.pdfUrl"
          :page="1"
          class="w-full"
          @loaded="onThumbnailLoaded"
          @loading-failed="onThumbnailError"
        />
        <template #fallback>
          <div class="flex h-full items-center justify-center">
            <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        </template>
      </ClientOnly>
      <div
        v-if="thumbnailError || !item.pdfUrl"
        class="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"
      >
        <AlertCircle class="size-8 opacity-30" />
        <p class="text-xs">미리보기 없음</p>
      </div>
    </div>

    <!-- 카드 정보 -->
    <div class="flex flex-1 flex-col gap-2 p-4">
      <!-- 뱃지 -->
      <div class="flex flex-wrap gap-1.5">
        <span
          v-if="item.jobRole"
          class="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground"
        >
          {{ JOB_ROLE_LABELS[item.jobRole] ?? item.jobRole }}
        </span>
        <span
          v-if="item.seniority"
          class="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground"
        >
          {{ SENIORITY_LABELS[item.seniority] ?? item.seniority }}
        </span>
      </div>

      <!-- AI 총평 -->
      <p v-if="item.summary" class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {{ item.summary }}
      </p>
      <p v-else class="text-sm text-muted-foreground/50">총평 없음</p>

      <!-- 이슈 개수 -->
      <div class="mt-auto pt-1">
        <span class="text-xs font-semibold text-muted-foreground">
          이슈 {{ item.issueCount }}개
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
