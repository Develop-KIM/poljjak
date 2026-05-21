<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronDown, UserRound, LogOut, Menu, X } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'

const route = useRoute()
const { user, isLoggedIn, signOut } = useAuth()
const authStore = useAuthStore()

const profileOpen = ref(false)
const profileRef = ref<HTMLElement | null>(null)
const mobileMenuOpen = ref(false)
const showLoginModal = ref(false)

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
    authStore.profile?.nickname?.[0]?.toUpperCase() ??
    user.value?.user_metadata?.full_name?.[0]?.toUpperCase() ??
    user.value?.email?.[0]?.toUpperCase() ??
    'U'
)

const userName = computed(
  () =>
    authStore.profile?.nickname ??
    user.value?.user_metadata?.full_name ??
    user.value?.email ??
    '사용자'
)

const userJobLabel = computed(() => {
  if (authStore.profile?.jobType === 'developer') return '개발자'
  if (authStore.profile?.jobType === 'designer') return '디자이너'
  return null
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <!-- ─── 헤더 ─────────────────────────────────────────── -->
    <header class="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
      <div class="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 md:px-8">
        <!-- 로고 -->
        <NuxtLink to="/">
          <img src="/images/logo.png" alt="폴짝" class="h-10 w-auto" />
        </NuxtLink>

        <!-- 데스크탑 네비게이션 -->
        <nav class="hidden items-center gap-1 md:flex">
          <NuxtLink
            to="/analyze"
            class="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
            :class="
              isActive('/analyze') || isActive('/analysis')
                ? 'bg-slate-100 text-foreground'
                : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
            "
          >
            포트폴리오 분석
          </NuxtLink>
          <NuxtLink
            to="/community?tab=feedback"
            class="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
            :class="
              isActive('/community')
                ? 'bg-slate-100 text-foreground'
                : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
            "
          >
            커뮤니티
          </NuxtLink>
        </nav>

        <!-- 우측 액션 -->
        <div class="flex items-center gap-2">
          <!-- 데스크탑에서만 표시 -->
          <div class="hidden md:flex md:items-center md:gap-2">
            <template v-if="isLoggedIn">
              <NotificationPopover />
            </template>
          </div>

          <div v-if="isLoggedIn" ref="profileRef" class="relative hidden md:block">
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100"
              @click="profileOpen = !profileOpen"
            >
              <ClientOnly>
                <div class="size-7 overflow-hidden rounded-full">
                  <img
                    v-if="authStore.profile?.avatarUrl"
                    :src="authStore.profile.avatarUrl"
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
                <template #fallback>
                  <div
                    class="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                  >
                    U
                  </div>
                </template>
              </ClientOnly>
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
                class="absolute right-0 top-full mt-1.5 w-48 origin-top-right rounded-xl border border-border bg-white py-1.5 shadow-lg"
              >
                <div class="border-b border-border px-4 py-3">
                  <p class="truncate text-sm font-semibold text-foreground">{{ userName }}</p>
                  <p v-if="userJobLabel" class="mt-0.5 text-xs text-muted-foreground">
                    {{ userJobLabel }}
                  </p>
                </div>
                <NuxtLink
                  to="/my"
                  class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-slate-50"
                  @click="profileOpen = false"
                >
                  <UserRound class="size-4 text-muted-foreground" />
                  마이페이지
                </NuxtLink>
                <button
                  type="button"
                  class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-red-50"
                  @click="handleLogout"
                >
                  <LogOut class="size-4" />
                  로그아웃
                </button>
              </div>
            </Transition>
          </div>

          <!-- 비로그인 상태: 로그인 버튼 (데스크탑만) -->
          <template v-else>
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
            class="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 md:hidden"
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
          <div class="relative flex h-full w-72 flex-col bg-white shadow-2xl">
            <!-- 패널 헤더 -->
            <div class="flex items-center justify-between border-b border-border px-5 py-4">
              <img src="/images/logo.png" alt="폴짝" class="h-7 w-auto" />
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100"
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
                    : 'text-foreground hover:bg-slate-50'
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
                    : 'text-foreground hover:bg-slate-50'
                "
                @click="mobileMenuOpen = false"
              >
                커뮤니티
              </NuxtLink>
            </nav>

            <!-- 하단: 로그인 / 프로필 -->
            <div class="mt-auto border-t border-border px-4 py-5">
              <!-- 로그인 상태 -->
              <template v-if="isLoggedIn">
                <div class="flex items-center gap-3">
                  <ClientOnly>
                    <div class="size-9 overflow-hidden rounded-full">
                      <img
                        v-if="authStore.profile?.avatarUrl"
                        :src="authStore.profile.avatarUrl"
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
                    <template #fallback>
                      <div
                        class="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                      >
                        U
                      </div>
                    </template>
                  </ClientOnly>
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
                    class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-slate-50"
                    @click="mobileMenuOpen = false"
                  >
                    <UserRound class="size-4 text-muted-foreground" />
                    마이페이지
                  </NuxtLink>
                  <button
                    type="button"
                    class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-red-50"
                    @click="handleLogout"
                  >
                    <LogOut class="size-4" />
                    로그아웃
                  </button>
                </div>
              </template>

              <!-- 비로그인 상태 -->
              <template v-else>
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
      <div class="mx-auto max-w-[1120px] px-5 py-10 md:px-8">
        <div class="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <img src="/images/logo.png" alt="폴짝" class="h-9 w-auto" />
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
