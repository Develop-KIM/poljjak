<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { X, ChevronLeft, ChevronRight } from '@lucide/vue'

const props = defineProps<{
  urls: string[]
  initialIndex?: number
}>()

const emit = defineEmits<{ close: [] }>()

const current = ref(props.initialIndex ?? 0)
const hasPrev = computed(() => current.value > 0)
const hasNext = computed(() => current.value < props.urls.length - 1)

function prev() {
  if (hasPrev.value) current.value--
}
function next() {
  if (hasNext.value) current.value++
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
  else if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      @click.self="emit('close')"
    >
      <!-- 닫기 -->
      <button
        type="button"
        class="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        @click="emit('close')"
      >
        <X class="size-5" />
      </button>

      <!-- 이전 -->
      <button
        v-if="hasPrev"
        type="button"
        class="absolute left-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        @click="prev"
      >
        <ChevronLeft class="size-6" />
      </button>

      <!-- 이미지 -->
      <img
        :src="urls[current]"
        :alt="`이미지 ${current + 1}`"
        class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
      />

      <!-- 다음 -->
      <button
        v-if="hasNext"
        type="button"
        class="absolute right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        @click="next"
      >
        <ChevronRight class="size-6" />
      </button>

      <!-- 인디케이터 -->
      <div v-if="urls.length > 1" class="absolute bottom-4 flex gap-1.5">
        <div
          v-for="(_, i) in urls"
          :key="i"
          class="size-1.5 rounded-full transition-colors"
          :class="i === current ? 'bg-white' : 'bg-white/40'"
        />
      </div>
    </div>
  </Teleport>
</template>
