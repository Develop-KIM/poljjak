<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
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

        <main class="flex-1">
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

              <button
                class="bg-primary text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-primary/90 hover:shadow-md transition-all duration-200 text-sm md:text-base whitespace-nowrap flex items-center gap-2"
              >
                <PencilSquareIcon class="w-4 h-4" />
                글쓰기
              </button>
            </div>

            <div class="w-full relative">
              <MagnifyingGlassIcon
                class="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="포트폴리오 피드백을 검색해보세요"
                class="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          </div>

          <div class="space-y-3">
            <article
              v-for="post in filteredPosts"
              :key="post.id"
              class="bg-white dark:bg-dark rounded-lg p-4 md:p-5 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div class="flex items-start gap-3 mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-semibold text-gray-900 dark:text-white text-sm md:text-base"
                      >{{ post.author }}</span
                    >
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ post.category }} · {{ post.time }}
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
                  <span class="hidden sm:inline">댓글</span> {{ post.comments }}
                </span>
                <span class="flex items-center gap-1 hover:text-red-500 transition cursor-pointer">
                  <HeartIcon class="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {{ post.likes }}
                </span>
                <span class="flex items-center gap-1">
                  <EyeIcon class="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {{ post.views }}
                </span>
              </div>
            </article>
          </div>

          <Transition name="fade">
            <div v-if="filteredPosts.length === 0" class="text-center py-20">
              <DocumentTextIcon class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p class="text-gray-500 dark:text-gray-400 text-base md:text-lg">
                아직 게시글이 없어요
              </p>
              <p class="text-gray-400 dark:text-gray-500 text-xs md:text-sm mt-2">
                첫 번째 피드백 요청을 작성해보세요!
              </p>
            </div>
          </Transition>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ChatBubbleLeftIcon,
  HeartIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  XMarkIcon,
  RectangleStackIcon,
  PaintBrushIcon,
  CodeBracketIcon,
  LightBulbIcon,
  MegaphoneIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline'

const selectedCategory = ref('all')
const showCategoryModal = ref(false)

const categories = [
  { id: 'all', name: '전체', icon: RectangleStackIcon },
  { id: 'design', name: '디자인', icon: PaintBrushIcon },
  { id: 'dev', name: '개발', icon: CodeBracketIcon },
  { id: 'planning', name: '기획', icon: LightBulbIcon },
  { id: 'marketing', name: '마케팅', icon: MegaphoneIcon },
  { id: 'data', name: '데이터', icon: ChartBarIcon },
]

const posts = ref([
  {
    id: 1,
    category: '개발',
    categoryId: 'dev',
    author: '김개발',
    time: '12분 전',
    title: 'React 포트폴리오 프로젝트 피드백 부탁드려요',
    content:
      '안녕하세요! React로 개인 프로젝트를 진행했는데, 코드 리뷰와 UI/UX 피드백 받고 싶습니다. 특히 상태 관리 부분에서 개선점이 있을지 궁금합니다.',
    comments: 5,
    likes: 12,
    views: 84,
  },
  {
    id: 2,
    category: '디자인',
    categoryId: 'design',
    author: '이디자인',
    time: '25분 전',
    title: 'UI/UX 포트폴리오 초안 검토 부탁드립니다',
    content:
      '처음으로 만든 포트폴리오인데 레이아웃이나 색감이 어떤지 피드백 주시면 감사하겠습니다!',
    comments: 8,
    likes: 23,
    views: 156,
  },
  {
    id: 3,
    category: '기획',
    categoryId: 'planning',
    author: '박기획',
    time: '1시간 전',
    title: '서비스 기획서 첨삭 요청드려요',
    content:
      '신입 PM 준비 중인데 포트폴리오용 서비스 기획서를 작성했습니다. 문제 정의와 솔루션 부분 피드백 부탁드립니다.',
    comments: 3,
    likes: 7,
    views: 45,
  },
  {
    id: 4,
    category: '마케팅',
    categoryId: 'marketing',
    author: '최마케터',
    time: '2시간 전',
    title: '마케팅 캠페인 포트폴리오 검토 부탁드립니다',
    content:
      '이커머스 마케팅 캠페인 사례를 정리했는데, 데이터 시각화랑 인사이트 도출 부분 조언 구합니다.',
    comments: 12,
    likes: 31,
    views: 203,
  },
  {
    id: 5,
    category: '데이터',
    categoryId: 'data',
    author: '정데이터',
    time: '3시간 전',
    title: '데이터 분석 프로젝트 포트폴리오 피드백',
    content:
      'Python으로 진행한 데이터 분석 프로젝트인데 시각화 방법이나 분석 깊이에 대해 의견 듣고 싶어요!',
    comments: 6,
    likes: 18,
    views: 92,
  },
])

const filteredPosts = computed(() => {
  if (selectedCategory.value === 'all') {
    return posts.value
  }
  return posts.value.filter((post) => post.categoryId === selectedCategory.value)
})

const getCurrentCategoryName = () => {
  const category = categories.find((c) => c.id === selectedCategory.value)
  return category ? category.name : '전체'
}

const getCurrentCategoryIcon = () => {
  const category = categories.find((c) => c.id === selectedCategory.value)
  return category ? category.icon : RectangleStackIcon
}

const getCategoryIcon = (categoryId) => {
  const category = categories.find((c) => c.id === categoryId)
  return category ? category.icon : RectangleStackIcon
}

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  showCategoryModal.value = false
}
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
