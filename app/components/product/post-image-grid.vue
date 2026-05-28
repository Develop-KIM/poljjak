<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ urls: string[] }>()

const normalizedUrls = computed(() => props.urls.map((url) => url.trim()).filter(Boolean))
const displayed = computed(() => normalizedUrls.value.slice(0, 10))
const remaining = computed(() => Math.max(0, normalizedUrls.value.length - 9))

const gridClass = computed(() => {
  const len = displayed.value.length
  if (len === 2) return 'grid-cols-2'
  return 'grid-cols-3'
})

const lightboxIndex = ref<number | null>(null)
function openLightbox(i: number) {
  lightboxIndex.value = i
}
</script>

<template>
  <div v-if="displayed.length > 0">
    <div v-if="displayed.length === 1" class="flex justify-center">
      <button
        type="button"
        class="inline-flex max-w-full overflow-hidden rounded-xl border border-border bg-muted"
        @click="openLightbox(0)"
      >
        <img
          :src="displayed[0]"
          alt="첨부 이미지"
          class="block h-auto max-h-[640px] max-w-full object-contain"
          loading="lazy"
          decoding="async"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
      </button>
    </div>

    <div v-else :class="['grid gap-2', gridClass]">
      <button
        v-for="(url, i) in displayed"
        :key="i"
        type="button"
        class="relative aspect-square overflow-hidden rounded-lg bg-muted"
        @click="openLightbox(i)"
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
      </button>
    </div>
  </div>

  <!-- 라이트박스 -->
  <ImageLightbox
    v-if="lightboxIndex !== null"
    :urls="normalizedUrls"
    :initial-index="lightboxIndex"
    @close="lightboxIndex = null"
  />
</template>
