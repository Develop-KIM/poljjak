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

const pages = computed(() =>
  Array.from({ length: props.total }, (_, i) => i + 1)
)
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
