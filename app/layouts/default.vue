<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ChevronDown, UserRound, LogOut, Menu, X, MessageCircle, Moon, Sun, Settings } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'

const route = useRoute()
const { user, isLoggedIn, signOut } = useAuth()
const authStore = useAuthStore()
const notifStore = useNotificationStore()

const isDark = ref(false)
const profileOpen = ref(false)
const profileRef = ref<HTMLElement | null>(null)
const mobileMenuOpen = ref(false)
const showLoginModal = ref(false)
const isChatPage = computed(() => route.path.startsWith('/chat'))
const displayProfile = computed(() => authStore.displayProfile)

// ?login=1 쿼리 파라미터로 로그인 모달 자동 오픈 (auth 미들웨어에서 전달)
const routeQuery = useRoute().query
watch(
  () => routeQuery.login,
  (v) => {
    if (v === '1') showLoginModal.value = true
  },
  { immediate: true }
)

onClickOutside(profileRef, () => {
  profileOpen.value = false
})

onMounted(() => {
  const savedTheme = localStorage.getItem('poljjak-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = savedTheme ? savedTheme === 'dark' : prefersDark
  applyTheme()

  // @nuxtjs/supabase 플러그인이 async setup으로 이미 세션 복원을 완료했으므로
  // isLoggedIn은 mount 시점에 이미 정확한 값 — 별도 getSession() 불필요
  if (authStore.isLoggedIn && !authStore.profile) {
    authStore.fetchProfile()
  }
})

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('poljjak-theme', isDark.value ? 'dark' : 'light')
}

function toggleDark() {
  isDark.value = !isDark.value
  applyTheme()
}

// 모바일 메뉴 열릴 때 배경 스크롤 잠금
watch(mobileMenuOpen, (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})

// 라우트 이동 시 메뉴 닫기
watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  }
)

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}

async function handleLogout() {
  profileOpen.value = false
  mobileMenuOpen.value = false
  authStore.clear()
  await signOut()
}

const userInitial = computed(
  () =>
    displayProfile.value?.nickname?.[0]?.toUpperCase() ??
    user.value?.user_metadata?.full_name?.[0]?.toUpperCase() ??
    '?'
)

const userName = computed(
  () => displayProfile.value?.nickname ?? user.value?.user_metadata?.full_name ?? '사용자'
)

const userJobLabel = computed(() => {
  if (displayProfile.value?.jobType === 'developer') return '개발자'
  if (displayProfile.value?.jobType === 'designer') return '디자이너'
  return null
})

function toggleProfileMenu() {
  if (!displayProfile.value) return
  profileOpen.value = !profileOpen.value
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <!-- ─── 헤더 ─────────────────────────────────────────── -->
    <header
      class="sticky top-0 z-40"
      :class="
        isChatPage
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-border bg-background/90 backdrop-blur-sm'
      "
    >
      <div class="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:px-8">
        <!-- 로고 -->
        <NuxtLink to="/">
          <AppLogo class="h-10" />
        </NuxtLink>

        <!-- 데스크탑 네비게이션 -->
        <nav class="hidden items-center gap-1 md:flex">
          <NuxtLink
            to="/analyze"
            class="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
            :class="
              isActive('/analyze') || isActive('/analysis')
                ? 'bg-accent text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            "
          >
            포트폴리오 분석
          </NuxtLink>
          <NuxtLink
            to="/community?tab=feedback"
            class="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
            :class="
              isActive('/community')
                ? 'bg-accent text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            "
          >
            커뮤니티
          </NuxtLink>
          <NuxtLink
            to="/articles"
            class="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
            :class="
              isActive('/articles')
                ? 'bg-accent text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            "
          >
            아티클
          </NuxtLink>
        </nav>

        <!-- 우측 액션 -->
        <div class="flex items-center gap-2">
          <!-- 다크모드 토글 -->
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            :aria-label="isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
            @click="toggleDark()"
          >
            <Sun v-if="isDark" class="size-5" />
            <Moon v-else class="size-5" />
          </button>

          <!-- 데스크탑에서만 표시 -->
          <div class="hidden md:flex md:items-center md:gap-2">
            <template v-if="isLoggedIn">
              <NuxtLink
                to="/chat"
                class="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                active-class="text-foreground bg-muted"
              >
                <MessageCircle class="size-5" />
                <span
                  v-if="notifStore.dmUnreadCount > 0"
                  class="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
                >
                  {{ notifStore.dmUnreadCount > 9 ? '9+' : notifStore.dmUnreadCount }}
                </span>
              </NuxtLink>
              <NotificationPopover />
            </template>
          </div>

          <div
            v-if="isLoggedIn && displayProfile"
            ref="profileRef"
            class="relative hidden md:block"
          >
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
              @click="toggleProfileMenu"
            >
              <div class="size-7 overflow-hidden rounded-full">
                <img
                  v-if="displayProfile.avatarUrl"
                  :src="displayProfile.avatarUrl"
                  alt="프로필"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-primary text-xs font-bold text-primary-foreground"
                >
                  {{ userInitial }}
                </div>
              </div>
              <ChevronDown
                class="hidden size-3.5 text-muted-foreground transition-transform duration-150 md:block"
                :class="{ 'rotate-180': profileOpen }"
              />
            </button>

            <Transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="profileOpen"
                class="absolute right-0 top-full mt-1.5 w-48 origin-top-right rounded-xl border border-border bg-popover py-1.5 shadow-lg"
              >
                <div class="border-b border-border px-4 py-3">
                  <p class="truncate text-sm font-semibold text-foreground">{{ userName }}</p>
                  <p v-if="userJobLabel" class="mt-0.5 text-xs text-muted-foreground">
                    {{ userJobLabel }}
                  </p>
                </div>
                <NuxtLink
                  to="/my"
                  class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  @click="profileOpen = false"
                >
                  <UserRound class="size-4 text-muted-foreground" />
                  마이페이지
                </NuxtLink>
                <NuxtLink
                  v-if="authStore.profile?.role === 'admin'"
                  to="/admin"
                  class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary transition-colors hover:bg-muted"
                  @click="profileOpen = false"
                >
                  <Settings class="size-4 text-muted-foreground" />
                  관리자
                </NuxtLink>
                <button
                  type="button"
                  class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  @click="handleLogout"
                >
                  <LogOut class="size-4" />
                  로그아웃
                </button>
              </div>
            </Transition>
          </div>

          <!-- 비로그인 상태: 로그인 버튼 (데스크탑만) -->
          <template v-else-if="!isLoggedIn">
            <AppButton
              variant="outline"
              size="sm"
              class="hidden md:inline-flex"
              @click="showLoginModal = true"
              >로그인</AppButton
            >
          </template>

          <!-- 모바일 햄버거 버튼 -->
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted md:hidden"
            :aria-label="mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'"
            @click="mobileMenuOpen = true"
          >
            <Menu class="size-5" />
          </button>
        </div>
      </div>
    </header>

    <!-- ─── 모바일 메뉴 오버레이 ──────────────────────────── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="mobileMenuOpen" class="fixed inset-0 z-50 flex justify-end md:hidden">
          <!-- 배경 딤 -->
          <div
            class="absolute inset-0 bg-black/40 backdrop-blur-sm"
            @click="mobileMenuOpen = false"
          />

          <!-- 슬라이드 패널 -->
          <div class="relative flex h-full w-72 flex-col bg-background shadow-2xl">
            <!-- 패널 헤더 -->
            <div class="flex items-center justify-between border-b border-border px-5 py-4">
              <AppLogo class="h-7" />
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                @click="mobileMenuOpen = false"
              >
                <X class="size-5" />
              </button>
            </div>

            <!-- 네비게이션 -->
            <nav class="flex flex-col gap-1 px-3 py-4">
              <NuxtLink
                to="/analyze"
                class="flex items-center rounded-lg px-3 py-3 text-sm font-semibold transition-colors"
                :class="
                  isActive('/analyze') || isActive('/analysis')
                    ? 'bg-accent text-primary'
                    : 'text-foreground hover:bg-muted'
                "
                @click="mobileMenuOpen = false"
              >
                포트폴리오 분석
              </NuxtLink>
              <NuxtLink
                to="/community?tab=feedback"
                class="flex items-center rounded-lg px-3 py-3 text-sm font-semibold transition-colors"
                :class="
                  isActive('/community')
                    ? 'bg-accent text-primary'
                    : 'text-foreground hover:bg-muted'
                "
                @click="mobileMenuOpen = false"
              >
                커뮤니티
              </NuxtLink>
              <NuxtLink
                to="/articles"
                class="flex items-center rounded-lg px-3 py-3 text-sm font-semibold transition-colors"
                :class="
                  isActive('/articles')
                    ? 'bg-accent text-primary'
                    : 'text-foreground hover:bg-muted'
                "
                @click="mobileMenuOpen = false"
              >
                아티클
              </NuxtLink>
              <NuxtLink
                v-if="isLoggedIn"
                to="/chat"
                class="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition-colors"
                :class="
                  isActive('/chat') ? 'bg-accent text-primary' : 'text-foreground hover:bg-muted'
                "
                @click="mobileMenuOpen = false"
              >
                채팅
                <span
                  v-if="notifStore.dmUnreadCount > 0"
                  class="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
                >
                  {{ notifStore.dmUnreadCount > 9 ? '9+' : notifStore.dmUnreadCount }}
                </span>
              </NuxtLink>
            </nav>

            <!-- 하단: 로그인 / 프로필 -->
            <div class="mt-auto border-t border-border px-4 py-5">
              <!-- 로그인 상태 -->
              <template v-if="isLoggedIn && displayProfile">
                <div class="flex items-center gap-3">
                  <div class="size-9 overflow-hidden rounded-full">
                    <img
                      v-if="displayProfile.avatarUrl"
                      :src="displayProfile.avatarUrl"
                      alt="프로필"
                      class="h-full w-full object-cover"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center bg-primary text-sm font-bold text-primary-foreground"
                    >
                      {{ userInitial }}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-foreground">{{ userName }}</p>
                    <p v-if="userJobLabel" class="mt-0.5 text-xs text-muted-foreground">
                      {{ userJobLabel }}
                    </p>
                  </div>
                </div>
                <div class="mt-4 grid gap-1">
                  <NuxtLink
                    to="/my"
                    class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    @click="mobileMenuOpen = false"
                  >
                    <UserRound class="size-4 text-muted-foreground" />
                    마이페이지
                  </NuxtLink>
                  <NuxtLink
                    v-if="authStore.profile?.role === 'admin'"
                    to="/admin"
                    class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-primary transition-colors hover:bg-muted"
                    @click="mobileMenuOpen = false"
                  >
                    <Settings class="size-4 text-muted-foreground" />
                    관리자
                  </NuxtLink>
                  <button
                    type="button"
                    class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    @click="handleLogout"
                  >
                    <LogOut class="size-4" />
                    로그아웃
                  </button>
                </div>
              </template>

              <!-- 비로그인 상태 -->
              <template v-else-if="!isLoggedIn">
                <AppButton
                  variant="primary"
                  size="md"
                  class="w-full"
                  @click="
                    () => {
                      mobileMenuOpen = false
                      showLoginModal = true
                    }
                  "
                >
                  로그인
                </AppButton>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ─── 메인 콘텐츠 ───────────────────────────────────── -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- ─── 푸터 ─────────────────────────────────────────── -->
    <footer class="border-t border-border bg-background">
      <div class="mx-auto max-w-[1440px] px-5 py-10 md:px-8">
        <div class="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <AppLogo class="h-9" />
            <p class="mt-1.5 text-sm text-muted-foreground">포트폴리오로 한 단계 폴짝</p>
          </div>
          <div class="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:gap-12">
            <div class="flex flex-col gap-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                서비스
              </p>
              <NuxtLink to="/analyze" class="transition-colors hover:text-foreground"
                >포트폴리오 분석</NuxtLink
              >
              <NuxtLink to="/community?tab=feedback" class="transition-colors hover:text-foreground"
                >커뮤니티</NuxtLink
              >
              <NuxtLink to="/articles" class="transition-colors hover:text-foreground"
                >아티클</NuxtLink
              >
            </div>
            <div class="flex flex-col gap-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                약관
              </p>
              <NuxtLink to="/privacy" class="transition-colors hover:text-foreground"
                >개인정보처리방침</NuxtLink
              >
              <NuxtLink to="/terms" class="transition-colors hover:text-foreground"
                >이용약관</NuxtLink
              >
            </div>
          </div>
        </div>
        <p class="mt-8 text-xs text-muted-foreground/50">© 2026 폴짝. All rights reserved.</p>
      </div>
    </footer>

    <!-- ─── 로그인 모달 ───────────────────────────────────── -->
    <LoginModal :open="showLoginModal" context="계속하기" @close="showLoginModal = false" />
  </div>

  <!-- ─── 전역 토스트 ──────────────────────────────────── -->
  <AppToast />
</template>
