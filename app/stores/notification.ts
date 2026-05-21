import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Notification {
  id: string
  type: 'comment' | 'like' | 'dm' | 'analysis'
  message: string
  linkUrl: string
  isRead: boolean
  actorAvatarUrl: string | null
  createdAt: string
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  // 종(bell) — dm 제외
  const bellNotifications = computed(() => notifications.value.filter((n) => n.type !== 'dm'))
  const bellUnreadCount = computed(() => bellNotifications.value.filter((n) => !n.isRead).length)

  // 채팅 아이콘 — dm만
  const dmUnreadCount = computed(
    () => notifications.value.filter((n) => n.type === 'dm' && !n.isRead).length,
  )

  async function fetch() {
    try {
      const res = await $fetch<{ data: Notification[] }>('/api/notifications')
      notifications.value = res.data
    } catch {
      // 조용히 실패
    }
  }

  function markRead(id: string) {
    const n = notifications.value.find((n) => n.id === id)
    if (n) n.isRead = true
  }

  // 종(bell) 알림만 읽음 처리 (DM 제외)
  function markAllBellRead() {
    notifications.value.forEach((n) => {
      if (n.type !== 'dm') n.isRead = true
    })
  }

  // 채팅 입장 시 DM 알림만 읽음 처리
  function markDmRead() {
    notifications.value.forEach((n) => {
      if (n.type === 'dm') n.isRead = true
    })
  }

  return {
    notifications, bellNotifications, bellUnreadCount, dmUnreadCount,
    fetch, markRead, markAllBellRead, markDmRead,
  }
})
