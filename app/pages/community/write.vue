<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, ImagePlus, X, Plus } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const showLoginModal = ref(false)

const category = ref('')
const title = ref('')
const body = ref('')
const imageFiles = ref<Array<{ file: File; preview: string }>>([])

const MAX_BODY = 5000
const MAX_IMAGES = 10
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const categoryOptions = [
  { label: '피드백', value: '피드백' },
  { label: '프로젝트 모집', value: '프로젝트 모집' },
  { label: '스터디 모집', value: '스터디 모집' },
]

const isFeedback = computed(() => category.value === '피드백')
const canSubmit = computed(
  () => !!category.value && title.value.trim().length > 0 && body.value.trim().length > 0
)

function addImages(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  for (const file of files) {
    if (imageFiles.value.length >= MAX_IMAGES) break
    if (file.size > MAX_IMAGE_SIZE) continue
    imageFiles.value.push({ file, preview: URL.createObjectURL(file) })
  }
  input.value = ''
}

function removeImage(index: number) {
  const item = imageFiles.value[index]
  if (item) URL.revokeObjectURL(item.preview)
  imageFiles.value.splice(index, 1)
}

function handleSubmit() {
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
    return
  }
  if (!canSubmit.value) return
  // 실제 submit 로직은 3차 구현에서 API 연동
  navigateTo('/community')
}
</script>

<template>
  <div class="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-10">
    <NuxtLink
      to="/community"
      class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="size-4" />
      커뮤니티
    </NuxtLink>

    <h1 class="text-2xl font-black text-foreground">글 작성</h1>

    <div class="mt-6 grid gap-5">
      <!-- 카테고리 -->
      <div>
        <label class="text-sm font-bold text-foreground">카테고리</label>
        <AppSelect
          v-model="category"
          :options="categoryOptions"
          placeholder="카테고리를 선택해주세요"
          class="mt-2"
        />
      </div>

      <!-- 제목 -->
      <div>
        <label class="text-sm font-bold text-foreground">제목</label>
        <AppInput v-model="title" placeholder="제목을 입력해주세요" class="mt-2" />
      </div>

      <!-- 본문 -->
      <div>
        <label class="text-sm font-bold text-foreground">본문</label>
        <AppTextarea
          v-model="body"
          placeholder="내용을 입력해주세요."
          :rows="10"
          :maxlength="MAX_BODY"
          :show-count="true"
          class="mt-2"
        />
      </div>

      <!-- 이미지 업로드 -->
      <div>
        <label class="text-sm font-bold text-foreground">
          이미지
          <span class="ml-1 font-normal text-muted-foreground">
            (선택 · {{ imageFiles.length }}/{{ MAX_IMAGES }}장 · 장당 5MB 이하)
          </span>
        </label>
        <div class="mt-2 flex flex-wrap gap-2">
          <!-- 업로드된 이미지 미리보기 -->
          <div
            v-for="(img, i) in imageFiles"
            :key="i"
            class="relative size-20 overflow-hidden rounded-lg bg-muted"
          >
            <img :src="img.preview" :alt="`이미지 ${i + 1}`" class="h-full w-full object-cover" />
            <button
              type="button"
              class="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              @click="removeImage(i)"
            >
              <X class="size-3" />
            </button>
          </div>

          <!-- 추가 버튼 -->
          <label
            v-if="imageFiles.length < MAX_IMAGES"
            class="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:bg-accent"
          >
            <Plus class="size-5" />
            <span class="text-xs">추가</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              class="sr-only"
              @change="addImages"
            />
          </label>
        </div>
      </div>

      <!-- 분석 결과 첨부 (피드백 카테고리만) -->
      <div v-if="isFeedback">
        <label class="text-sm font-bold text-foreground">
          분석 결과 첨부
          <span class="ml-1 font-normal text-muted-foreground">(선택)</span>
        </label>
        <button
          type="button"
          class="mt-2 flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-blue-200 bg-accent/50 p-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent"
        >
          <ImagePlus class="size-4 text-primary" />
          내 분석 결과 첨부하기
        </button>
      </div>

      <!-- 알림 -->
      <AppAlert>
        게시글 본문의 URL은 자동으로 링크로 변환돼요. 이미지는 본문 하단에 갤러리로 표시됩니다.
      </AppAlert>

      <!-- 버튼 -->
      <div class="flex justify-end gap-3">
        <NuxtLink to="/community">
          <AppButton variant="outline">취소</AppButton>
        </NuxtLink>
        <AppButton :disabled="!canSubmit" @click="handleSubmit">게시하기</AppButton>
      </div>
    </div>
  </div>

  <LoginModal
    :open="showLoginModal"
    context="글쓰기"
    description="로그인하고 커뮤니티에 글을 작성해보세요."
    @close="showLoginModal = false"
  />
</template>
