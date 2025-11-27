<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <div class="bg-white dark:bg-dark rounded-lg shadow-lg p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-bold mb-6">게시글 수정</h1>

        <!-- 로딩 -->
        <div v-if="pageLoading" class="text-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>

        <!-- 폼 -->
        <form v-else @submit.prevent="handleSubmit">
          <!-- 카테고리 -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              카테고리
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
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary',
                ]"
              >
                <component :is="category.icon" class="w-4 h-4" />
                {{ category.name }}
              </button>
            </div>
          </div>

          <!-- 제목 -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              제목
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
              내용
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
              :disabled="loading"
              class="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span v-if="loading" class="animate-spin">⏳</span>
              {{ loading ? '수정 중...' : '수정하기' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CATEGORIES } from '~/constants/categories'

const route = useRoute()
const router = useRouter()
const { isAuthenticated } = useAuth()

if (!isAuthenticated.value) {
  navigateTo('/login')
}

const categories = CATEGORIES
const pageLoading = ref(true)
const loading = ref(false)
const form = ref({
  category: 'dev',
  title: '',
  content: '',
})

const fetchPost = async () => {
  try {
    const post = await $fetch(`/api/posts/${route.params.id}`)
    form.value.category = post.category || 'dev'
    form.value.title = post.title
    form.value.content = post.content
  } catch (error) {
    console.error('게시글 로딩 실패:', error)
    alert('게시글을 불러올 수 없습니다.')
    router.push('/community')
  } finally {
    pageLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    alert('제목과 내용을 입력해주세요.')
    return
  }

  loading.value = true

  try {
    const { fetchWithAuth } = useApi()
    await fetchWithAuth(`/api/posts/${route.params.id}`, {
      method: 'PUT',
      body: {
        category: form.value.category,
        title: form.value.title,
        content: form.value.content,
      },
    })

    alert('게시글이 수정되었습니다!')
    router.push(`/posts/${route.params.id}`)
  } catch (error) {
    console.error('게시글 수정 실패:', error)
    alert('게시글 수정에 실패했습니다.')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  if (confirm('수정을 취소하시겠습니까?')) {
    router.back()
  }
}

onMounted(() => {
  fetchPost()
})
</script>
