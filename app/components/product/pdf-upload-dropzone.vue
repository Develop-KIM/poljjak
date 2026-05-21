<script setup lang="ts">
import { ref } from 'vue'
import { FileUp, FileText, X } from '@lucide/vue'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const MAX_FILES = 5

const emit = defineEmits<{
  'update:files': [files: File[]]
}>()

const selectedFiles = ref<File[]>([])
const errorMessage = ref<string | null>(null)
const isDragging = ref(false)

function validate(f: File): string | null {
  if (f.type !== 'application/pdf') return `${f.name}: PDF 파일만 가능합니다`
  if (f.size > MAX_SIZE_BYTES) return `${f.name}: 파일 크기가 10MB를 초과해요`
  return null
}

function addFiles(newFiles: File[]) {
  errorMessage.value = null
  const merged = [...selectedFiles.value]

  for (const f of newFiles) {
    if (merged.length >= MAX_FILES) {
      errorMessage.value = `최대 ${MAX_FILES}개까지 업로드할 수 있어요`
      break
    }
    const err = validate(f)
    if (err) { errorMessage.value = err; continue }
    if (!merged.find((m) => m.name === f.name)) merged.push(f)
  }

  selectedFiles.value = merged
  emit('update:files', merged)
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length) addFiles(files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length) addFiles(files)
}

function remove(index: number) {
  selectedFiles.value.splice(index, 1)
  emit('update:files', [...selectedFiles.value])
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}
</script>

<template>
  <div>
    <!-- 드롭존 (파일 없거나 추가 가능할 때) -->
    <label
      v-if="selectedFiles.length < MAX_FILES"
      for="portfolio-pdf"
      class="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors"
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
      <span class="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-white text-primary ring-1 ring-blue-100">
        <FileUp class="size-6" />
      </span>
      <span class="text-base font-bold text-foreground">
        {{ selectedFiles.length > 0 ? 'PDF 파일 추가하기' : 'PDF 포트폴리오를 올려주세요' }}
      </span>
      <span class="mt-1.5 text-sm text-muted-foreground">
        파일을 끌어오거나 클릭해서 선택 · 최대 {{ MAX_FILES }}개
      </span>
      <span class="mt-3 flex flex-wrap justify-center gap-2">
        <AppBadge variant="blue">PDF 전용</AppBadge>
        <AppBadge variant="gray">파일당 10MB 이하</AppBadge>
      </span>
      <input
        id="portfolio-pdf"
        type="file"
        accept="application/pdf"
        multiple
        class="sr-only"
        @change="onFileInput"
      />
    </label>

    <!-- 선택된 파일 목록 -->
    <div v-if="selectedFiles.length > 0" class="mt-3 grid gap-2">
      <div
        v-for="(file, i) in selectedFiles"
        :key="file.name"
        class="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5"
      >
        <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent">
          <FileText class="size-4 text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-foreground">{{ file.name }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ formatMB(file.size) }}</p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
          @click="remove(i)"
        >
          <X class="size-4" />
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="mt-2 text-sm text-destructive">{{ errorMessage }}</p>
  </div>
</template>
