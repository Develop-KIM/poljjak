<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ urls: string[] }>()

const displayed = computed(() => props.urls.slice(0, 10))
const remaining = computed(() => Math.max(0, props.urls.length - 9))

const gridClass = computed(() => {
  const len = displayed.value.length
  if (len === 1) return 'grid-cols-1 max-w-sm'
  if (len === 2) return 'grid-cols-2'
  return 'grid-cols-3'
})
</script>

<template>
  <div v-if="urls.length > 0" :class="['grid gap-2', gridClass]">
    <div
      v-for="(url, i) in displayed"
      :key="i"
      class="relative aspect-square overflow-hidden rounded-lg bg-muted"
    >
      <img :src="url" :alt="`이미지 ${i + 1}`" class="h-full w-full object-cover" />
      <div
        v-if="i === 8 && remaining > 0"
        class="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white"
      >
        +{{ remaining }}
      </div>
    </div>
  </div>
</template>
