<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { Send, ArrowLeft } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'

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
  senderNickname: string
  senderAvatarUrl: string | null
  createdAt: string
}

const rooms = ref<Room[]>([])
const messages = ref<Message[]>([])
const selectedRoomId = ref<string | null>(null)
const selectedRoom = computed(() => rooms.value.find((r) => r.id === selectedRoomId.value) ?? null)
const newMessage = ref('')
const messageListRef = ref<HTMLElement | null>(null)
const sending = ref(false)
const roomsPending = ref(true)
const messagesPending = ref(false)

const isMobileChat = computed(() => !!selectedRoomId.value)

let messageChannel: ReturnType<typeof client.channel> | null = null

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

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

async function selectRoom(id: string) {
  if (selectedRoomId.value === id) return

  messageChannel?.unsubscribe()
  selectedRoomId.value = id
  await fetchMessages(id)

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
          senderNickname: msg.senderNickname,
          senderAvatarUrl: msg.senderAvatarUrl,
          createdAt: msg.createdAt,
        })
        await nextTick()
        scrollToBottom()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve()
      })
  })
}

async function sendMessage() {
  if (!newMessage.value.trim() || !selectedRoomId.value || sending.value) return

  const content = newMessage.value.trim()
  newMessage.value = ''
  sending.value = true

  try {
    const res = await $fetch<{ data: Message }>(`/api/chats/${selectedRoomId.value}/messages`, {
      method: 'POST',
      body: { content },
    })
    messages.value.push(res.data)

    // 구독 중인 채널로 브로드캐스트
    if (messageChannel) {
      await messageChannel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: { ...res.data, senderId: authStore.profile?.id },
      })
    }

    // 채팅방 목록 마지막 메시지 업데이트
    const room = rooms.value.find((r) => r.id === selectedRoomId.value)
    if (room) {
      room.lastMessage = content
      room.lastMessageAt = '방금'
    }
    await nextTick()
    scrollToBottom()
  } catch {
    newMessage.value = content
  } finally {
    sending.value = false
  }
}

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
  <div class="mx-auto flex h-[calc(100vh-4rem-1px)] max-w-[1120px] overflow-hidden">
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
          class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
          :class="{ 'bg-accent/50': selectedRoomId === room.id }"
          @click="selectRoom(room.id)"
        >
          <div
            v-if="room.otherAvatarUrl"
            class="size-10 shrink-0 overflow-hidden rounded-full"
          >
            <img :src="room.otherAvatarUrl" alt="" class="h-full w-full object-cover" />
          </div>
          <div
            v-else
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700"
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
    <div class="flex flex-1 flex-col" :class="!isMobileChat ? 'hidden md:flex' : 'flex'">
      <template v-if="selectedRoom">
        <!-- 대화방 헤더 -->
        <div class="flex items-center gap-3 border-b border-border px-5 py-4">
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-100 md:hidden"
            @click="selectedRoomId = null"
          >
            <ArrowLeft class="size-5" />
          </button>
          <div
            v-if="selectedRoom.otherAvatarUrl"
            class="size-8 overflow-hidden rounded-full"
          >
            <img :src="selectedRoom.otherAvatarUrl" alt="" class="h-full w-full object-cover" />
          </div>
          <div
            v-else
            class="flex size-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700"
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
        </div>

        <!-- 메시지 목록 -->
        <div ref="messageListRef" class="flex-1 overflow-y-auto px-5 py-6">
          <div v-if="messagesPending" class="flex justify-center py-10">
            <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
          <div v-else class="grid gap-4">
            <ChatMessageBubble
              v-for="msg in messages"
              :key="msg.id"
              :content="msg.content ?? ''"
              :is-mine="msg.isMine"
              :time="formatTime(msg.createdAt)"
              :sender-initial="selectedRoom.otherInitial"
              :sender-name="selectedRoom.otherNickname"
              :is-deleted="msg.isDeleted"
            />
          </div>
        </div>

        <!-- 입력창 -->
        <div class="border-t border-border px-4 py-3">
          <div class="flex gap-2">
            <div class="flex flex-1 items-center rounded-xl border border-input bg-white px-3.5 py-2.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
              <input
                v-model="newMessage"
                type="text"
                placeholder="메시지를 입력해주세요."
                class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                @keydown.enter.prevent="(e: KeyboardEvent) => !e.isComposing && sendMessage()"
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
</template>
