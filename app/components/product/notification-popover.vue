<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bell, MessageSquare, Heart, MessageCircle } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'

type NotifType = 'comment' | 'like' | 'dm'

interface Notification {
  id: number
  type: NotifType
  message: string
  time: string
  read: boolean
}

const open = ref(false)
const popoverRef = ref<HTMLElement | null>(null)

onClickOutside(popoverRef, () => {
  open.value = false
})

const notifications = ref<Notification[]>([
  {
    id: 1,
    type: 'comment',
    message: '박리뷰어님이 내 게시글에 댓글을 달았어요',
    time: '방금',
    read: false,
  },
  { id: 2, type: 'like', message: '이멘토님이 내 게시글을 좋아해요', time: '5분 전', read: false },
  { id: 3, type: 'dm', message: '김민준님이 메시지를 보냈어요', time: '1시간 전', read: true },
])

const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

function markAllRead() {
  notifications.value.forEach((n) => {
    n.read = true
  })
}
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

        <div v-if="notifications.length > 0" class="max-h-80 overflow-y-auto py-1">
          <div
            v-for="n in notifications"
            :key="n.id"
            class="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
            :class="{ 'bg-accent/40': !n.read }"
          >
            <div
              class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"
              :class="
                n.type === 'like' ? 'bg-red-50' : n.type === 'dm' ? 'bg-emerald-50' : 'bg-accent'
              "
            >
              <MessageSquare v-if="n.type === 'comment'" class="size-4 text-primary" />
              <Heart v-else-if="n.type === 'like'" class="size-4 text-red-500" />
              <MessageCircle v-else class="size-4 text-emerald-500" />
            </div>
            <div class="flex-1">
              <p class="text-sm leading-5 text-foreground" :class="{ 'font-semibold': !n.read }">
                {{ n.message }}
              </p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ n.time }}</p>
            </div>
            <div v-if="!n.read" class="mt-2 size-2 shrink-0 rounded-full bg-primary" />
          </div>
        </div>

        <div v-else class="py-12 text-center text-sm text-muted-foreground">
          새로운 알림이 없어요
        </div>
      </div>
    </Transition>
  </div>
</template>
