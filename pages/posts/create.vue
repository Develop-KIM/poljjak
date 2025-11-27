<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <div class="bg-white dark:bg-dark rounded-lg shadow-lg p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-bold mb-6">게시글 작성</h1>

        <form @submit.prevent="handleSubmit">
          <!-- 카테고리 -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              카테고리 <span class="text-red-500">*</span>
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="category in categories.filter((c) => c.id !== 'all')"
                :key="category.id"
                type="button"
                @click="form.category = category.id"
                :class="[
                  'px-4 py-2 rounded-lg border transition flex items-center gap-2',
                  form.category === category.id
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary text-gray-700 dark:text-gray-300',
                ]"
              >
                <component :is="category.icon" class="w-4 h-4" />
                {{ category.name }}
              </button>
            </div>
            <p v-if="!form.category || form.category === 'all'" class="text-xs text-red-500 mt-1">
              카테고리를 선택해주세요
            </p>
          </div>

          <!-- 제목 -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              제목 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="제목을 입력하세요 (최대 100자)"
              maxlength="100"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              required
            />
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {{ form.title.length }} / 100
            </div>
          </div>

          <!-- 내용 -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              내용 <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="form.content"
              placeholder="내용을 입력하세요"
              rows="15"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
              required
            ></textarea>
          </div>

          <!-- 버튼 -->
          <div class="flex gap-3 justify-end">
            <button
              type="button"
              @click="handleCancel"
              class="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="loading || !isFormValid"
              class="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span v-if="loading" class="animate-spin">⏳</span>
              {{ loading ? '작성 중...' : '작성하기' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CATEGORIES } from '~/constants/categories'

const { isAuthenticated } = useAuth()
const router = useRouter()

if (!isAuthenticated.value) {
  navigateTo('/login')
}

const categories = CATEGORIES
const loading = ref(false)
const form = ref({
  category: null,
  title: '',
  content: '',
})

const isFormValid = computed(() => {
  return (
    form.value.category &&
    form.value.category !== 'all' &&
    form.value.title.trim().length > 0 &&
    form.value.content.trim().length > 0
  )
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    alert('모든 필수 항목을 입력해주세요.')
    return
  }

  loading.value = true

  try {
    const { fetchWithAuth } = useApi()
    const response = await fetchWithAuth('/api/posts', {
      method: 'POST',
      body: {
        category: form.value.category,
        title: form.value.title.trim(),
        content: form.value.content.trim(),
      },
    })

    alert('게시글이 작성되었습니다!')
    router.push(`/posts/${response.id}`)
  } catch (error) {
    console.error('게시글 작성 실패:', error)

    // 서버 에러 메시지 표시
    const errorMessage = error.data?.message || '게시글 작성에 실패했습니다.'
    alert(errorMessage)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  if (confirm('작성을 취소하시겠습니까?')) {
    router.back()
  }
}
</script>
