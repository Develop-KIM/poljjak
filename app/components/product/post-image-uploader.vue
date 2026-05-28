<script setup lang="ts">
import { ref } from 'vue'
import { ImagePlus, X, Loader2 } from '@lucide/vue'

const props = defineProps<{
  modelValue: string[]
  /** 최대 업로드 장수 (기본 1) */
  maxImages?: number
}>()
const emit = defineEmits<{ 'update:modelValue': [urls: string[]] }>()

const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const toast = useToastStore()

const maxCount = computed(() => props.maxImages ?? 1)
const canAdd = computed(() => props.modelValue.length < maxCount.value)

async function uploadFiles(files: File[]) {
  if (!canAdd.value) return
  const allowed = files.filter((f) =>
    ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type)
  )
  const toUpload = allowed.slice(0, maxCount.value - props.modelValue.length)
  if (toUpload.length === 0) return

  uploading.value = true
  try {
    const uploaded = await Promise.all(
      toUpload.map(async (file) => {
        const form = new FormData()
        form.append('file', file)
        const res = await $fetch<{ data: { url: string } }>('/api/uploads/image', {
          method: 'POST',
          body: form,
        })
        return res.data.url
      })
    )
    emit('update:modelValue', [...props.modelValue, ...uploaded])
  } catch {
    toast.error('이미지 업로드에 실패했어요')
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
  const files = Array.from(e.dataTransfer?.files ?? [])
  uploadFiles(files)
}

function removeImage(index: number) {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}
</script>

<template>
  <div>
    <label class="text-sm font-bold text-foreground">
      이미지
      <span class="ml-1 font-normal text-muted-foreground">
        (선택{{ maxCount > 1 ? ` · 최대 ${maxCount}장` : '' }})
      </span>
    </label>

    <!-- 미리보기 썸네일 목록 -->
    <div v-if="modelValue.length > 0" class="mt-2 flex flex-wrap gap-2">
      <div
        v-for="(url, i) in modelValue"
        :key="url"
        class="relative size-24 overflow-hidden rounded-xl border border-border"
      >
        <img :src="url" alt="첨부 이미지" class="h-full w-full object-cover" />
        <button
          type="button"
          class="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          @click="removeImage(i)"
        >
          <X class="size-3" />
        </button>
      </div>

      <!-- 추가 버튼 (최대 미만일 때) -->
      <button
        v-if="canAdd"
        type="button"
        class="flex size-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border transition-colors hover:border-primary hover:bg-accent/20"
        :disabled="uploading"
        @click="fileInput?.click()"
      >
        <Loader2 v-if="uploading" class="size-5 animate-spin text-muted-foreground" />
        <ImagePlus v-else class="size-5 text-muted-foreground" />
        <span class="mt-1 text-xs text-muted-foreground"
          >{{ modelValue.length }}/{{ maxCount }}</span
        >
      </button>
    </div>

    <!-- 드롭존 (이미지 없을 때) -->
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
      <Loader2 v-if="uploading" class="size-7 animate-spin text-muted-foreground" />
      <ImagePlus v-else class="size-7 text-muted-foreground" />
      <p class="mt-2 text-sm font-semibold text-foreground">
        {{ uploading ? '업로드 중...' : '이미지를 드래그하거나 클릭해서 추가' }}
      </p>
      <p class="mt-1 text-xs text-muted-foreground">JPG, PNG, GIF, WEBP · 최대 5MB</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      :multiple="maxCount > 1"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>
