<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bell, MessageSquare, MessageCircle, Sparkles } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth'

type NotifType = 'comment' | 'like' | 'dm' | 'analysis'

interface Notification {
  id: string
  type: NotifType
  message: string
  linkUrl: string
  isRead: boolean
  actorAvatarUrl: string | null
  createdAt: string
}

const authStore = useAuthStore()
const client = useSupabaseClient()
const open = ref(false)
const popoverRef = ref<HTMLElement | null>(null)
const notifications = ref<Notification[]>([])

onClickOutside(popoverRef, () => {
  open.value = false
})

const visibleNotifications = computed(() => notifications.value.filter((n) => n.type !== 'dm'))
const unreadCount = computed(() => visibleNotifications.value.filter((n) => !n.isRead).length)

async function fetchNotifications() {
  if (!authStore.isLoggedIn) return
  try {
    const res = await $fetch<{ data: Notification[] }>('/api/notifications')
    notifications.value = res.data
  } catch {
    // 조용히 실패
  }
}

async function markAllRead() {
  try {
    await $fetch('/api/notifications/read-all', { method: 'POST' })
    notifications.value.forEach((n) => { n.isRead = true })
  } catch {
    // 조용히 실패
  }
}

async function handleNotifClick(n: Notification) {
  if (!n.isRead) {
    n.isRead = true
    $fetch(`/api/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {})
  }
  open.value = false
  await navigateTo(n.linkUrl)
}

// Supabase Realtime — 내 알림 INSERT 구독
let channel: ReturnType<typeof client.channel> | null = null

onMounted(async () => {
  await fetchNotifications()

  if (!authStore.profile?.id) return

  channel = client
    .channel(`notifications:${authStore.profile!.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${authStore.profile!.id}`,
      },
      () => {
        fetchNotifications()
      },
    )
    .subscribe()
})

onUnmounted(() => {
  channel?.unsubscribe()
})
</script>

<template>
  <div ref="popoverRef" class="relative">
    <button
      type="button"
      class="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
      @click="open = !open"
    >
      <Bell class="size-5" />
      <span
        v-if="unreadCount > 0"
        class="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
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
        v-if="open"
        class="absolute right-0 top-full mt-1.5 w-80 origin-top-right rounded-xl border border-border bg-white shadow-lg"
      >
        <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <span class="text-sm font-bold text-foreground">알림</span>
          <button
            v-if="unreadCount > 0"
            type="button"
            class="text-xs text-primary hover:underline"
            @click="markAllRead"
          >
            모두 읽음
          </button>
        </div>

        <div v-if="visibleNotifications.length > 0" class="max-h-80 overflow-y-auto py-1">
          <button
            v-for="n in visibleNotifications"
            :key="n.id"
            type="button"
            class="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            :class="{ 'bg-accent/40': !n.isRead }"
            @click="handleNotifClick(n)"
          >
            <div
              class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"
              :class="
                n.type === 'dm'
                  ? 'bg-emerald-50'
                  : n.type === 'analysis'
                    ? 'bg-violet-50'
                    : 'bg-accent'
              "
            >
              <MessageSquare v-if="n.type === 'comment'" class="size-4 text-primary" />
              <MessageCircle v-else-if="n.type === 'dm'" class="size-4 text-emerald-500" />
              <Sparkles v-else-if="n.type === 'analysis'" class="size-4 text-violet-500" />
              <MessageSquare v-else class="size-4 text-primary" />
            </div>
            <div class="flex-1">
              <p class="text-sm leading-5 text-foreground" :class="{ 'font-semibold': !n.isRead }">
                {{ n.message }}
              </p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ n.createdAt }}</p>
            </div>
            <div v-if="!n.isRead" class="mt-2 size-2 shrink-0 rounded-full bg-primary" />
          </button>
        </div>

        <div v-else class="py-12 text-center text-sm text-muted-foreground">
          새로운 알림이 없어요
        </div>
      </div>
    </Transition>
  </div>
</template>
