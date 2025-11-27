<template>
  <header class="border-b bg-white dark:bg-dark">
    <nav class="container mx-auto px-4 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="text-2xl font-bold text-primary no-underline">폴짝</NuxtLink>

      <div class="hidden md:flex items-center gap-6">
        <NuxtLink
          to="/community"
          class="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors font-medium no-underline"
        >
          커뮤니티
        </NuxtLink>

        <ClientOnly>
          <div v-if="isAuthenticated" class="relative">
            <button
              @click="toggleMenu"
              class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition"
            >
              <span class="text-primary font-bold text-sm">
                {{ user?.name?.charAt(0) }}
              </span>
            </button>

            <Transition name="dropdown">
              <div v-if="isMenuOpen" class="dropdown-menu">
                <div
                  class="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                >
                  <div class="dropdown-arrow"></div>

                  <NuxtLink
                    to="/mypage"
                    @click="isMenuOpen = false"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition no-underline"
                  >
                    마이페이지
                  </NuxtLink>

                  <button
                    @click="handleLogout"
                    class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <NuxtLink
            v-else
            to="/login"
            class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition font-medium text-sm no-underline"
          >
            로그인
          </NuxtLink>

          <button
            @click="toggleDark"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="테마 전환"
          >
            <SunIcon v-if="!isDark" class="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <MoonIcon v-else class="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </ClientOnly>
      </div>

      <div class="flex md:hidden items-center">
        <button
          @click="toggleMobileMenu"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="메뉴"
        >
          <Bars3Icon v-if="!isMobileMenuOpen" class="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <XMarkIcon v-else class="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
    </nav>

    <Transition name="sidebar">
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-50 md:hidden">
        <div class="absolute inset-0 bg-black/50" @click="closeMobileMenu"></div>

        <div class="absolute right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl">
          <div class="flex flex-col h-full">
            <div
              class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
            >
              <span class="text-xl font-bold text-primary">메뉴</span>
              <button
                @click="closeMobileMenu"
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon class="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto py-4">
              <nav class="space-y-1 px-2">
                <ClientOnly>
                  <!-- 로그인 상태 (이름) -->
                  <div v-if="isAuthenticated" class="px-4 py-1">
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ user?.name }}
                    </span>
                  </div>
                </ClientOnly>

                <!-- 다크모드 토글 -->
                <button
                  @click="toggleDark"
                  class="w-full flex items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <span>다크 모드</span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      {{ isDark ? 'ON' : 'OFF' }}
                    </span>
                    <SunIcon v-if="!isDark" class="w-5 h-5" />
                    <MoonIcon v-else class="w-5 h-5" />
                  </div>
                </button>

                <!-- 구분선 -->
                <div class="h-px bg-gray-200 dark:bg-gray-700 mx-2 my-2"></div>

                <!-- 메뉴들 -->
                <NuxtLink
                  to="/community"
                  @click="closeMobileMenu"
                  class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition no-underline"
                >
                  커뮤니티
                </NuxtLink>

                <ClientOnly>
                  <template v-if="isAuthenticated">
                    <NuxtLink
                      to="/mypage"
                      @click="closeMobileMenu"
                      class="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition no-underline"
                    >
                      마이페이지
                    </NuxtLink>

                    <button
                      @click="handleLogout"
                      class="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      로그아웃
                    </button>
                  </template>

                  <NuxtLink
                    v-else
                    to="/login"
                    @click="closeMobileMenu"
                    class="block px-4 py-3 bg-primary text-white text-center rounded-lg hover:bg-primary/90 transition no-underline font-medium"
                  >
                    로그인
                  </NuxtLink>
                </ClientOnly>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const { isAuthenticated, clearAuth, user } = useAuth()
const isMenuOpen = ref(false)
const isMobileMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

onMounted(() => {
  if (process.client) {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.relative')) {
        isMenuOpen.value = false
      }
    })
  }
})

const toggleDark = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    clearAuth()
    isMenuOpen.value = false
    isMobileMenuOpen.value = false
    window.location.reload()
  } catch (error) {
    console.error('로그아웃 실패:', error)
  }
}
</script>

<style scoped>
.dropdown-menu {
  position: absolute;
  right: 0;
  margin-top: 8px;
  width: 12rem;
  z-index: 50;
}

.dropdown-arrow {
  position: absolute;
  top: -6.6px;
  right: 9px;
  width: 12px;
  height: 12px;
  background: white;
  border-left: 1px solid #e5e7eb;
  border-top: 1px solid #e5e7eb;
  transform: rotate(45deg);
}

.dark .dropdown-arrow {
  background: rgb(31, 41, 55);
  border-color: rgb(55, 65, 81);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.sidebar-enter-active,
.sidebar-leave-active {
  transition: opacity 0.3s ease;
}

.sidebar-enter-active .absolute.right-0,
.sidebar-leave-active .absolute.right-0 {
  transition: transform 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
}

.sidebar-enter-from .absolute.right-0,
.sidebar-leave-to .absolute.right-0 {
  transform: translateX(100%);
}
</style>
