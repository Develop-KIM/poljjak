<script setup lang="ts">
import { ref } from 'vue'
import { LayoutDashboard, FileText, Flag, FolderOpen, Users, ChevronLeft, Menu, X } from '@lucide/vue'

const route = useRoute()
const sidebarOpen = ref(false)

const navItems = [
  { label: '대시보드', path: '/admin', icon: LayoutDashboard },
  { label: '프롬프트 관리', path: '/admin/prompts', icon: FileText },
  { label: '신고 관리', path: '/admin/reports', icon: Flag },
  { label: '콘텐츠 관리', path: '/admin/contents', icon: FolderOpen },
  { label: '사용자 관리', path: '/admin/users', icon: Users },
]

function isActive(path: string) {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex min-h-screen bg-muted/30">
    <!-- 모바일 오버레이 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-20 bg-black/40 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- 사이드바 (PC: 왼쪽 고정 / 모바일: 오른쪽에서 슬라이드) -->
    <aside
      class="fixed inset-y-0 z-30 flex w-56 flex-col bg-background transition-transform duration-200
             right-0 border-l border-border translate-x-full
             lg:static lg:right-auto lg:left-auto lg:border-l-0 lg:border-r lg:border-border lg:translate-x-0"
      :class="sidebarOpen ? '!translate-x-0' : ''"
    >
      <!-- 사이드바 헤더 -->
      <div class="flex h-14 items-center justify-between border-b border-border px-4">
        <span class="text-sm font-black text-foreground">폴짝 관리자</span>
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
          @click="sidebarOpen = false"
        >
          <X class="size-4" />
        </button>
      </div>

      <!-- 서비스로 링크 -->
      <div class="border-b border-border px-3 py-2.5">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          @click="sidebarOpen = false"
        >
          <ChevronLeft class="size-3.5" />
          서비스로 돌아가기
        </NuxtLink>
      </div>

      <!-- 네비게이션 -->
      <nav class="flex-1 overflow-y-auto px-3 py-3">
        <ul class="grid gap-0.5">
          <li v-for="item in navItems" :key="item.path">
            <NuxtLink
              :to="item.path"
              class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              :class="
                isActive(item.path)
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              "
              @click="sidebarOpen = false"
            >
              <component :is="item.icon" class="size-4 shrink-0" />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- 본문 영역 -->
    <div class="flex flex-1 flex-col min-w-0">
      <!-- 모바일 상단 헤더 — 햄버거 버튼 오른쪽 -->
      <header class="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <span class="text-sm font-black text-foreground">폴짝 관리자</span>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          @click="sidebarOpen = true"
        >
          <Menu class="size-5" />
        </button>
      </header>

      <main class="flex-1 p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
