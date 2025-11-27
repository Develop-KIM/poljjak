<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- 로딩 -->
      <div v-if="loading" class="text-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p class="text-gray-500 dark:text-gray-400 mt-4">로딩 중...</p>
      </div>

      <div v-else-if="post" class="bg-white dark:bg-dark rounded-lg shadow-lg p-6 md:p-8">
        <div class="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
          <h1 class="text-2xl md:text-3xl font-bold mb-4">{{ post.title }}</h1>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium text-gray-900 dark:text-white">{{ post.author.name }}</span>
              <span>{{ formatDate(post.createdAt) }}</span>
              <span class="flex items-center gap-1">
                <EyeIcon class="w-4 h-4" />
                {{ post.viewCount }}
              </span>
            </div>

            <!-- 수정/삭제 버튼 (작성자만) -->
            <div v-if="isAuthor" class="flex gap-2">
              <NuxtLink
                :to="`/posts/${post.id}/edit`"
                class="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition no-underline"
              >
                수정
              </NuxtLink>
              <button
                @click="handleDelete"
                class="px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                삭제
              </button>
            </div>
          </div>
        </div>

        <!-- 내용 -->
        <div class="prose dark:prose-invert max-w-none mb-8">
          <div class="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{{ post.content }}</div>
        </div>

        <!-- 첨부파일 -->
        <div
          v-if="post.files && post.files.length > 0"
          class="border-t border-gray-200 dark:border-gray-700 pt-6 mb-8"
        >
          <h3 class="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">첨부파일</h3>
          <div class="space-y-2">
            <a
              v-for="file in post.files"
              :key="file.id"
              :href="file.filePath"
              target="_blank"
              class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition no-underline"
            >
              <DocumentIcon class="w-5 h-5 text-gray-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ file.originalName }}</span>
              <span class="text-xs text-gray-500 ml-auto">{{ formatFileSize(file.fileSize) }}</span>
            </a>
          </div>
        </div>

        <!-- 댓글 (TODO) -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 class="text-lg font-bold mb-4">댓글 {{ post.comments?.length || 0 }}</h3>
          <p class="text-gray-500 dark:text-gray-400 text-center py-8">
            댓글 기능은 추후 구현 예정입니다.
          </p>
        </div>
      </div>

      <!-- 에러 -->
      <div v-else class="text-center py-20">
        <DocumentTextIcon class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p class="text-gray-500 dark:text-gray-400 text-lg">게시글을 찾을 수 없습니다.</p>
        <NuxtLink to="/community" class="inline-block mt-4 text-primary hover:underline">
          목록으로 돌아가기
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { EyeIcon, DocumentIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const loading = ref(true)
const post = ref(null)

const isAuthor = computed(() => {
  return post.value && user.value && post.value.author.id === user.value.publicId
})

const fetchPost = async () => {
  try {
    post.value = await $fetch(`/api/posts/${route.params.id}`)
  } catch (error) {
    console.error('게시글 로딩 실패:', error)
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    const { fetchWithAuth } = useApi()
    await fetchWithAuth(`/api/posts/${route.params.id}`, {
      method: 'DELETE',
    })

    alert('게시글이 삭제되었습니다.')
    router.push('/community')
  } catch (error) {
    console.error('게시글 삭제 실패:', error)
    alert('게시글 삭제에 실패했습니다.')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

onMounted(() => {
  fetchPost()
})
</script>
