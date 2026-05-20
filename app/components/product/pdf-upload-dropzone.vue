<script setup lang="ts">
import { ref } from 'vue'
import { FileUp, FileText, X } from '@lucide/vue'

const MAX_SIZE_BYTES = 10 * 1024 * 1024

const emit = defineEmits<{
  'update:file': [file: File | null]
}>()

const selectedFile = ref<File | null>(null)
const errorMessage = ref<string | null>(null)
const isDragging = ref(false)

function validate(f: File): string | null {
  if (f.type !== 'application/pdf') return 'PDF 파일만 가능합니다'
  if (f.size > MAX_SIZE_BYTES) return '파일 크기가 10MB를 초과해요'
  return null
}

function select(f: File) {
  const err = validate(f)
  if (err) {
    errorMessage.value = err
    selectedFile.value = null
    emit('update:file', null)
    return
  }
  errorMessage.value = null
  selectedFile.value = f
  emit('update:file', f)
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) select(f)
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) select(f)
}

function clear() {
  selectedFile.value = null
  errorMessage.value = null
  emit('update:file', null)
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}
</script>

<template>
  <div>
    <label
      v-if="!selectedFile"
      for="portfolio-pdf"
      class="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors"
      :class="[
        errorMessage
          ? 'border-destructive/40 bg-red-50/50'
          : isDragging
            ? 'border-primary bg-accent'
            : 'border-blue-200 bg-accent/50 hover:border-primary hover:bg-accent',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <span
        class="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-white text-primary ring-1 ring-blue-100"
      >
        <FileUp class="size-6" />
      </span>
      <span class="text-base font-bold text-foreground">PDF 포트폴리오를 올려주세요</span>
      <span class="mt-2 text-sm leading-6 text-muted-foreground">
        파일을 끌어오거나 클릭해서 선택할 수 있어요
      </span>
      <span class="mt-4 flex flex-wrap justify-center gap-2">
        <AppBadge variant="blue">PDF 전용</AppBadge>
        <AppBadge variant="gray">10MB 이하</AppBadge>
        <AppBadge variant="gray">최대 50페이지</AppBadge>
      </span>
      <input
        id="portfolio-pdf"
        type="file"
        accept="application/pdf"
        class="sr-only"
        @change="onFileInput"
      />
    </label>

    <div v-else class="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent">
        <FileText class="size-5 text-primary" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-foreground">{{ selectedFile.name }}</p>
        <p class="mt-0.5 text-xs text-muted-foreground">{{ formatMB(selectedFile.size) }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
        @click="clear"
      >
        <X class="size-4" />
        <span class="sr-only">파일 제거</span>
      </button>
    </div>

    <p v-if="errorMessage" class="mt-2 text-sm text-destructive">{{ errorMessage }}</p>
  </div>
</template>
