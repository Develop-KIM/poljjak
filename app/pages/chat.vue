<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { Send, ArrowLeft, LogOut } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notification'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const client = useSupabaseClient()
const route = useRoute()

interface Room {
  id: string
  otherId: string
  otherNickname: string
  otherInitial: string
  otherAvatarUrl: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  sourcePostId: string | null
  sourcePostTitle: string | null
  sourcePostDeleted: boolean
}

interface Message {
  id: string
  content: string | null
  isMine: boolean
  isDeleted: boolean
  isRead: boolean
  senderNickname: string
  senderAvatarUrl: string | null
  createdAt: string
}

const rooms = ref<Room[]>([])
const messages = ref<Message[]>([])
const selectedRoomId = ref<string | null>(null)
const selectedRoom = computed(() => rooms.value.find((r) => r.id === selectedRoomId.value) ?? null)
const newMessage = ref('')
const messageInputRef = ref<HTMLTextAreaElement | null>(null)
const messageListRef = ref<HTMLElement | null>(null)
const sending = ref(false)
const leaving = ref(false)
const showLeaveConfirm = ref(false)
const roomsPending = ref(true)
const messagesPending = ref(false)

const isMobileChat = computed(() => !!selectedRoomId.value)

let messageChannel: ReturnType<typeof client.channel> | null = null

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const toDateStr = (dt: Date) =>
    dt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  if (toDateStr(d) === toDateStr(today)) return '오늘'
  if (toDateStr(d) === toDateStr(yesterday)) return '어제'
  return toDateStr(d)
}

function getDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR')
}

/** 날짜 구분선 포함된 메시지 목록 */
type MessageItem = Message | { type: 'date-divider'; label: string; key: string }

const messagesWithDividers = computed<MessageItem[]>(() => {
  const result: MessageItem[] = []
  let lastDate = ''
  for (const msg of messages.value) {
    const date = getDateKey(msg.createdAt)
    if (date !== lastDate) {
      result.push({ type: 'date-divider', label: formatDateLabel(msg.createdAt), key: date })
      lastDate = date
    }
    result.push(msg)
  }
  return result
})

async function fetchRooms() {
  try {
    const res = await $fetch<{ data: Room[] }>('/api/chats')
    rooms.value = res.data
  } catch {
    // 조용히 실패
  } finally {
    roomsPending.value = false
  }
}

async function fetchMessages(roomId: string) {
  messagesPending.value = true
  try {
    const res = await $fetch<{ data: Message[] }>(`/api/chats/${roomId}/messages`)
    messages.value = res.data
    // 해당 방 unread 초기화
    const room = rooms.value.find((r) => r.id === roomId)
    if (room) room.unreadCount = 0
    await nextTick()
    scrollToBottom()
  } catch {
    // 조용히 실패
  } finally {
    messagesPending.value = false
  }
}

function scrollToBottom() {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

function moveRoomToTop(roomId: string, lastMessage: string) {
  const idx = rooms.value.findIndex((r) => r.id === roomId)
  if (idx < 0) return
  const room = rooms.value[idx]!
  room.lastMessage = lastMessage
  room.lastMessageAt = '방금'
  rooms.value.splice(idx, 1)
  rooms.value.unshift(room)
}

async function selectRoom(id: string) {
  if (selectedRoomId.value === id) return

  messageChannel?.unsubscribe()
  selectedRoomId.value = id
  await fetchMessages(id)

  // 해당 방 입장 시 DM 알림 읽음 처리
  $fetch('/api/notifications/read-dm', { method: 'POST' })
    .then(() => {
      notifStore.markDmRead()
    })
    .catch(() => {})

  // 읽음 처리 API 호출
  $fetch(`/api/chats/${id}/read`, { method: 'PATCH' })
    .then(() => {
      // 읽음 broadcast로 상대방 화면 업데이트
      if (messageChannel) {
        messageChannel.send({ type: 'broadcast', event: 'read', payload: {} }).catch(() => {})
      }
    })
    .catch(() => {})

  // Broadcast 방식 — postgres_changes 대신 사용
  await new Promise<void>((resolve) => {
    messageChannel = client
      .channel(`room:${id}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'new_message' }, async (payload) => {
        const msg = payload.payload as Message & { senderId: string }
        if (msg.senderId === authStore.profile?.id) return
        messages.value.push({
          id: msg.id,
          content: msg.content,
          isMine: false,
          isDeleted: msg.isDeleted,
          isRead: false,
          senderNickname: msg.senderNickname,
          senderAvatarUrl: msg.senderAvatarUrl,
          createdAt: msg.createdAt,
        })
        // 새 메시지 수신 시 즉시 읽음 처리
        $fetch(`/api/chats/${id}/read`, { method: 'PATCH' }).catch(() => {})
        if (messageChannel) {
          messageChannel.send({ type: 'broadcast', event: 'read', payload: {} }).catch(() => {})
        }
        moveRoomToTop(id, msg.content ?? '')
        await nextTick()
        scrollToBottom()
      })
      .on('broadcast', { event: 'delete_message' }, (payload) => {
        const deleted = payload.payload as { id: string }
        const target = messages.value.find((message) => message.id === deleted.id)
        if (!target) return
        target.content = null
        target.isDeleted = true
        moveRoomToTop(id, '삭제된 메시지예요')
      })
      .on('broadcast', { event: 'read' }, () => {
        // 상대방이 읽음 → 내가 보낸 메시지 isRead = true
        messages.value.forEach((m) => {
          if (m.isMine) m.isRead = true
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve()
      })
  })
}

function resizeTextarea() {
  const el = messageInputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 96) + 'px'
}

async function sendMessage() {
  if (!newMessage.value.trim() || !selectedRoomId.value || sending.value) return

  const content = newMessage.value.trim()
  newMessage.value = ''
  await nextTick()
  resizeTextarea()
  sending.value = true

  try {
    const res = await $fetch<{ data: Message }>(`/api/chats/${selectedRoomId.value}/messages`, {
      method: 'POST',
      body: { content },
    })
    messages.value.push({ ...res.data, isRead: false })

    // 구독 중인 채널로 브로드캐스트
    if (messageChannel) {
      await messageChannel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: { ...res.data, senderId: authStore.profile?.id },
      })
    }

    // 채팅방 목록 마지막 메시지 업데이트 및 최상단으로 이동
    if (selectedRoomId.value) moveRoomToTop(selectedRoomId.value, content)
    await nextTick()
    scrollToBottom()
  } catch {
    newMessage.value = content
  } finally {
    sending.value = false
  }
}

async function deleteMessage(messageId: string) {
  if (!selectedRoomId.value) return
  const target = messages.value.find((message) => message.id === messageId)
  if (!target || !target.isMine || target.isDeleted) return

  try {
    await $fetch(`/api/chats/${selectedRoomId.value}/messages/${messageId}`, { method: 'DELETE' })
    target.content = null
    target.isDeleted = true
    moveRoomToTop(selectedRoomId.value, '삭제된 메시지예요')

    if (messageChannel) {
      await messageChannel.send({
        type: 'broadcast',
        event: 'delete_message',
        payload: { id: messageId },
      })
    }
  } catch {
    // 조용히 실패
  }
}

async function leaveRoom() {
  if (!selectedRoomId.value || leaving.value) return
  showLeaveConfirm.value = false
  const roomId = selectedRoomId.value
  leaving.value = true
  try {
    await $fetch(`/api/chats/${roomId}`, { method: 'DELETE' })
    rooms.value = rooms.value.filter((room) => room.id !== roomId)
    messages.value = []
    selectedRoomId.value = null
    messageChannel?.unsubscribe()
    messageChannel = null
  } catch {
    // 조용히 실패
  } finally {
    leaving.value = false
  }
}

const notifStore = useNotificationStore()

// 다른 방에서 새 DM이 오면(dmUnreadCount 증가) 목록 재조회해서 상단으로 올림
watch(
  () => notifStore.dmUnreadCount,
  (next, prev) => {
    if (next > prev) fetchRooms()
  }
)

onMounted(async () => {
  await fetchRooms()
  // DM 버튼에서 직접 진입한 경우 해당 방 자동 선택
  const targetRoomId = route.query.roomId as string | undefined
  if (targetRoomId) {
    await selectRoom(targetRoomId)
  }
})

onUnmounted(() => {
  messageChannel?.unsubscribe()
})
</script>

<template>
  <div class="mx-auto flex max-w-[1440px] overflow-hidden" style="height: calc(100vh - 65px)">
    <!-- 채팅방 목록 -->
    <div
      class="flex flex-col border-r border-border bg-background"
      :class="isMobileChat ? 'hidden md:flex md:w-72' : 'w-full md:w-72'"
    >
      <div class="border-b border-border px-5 py-4">
        <h1 class="text-lg font-black text-foreground">채팅</h1>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="roomsPending" class="flex justify-center py-10">
          <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
        <p v-else-if="rooms.length === 0" class="py-12 text-center text-sm text-muted-foreground">
          채팅 내역이 없어요
        </p>
        <button
          v-for="room in rooms"
          v-else
          :key="room.id"
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted"
          :class="{ 'bg-accent/50': selectedRoomId === room.id }"
          @click="selectRoom(room.id)"
        >
          <div v-if="room.otherAvatarUrl" class="size-10 shrink-0 overflow-hidden rounded-full">
            <img :src="room.otherAvatarUrl" alt="" class="h-full w-full object-cover" />
          </div>
          <div
            v-else
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground"
          >
            {{ room.otherInitial }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-sm font-semibold text-foreground">{{ room.otherNickname }}</span>
              <span class="shrink-0 text-xs text-muted-foreground">{{ room.lastMessageAt }}</span>
            </div>
            <p class="mt-0.5 truncate text-sm text-muted-foreground">{{ room.lastMessage }}</p>
          </div>
          <span
            v-if="room.unreadCount > 0"
            class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
          >
            {{ room.unreadCount > 9 ? '9+' : room.unreadCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- 대화 영역 -->
    <div class="flex min-h-0 flex-1 flex-col" :class="!isMobileChat ? 'hidden md:flex' : 'flex'">
      <template v-if="selectedRoom">
        <!-- 대화방 헤더 -->
        <div class="flex items-center gap-3 border-b border-border px-5 py-4">
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            @click="selectedRoomId = null"
          >
            <ArrowLeft class="size-5" />
          </button>
          <div v-if="selectedRoom.otherAvatarUrl" class="size-8 overflow-hidden rounded-full">
            <img :src="selectedRoom.otherAvatarUrl" alt="" class="h-full w-full object-cover" />
          </div>
          <div
            v-else
            class="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground"
          >
            {{ selectedRoom.otherInitial }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-foreground">{{ selectedRoom.otherNickname }}</p>
            <NuxtLink
              v-if="selectedRoom.sourcePostTitle && !selectedRoom.sourcePostDeleted"
              :to="`/community/${selectedRoom.sourcePostId}`"
              class="mt-0.5 block truncate text-xs text-primary hover:underline"
            >
              {{ selectedRoom.sourcePostTitle }}
            </NuxtLink>
            <p
              v-else-if="selectedRoom.sourcePostTitle && selectedRoom.sourcePostDeleted"
              class="mt-0.5 truncate text-xs text-muted-foreground line-through"
            >
              {{ selectedRoom.sourcePostTitle }} (삭제된 게시글)
            </p>
          </div>
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            :disabled="leaving"
            aria-label="채팅방 나가기"
            @click="showLeaveConfirm = true"
          >
            <LogOut class="size-4" />
          </button>
        </div>

        <!-- 메시지 목록 -->
        <div ref="messageListRef" class="flex-1 overflow-y-auto px-5 py-6">
          <div v-if="messagesPending" class="flex justify-center py-10">
            <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
          <div v-else class="grid gap-4">
            <template
              v-for="item in messagesWithDividers"
              :key="'type' in item ? item.key : item.id"
            >
              <!-- 날짜 구분선 -->
              <div v-if="'type' in item" class="flex items-center gap-3">
                <div class="h-px flex-1 bg-border" />
                <span class="text-xs text-muted-foreground">{{ item.label }}</span>
                <div class="h-px flex-1 bg-border" />
              </div>
              <!-- 메시지 -->
              <template v-else>
                <ChatMessageBubble
                  :content="item.content ?? ''"
                  :is-mine="item.isMine"
                  :time="formatTime(item.createdAt)"
                  :sender-initial="selectedRoom.otherInitial"
                  :sender-name="selectedRoom.otherNickname"
                  :sender-avatar-url="item.senderAvatarUrl ?? selectedRoom.otherAvatarUrl"
                  :is-deleted="item.isDeleted"
                  @delete="deleteMessage(item.id)"
                />
                <!-- 읽음 표시 (내가 보낸 메시지만) -->
                <div v-if="item.isMine && !item.isDeleted" class="flex justify-end">
                  <span class="text-[10px] text-muted-foreground">{{
                    item.isRead ? '읽음' : ''
                  }}</span>
                </div>
              </template>
            </template>
          </div>
        </div>

        <!-- 입력창 -->
        <div class="border-t border-border px-4 py-3">
          <div class="flex items-end gap-2">
            <div
              class="flex flex-1 items-end rounded-xl border border-input bg-background px-3.5 py-2.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20"
            >
              <textarea
                ref="messageInputRef"
                v-model="newMessage"
                rows="1"
                placeholder="메시지를 입력해주세요."
                class="max-h-24 flex-1 resize-none bg-transparent text-sm leading-5 outline-none placeholder:text-muted-foreground"
                @input="resizeTextarea"
                @keydown.enter.exact.prevent="(e: KeyboardEvent) => !e.isComposing && sendMessage()"
              />
            </div>
            <AppButton size="icon" :disabled="!newMessage.trim() || sending" @click="sendMessage">
              <Send class="size-4" />
            </AppButton>
          </div>
        </div>
      </template>

      <!-- 대화방 미선택 (데스크탑) -->
      <div v-else class="hidden flex-1 items-center justify-center md:flex">
        <div class="text-center">
          <p class="text-base font-bold text-foreground">대화를 선택해주세요</p>
          <p class="mt-1.5 text-sm text-muted-foreground">
            왼쪽 목록에서 채팅방을 선택하면 대화를 시작할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- 채팅방 나가기 확인 모달 -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showLeaveConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="showLeaveConfirm = false"
      >
        <div class="w-full max-w-sm rounded-2xl bg-popover p-6 text-popover-foreground shadow-xl">
          <h3 class="text-lg font-black text-foreground">채팅방을 나갈까요?</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            나가면 이 채팅방이 목록에서 사라지고 대화 내용을 다시 볼 수 없어요.
          </p>
          <div class="mt-6 flex gap-3">
            <AppButton variant="outline" class="flex-1" @click="showLeaveConfirm = false">
              취소
            </AppButton>
            <AppButton
              class="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              :loading="leaving"
              @click="leaveRoom"
            >
              나가기
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
