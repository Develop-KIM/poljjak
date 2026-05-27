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

const GROUP_SIZE = 10

// 현재 페이지가 속한 그룹의 시작·끝 페이지
const groupStart = computed(() => Math.floor((props.current - 1) / GROUP_SIZE) * GROUP_SIZE + 1)
const groupEnd = computed(() => Math.min(groupStart.value + GROUP_SIZE - 1, props.total))

const pages = computed(() =>
  Array.from({ length: groupEnd.value - groupStart.value + 1 }, (_, i) => groupStart.value + i),
)

const hasPrevGroup = computed(() => groupStart.value > 1)
const hasNextGroup = computed(() => groupEnd.value < props.total)
</script>

<template>
  <div class="flex items-center justify-center gap-1">
    <!-- 이전 페이지 -->
    <button
      type="button"
      class="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
      :disabled="current <= 1"
      @click="emit('change', current - 1)"
    >
      <ChevronLeft class="size-4" />
    </button>

    <!-- 이전 그룹 (...) -->
    <button
      v-if="hasPrevGroup"
      type="button"
      class="flex size-8 items-center justify-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-muted"
      @click="emit('change', groupStart - 1)"
    >
      ‹‹
    </button>

    <!-- 현재 그룹 페이지들 -->
    <button
      v-for="p in pages"
      :key="p"
      type="button"
      class="flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors"
      :class="p === current ? 'bg-primary text-white' : 'text-foreground hover:bg-muted'"
      @click="emit('change', p)"
    >
      {{ p }}
    </button>

    <!-- 다음 그룹 (...) -->
    <button
      v-if="hasNextGroup"
      type="button"
      class="flex size-8 items-center justify-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-muted"
      @click="emit('change', groupEnd + 1)"
    >
      ››
    </button>

    <!-- 다음 페이지 -->
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
