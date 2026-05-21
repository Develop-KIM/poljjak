<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ urls: string[] }>()

const normalizedUrls = computed(() => props.urls.map((url) => url.trim()).filter(Boolean))
const displayed = computed(() => normalizedUrls.value.slice(0, 10))
const remaining = computed(() => Math.max(0, normalizedUrls.value.length - 9))

const gridClass = computed(() => {
  const len = displayed.value.length
  if (len === 2) return 'grid-cols-2'
  return 'grid-cols-3'
})
</script>

<template>
  <div v-if="displayed.length > 0">
    <div v-if="displayed.length === 1" class="flex justify-center">
      <div class="inline-flex max-w-full overflow-hidden rounded-xl border border-border bg-muted">
        <img
          :src="displayed[0]"
          alt="첨부 이미지"
          class="block h-auto max-h-[640px] max-w-full object-contain"
          loading="lazy"
          decoding="async"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
      </div>
    </div>

    <div v-else :class="['grid gap-2', gridClass]">
      <div
        v-for="(url, i) in displayed"
        :key="i"
        class="relative aspect-square overflow-hidden rounded-lg bg-muted"
      >
        <img
          :src="url"
          :alt="`이미지 ${i + 1}`"
          class="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <div
          v-if="i === 8 && remaining > 0"
          class="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white"
        >
          +{{ remaining }}
        </div>
      </div>
    </div>
  </div>
</template>
