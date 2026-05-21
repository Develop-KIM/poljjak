<script setup lang="ts">
import { ref } from 'vue'
import { ImagePlus, X } from '@lucide/vue'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [urls: string[]] }>()

const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const MAX_IMAGES = 1

async function uploadFiles(files: File[]) {
  if (props.modelValue.length >= MAX_IMAGES) return

  const file = files[0]
  if (!file) return

  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await $fetch<{ data: { url: string } }>('/api/uploads/image', {
      method: 'POST',
      body: form,
    })
    emit('update:modelValue', [res.data.url])
  } catch {
    // 실패 시 무시
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function onFileChange(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  await uploadFiles(files)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
    ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type),
  )
  uploadFiles(files)
}

function removeImage() {
  emit('update:modelValue', [])
}
</script>

<template>
  <div>
    <label class="text-sm font-bold text-foreground">이미지<span class="ml-1 font-normal text-muted-foreground">(선택)</span></label>

    <!-- 미리보기 -->
    <div v-if="modelValue.length > 0" class="mt-2 relative w-fit">
      <img
        :src="modelValue[0]"
        alt="첨부 이미지"
        class="max-h-64 rounded-xl border border-border object-cover"
      />
      <button
        type="button"
        class="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        @click="removeImage"
      >
        <X class="size-3.5" />
      </button>
    </div>

    <!-- 드롭존 -->
    <div
      v-else
      class="mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors"
      :class="
        isDragging
          ? 'border-primary bg-accent/40'
          : 'border-border hover:border-primary hover:bg-accent/20'
      "
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <ImagePlus class="size-7 text-muted-foreground" />
      <p class="mt-2 text-sm font-semibold text-foreground">
        {{ uploading ? '업로드 중...' : '이미지를 드래그하거나 클릭해서 추가' }}
      </p>
      <p class="mt-1 text-xs text-muted-foreground">JPG, PNG, GIF, WEBP · 최대 5MB</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>
