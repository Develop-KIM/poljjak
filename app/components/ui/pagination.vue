<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const props = defineProps<{
  current: number
  total: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

// 전체 10개 이하: 전부 표시 / 초과: 현재 페이지 주변 윈도우 + 첫·끝 페이지
const pages = computed((): (number | '...')[] => {
  const { current, total } = props
  if (total <= 10) return Array.from({ length: total }, (_, i) => i + 1)

  const result: (number | '...')[] = []
  const WINDOW = 2 // 현재 페이지 양쪽으로 보여줄 개수

  result.push(1)

  const start = Math.max(2, current - WINDOW)
  const end = Math.min(total - 1, current + WINDOW)

  if (start > 2) result.push('...')
  for (let i = start; i <= end; i++) result.push(i)
  if (end < total - 1) result.push('...')

  result.push(total)
  return result
})
</script>

<template>
  <div class="flex items-center justify-center gap-1">
    <button
      type="button"
      class="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
      :disabled="current <= 1"
      @click="emit('change', current - 1)"
    >
      <ChevronLeft class="size-4" />
    </button>

    <template v-for="p in pages" :key="String(p) + Math.random()">
      <span
        v-if="p === '...'"
        class="flex size-8 items-center justify-center text-sm text-muted-foreground select-none"
      >…</span>
      <button
        v-else
        type="button"
        class="flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors"
        :class="p === current ? 'bg-primary text-white' : 'text-foreground hover:bg-muted'"
        @click="emit('change', p)"
      >
        {{ p }}
      </button>
    </template>

    <button
      type="button"
      class="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
      :disabled="current >= total"
      @click="emit('change', current + 1)"
    >
      <ChevronRight class="size-4" />
    </button>
  </div>
</template>
