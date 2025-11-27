<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 카테고리 모달 (모바일) -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showCategoryModal"
          @click="showCategoryModal = false"
          class="md:hidden fixed inset-0 bg-black/50 z-50 flex items-end"
        >
          <div @click.stop class="bg-white dark:bg-dark w-full rounded-t-2xl p-6 animate-slide-up">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg">카테고리</h3>
              <button
                @click="showCategoryModal = false"
                class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
              >
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>
            <nav class="space-y-2">
              <button
                v-for="category in categories"
                :key="category.id"
                @click="selectCategory(category.id)"
                :class="[
                  'w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3',
                  selectedCategory === category.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                ]"
              >
                <component :is="category.icon" class="w-5 h-5" />
                {{ category.name }}
              </button>
            </nav>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="container mx-auto px-4 py-6">
      <div class="flex gap-6">
        <!-- 사이드바 (데스크탑) -->
        <aside class="hidden md:block w-48 flex-shrink-0">
          <div class="bg-white dark:bg-dark rounded-lg p-4 sticky top-4 shadow-sm">
            <h3 class="font-bold text-sm text-gray-500 dark:text-gray-400 mb-3">카테고리</h3>
            <nav class="space-y-2">
              <button
                v-for="category in categories"
                :key="category.id"
                @click="selectedCategory = category.id"
                :class="[
                  'w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm flex items-center gap-2',
                  selectedCategory === category.id
                    ? 'bg-primary/10 text-primary font-semibold transform scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:transform hover:scale-105',
                ]"
              >
                <component :is="category.icon" class="w-4 h-4" />
                {{ category.name }}
              </button>
            </nav>
          </div>
        </aside>

        <!-- 메인 컨텐츠 -->
        <main class="flex-1">
          <!-- 헤더 -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <button
                  @click="showCategoryModal = true"
                  class="md:hidden flex items-center gap-2 px-3 py-2 bg-white dark:bg-dark rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary transition"
                >
                  <component :is="getCurrentCategoryIcon()" class="w-4 h-4" />
                  <span class="text-sm font-medium">{{ getCurrentCategoryName() }}</span>
                  <ChevronDownIcon
                    :class="[
                      'w-4 h-4 transition-transform duration-300',
                      showCategoryModal ? 'rotate-180' : 'rotate-0',
                    ]"
                  />
                </button>

                <h2 class="text-lg md:text-xl font-bold">
                  <span class="hidden md:inline">{{ getCurrentCategoryName() }}</span>
                  <span
                    class="text-gray-500 dark:text-gray-400 text-sm md:text-base font-normal md:ml-2"
                  >
                    포트폴리오 짝궁 찾기
                  </span>
                </h2>
              </div>

              <NuxtLink
                to="/posts/create"
                class="bg-primary text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-primary/90 hover:shadow-md transition-all duration-200 text-sm md:text-base whitespace-nowrap flex items-center gap-2 no-underline"
              >
                <PencilSquareIcon class="w-4 h-4" />
                글쓰기
              </NuxtLink>
            </div>

            <!-- 검색 -->
            <div class="w-full relative">
              <MagnifyingGlassIcon
                class="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="포트폴리오 피드백을 검색해보세요"
                class="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          </div>

          <!-- 로딩 -->
          <div v-if="loading" class="text-center py-20">
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
            ></div>
            <p class="text-gray-500 dark:text-gray-400 mt-4">로딩 중...</p>
          </div>

          <!-- 게시글 목록 -->
          <div v-else class="space-y-3">
            <NuxtLink
              v-for="post in posts"
              :key="post.id"
              :to="`/posts/${post.id}`"
              class="block bg-white dark:bg-dark rounded-lg p-4 md:p-5 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 no-underline"
            >
              <div class="flex items-start gap-3 mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                      {{ post.author.name }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(post.createdAt) }}
                  </div>
                </div>
              </div>

              <h3
                class="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base hover:text-primary transition"
              >
                {{ post.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-xs md:text-sm line-clamp-2 mb-3">
                {{ post.content }}
              </p>

              <div
                class="flex items-center gap-3 md:gap-4 text-xs text-gray-500 dark:text-gray-400"
              >
                <span class="flex items-center gap-1 hover:text-primary transition">
                  <ChatBubbleLeftIcon class="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span class="hidden sm:inline">댓글</span> {{ post.commentCount }}
                </span>
                <span class="flex items-center gap-1">
                  <EyeIcon class="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {{ post.viewCount }}
                </span>
              </div>
            </NuxtLink>
          </div>

          <!-- 빈 상태 -->
          <Transition name="fade">
            <div v-if="!loading && posts.length === 0" class="text-center py-20">
              <DocumentTextIcon class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p class="text-gray-500 dark:text-gray-400 text-base md:text-lg">
                아직 게시글이 없어요
              </p>
              <p class="text-gray-400 dark:text-gray-500 text-xs md:text-sm mt-2">
                첫 번째 피드백 요청을 작성해보세요!
              </p>
            </div>
          </Transition>

          <!-- 페이지네이션 -->
          <div v-if="!loading && totalPages > 1" class="flex justify-center gap-2 mt-8">
            <button
              v-for="page in totalPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'px-4 py-2 rounded-lg transition',
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
              ]"
            >
              {{ page }}
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ChatBubbleLeftIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline'
import { CATEGORIES } from '~/constants/categories'

const selectedCategory = ref('all')
const showCategoryModal = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const loading = ref(false)
const posts = ref([])
const totalPages = ref(1)

const categories = CATEGORIES

// 게시글 목록 불러오기
const fetchPosts = async () => {
  loading.value = true
  try {
    const { posts: fetchedPosts, pagination } = await $fetch('/api/posts', {
      params: {
        page: currentPage.value,
        limit: 20,
        category: selectedCategory.value !== 'all' ? selectedCategory.value : undefined,
      },
    })

    posts.value = fetchedPosts
    totalPages.value = pagination.totalPages
  } catch (error) {
    console.error('게시글 로딩 실패:', error)
  } finally {
    loading.value = false
  }
}

// 날짜 포맷
const formatDate = (date) => {
  const now = new Date()
  const postDate = new Date(date)
  const diff = Math.floor((now - postDate) / 1000)

  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`

  return postDate.toLocaleDateString('ko-KR')
}

const getCurrentCategoryName = () => {
  const category = categories.find((c) => c.id === selectedCategory.value)
  return category ? category.name : '전체'
}

const getCurrentCategoryIcon = () => {
  const category = categories.find((c) => c.id === selectedCategory.value)
  return category ? category.icon : categories[0].icon
}

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  showCategoryModal.value = false
  currentPage.value = 1 // 카테고리 변경 시 첫 페이지로
  fetchPosts()
}

// 카테고리 변경 감지
watch(selectedCategory, () => {
  currentPage.value = 1
  fetchPosts()
})

// 페이지 변경 감지
watch(currentPage, () => {
  fetchPosts()
})

// 초기 로딩
onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
