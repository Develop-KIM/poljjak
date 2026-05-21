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

// 최대 7개 버튼 표시 (... 포함)
const pages = computed(() => {
  const { current, total } = props
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const result: (number | '...')[] = [1]

  if (current > 3) result.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) result.push(i)

  if (current < total - 2) result.push('...')
  result.push(total)

  return result
})
</script>

<template>
  <div class="flex items-center justify-center gap-1">
    <button
      type="button"
      class="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 disabled:opacity-30"
      :disabled="current <= 1"
      @click="emit('change', current - 1)"
    >
      <ChevronLeft class="size-4" />
    </button>

    <template v-for="p in pages" :key="p">
      <span
        v-if="p === '...'"
        class="flex size-8 items-center justify-center text-sm text-muted-foreground"
      >…</span>
      <button
        v-else
        type="button"
        class="flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors"
        :class="p === current
          ? 'bg-primary text-white'
          : 'text-foreground hover:bg-slate-100'"
        @click="emit('change', p as number)"
      >
        {{ p }}
      </button>
    </template>

    <button
      type="button"
      class="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 disabled:opacity-30"
      :disabled="current >= total"
      @click="emit('change', current + 1)"
    >
      <ChevronRight class="size-4" />
    </button>
  </div>
</template>
