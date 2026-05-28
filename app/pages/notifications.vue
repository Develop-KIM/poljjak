<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Bell, MessageSquare, Newspaper, Sparkles, Heart } from '@lucide/vue'

definePageMeta({ middleware: 'auth' })

useSeoMeta({ title: '알림 · 폴짝' })

interface Notification {
  id: string
  type: string
  message: string
  linkUrl: string
  isRead: boolean
  actorAvatarUrl: string | null
  createdAt: string
}

const notifications = ref<Notification[]>([])
const pending = ref(true)
const currentPage = ref(1)
const totalCount = ref(0)
const PAGE_SIZE = 20
const toast = useToastStore()

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

async function fetchNotifications(page = 1) {
  pending.value = true
  try {
    const res = await $fetch<{ data: Notification[]; total: number }>('/api/notifications', {
      query: { page },
    })
    notifications.value = res.data
    totalCount.value = res.total
    currentPage.value = page
  } catch {
    toast.error('알림을 불러오지 못했어요')
  } finally {
    pending.value = false
  }
}

async function markAllRead() {
  try {
    await $fetch('/api/notifications/read-all', { method: 'POST' })
    notifications.value.forEach((n) => {
      n.isRead = true
    })
  } catch {
    toast.error('처리에 실패했어요')
  }
}

async function handleClick(n: Notification) {
  if (!n.isRead) {
    n.isRead = true
    $fetch(`/api/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {})
  }
  await navigateTo(n.linkUrl)
}

function goPage(page: number) {
  fetchNotifications(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => fetchNotifications())
</script>

<template>
  <div class="mx-auto max-w-2xl px-5 py-8 md:px-8 md:py-10">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-black text-foreground">알림</h1>
      <button
        v-if="notifications.some((n) => !n.isRead)"
        type="button"
        class="text-sm text-primary hover:underline"
        @click="markAllRead"
      >
        모두 읽음
      </button>
    </div>

    <div class="mt-6">
      <div v-if="pending" class="flex justify-center py-20">
        <div class="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>

      <div
        v-else-if="notifications.length === 0"
        class="py-20 text-center text-sm text-muted-foreground"
      >
        알림이 없어요
      </div>

      <div v-else class="grid gap-1">
        <button
          v-for="n in notifications"
          :key="n.id"
          type="button"
          class="flex w-full items-start gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-muted"
          :class="{ 'bg-accent/40': !n.isRead }"
          @click="handleClick(n)"
        >
          <!-- 아이콘 -->
          <div
            class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full"
            :class="{
              'bg-violet-50 dark:bg-violet-950/50': n.type === 'analysis',
              'bg-blue-50 dark:bg-blue-950/50': n.type === 'article',
              'bg-rose-50 dark:bg-rose-950/50': n.type === 'like',
              'bg-accent': n.type === 'comment',
            }"
          >
            <Sparkles v-if="n.type === 'analysis'" class="size-4 text-violet-500" />
            <Newspaper v-else-if="n.type === 'article'" class="size-4 text-blue-500" />
            <Heart v-else-if="n.type === 'like'" class="size-4 text-rose-500" />
            <Bell v-else-if="n.type === 'dm'" class="size-4 text-primary" />
            <MessageSquare v-else class="size-4 text-primary" />
          </div>

          <!-- 내용 -->
          <div class="flex-1 overflow-hidden">
            <p class="text-sm leading-5 text-foreground" :class="{ 'font-semibold': !n.isRead }">
              {{ n.message }}
            </p>
            <p class="mt-0.5 text-xs text-muted-foreground">{{ n.createdAt }}</p>
          </div>

          <!-- 미읽음 dot -->
          <div v-if="!n.isRead" class="mt-2 size-2 shrink-0 rounded-full bg-primary" />
        </button>
      </div>

      <Pagination
        v-if="totalPages > 1"
        :current="currentPage"
        :total="totalPages"
        class="mt-6"
        @change="goPage"
      />
    </div>
  </div>
</template>
