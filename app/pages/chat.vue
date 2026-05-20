<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Send, ArrowLeft } from '@lucide/vue'

interface Room {
  id: string
  name: string
  initial: string
  lastMessage: string
  time: string
  unread: number
}

interface Message {
  id: number
  content: string
  isMine: boolean
  time: string
  isDeleted?: boolean
}

const rooms: Room[] = [
  {
    id: '1',
    name: '박리뷰어',
    initial: '박',
    lastMessage: '네, 감사합니다!',
    time: '10분 전',
    unread: 0,
  },
  {
    id: '2',
    name: '이멘토',
    initial: '이',
    lastMessage: '포트폴리오 잘 봤어요',
    time: '1시간 전',
    unread: 2,
  },
  {
    id: '3',
    name: '김민준',
    initial: '김',
    lastMessage: '스터디 참여 가능하신가요?',
    time: '어제',
    unread: 0,
  },
]

const messages: Message[] = [
  {
    id: 1,
    content: '안녕하세요! 포트폴리오 피드백 남겨주셔서 감사해요.',
    isMine: false,
    time: '오후 2:30',
  },
  {
    id: 2,
    content: '도움이 됐으면 좋겠어요. 궁금한 점 있으면 편하게 물어보세요!',
    isMine: true,
    time: '오후 2:31',
  },
  {
    id: 3,
    content: '성과 수치 표현을 어떻게 하면 좋을지 더 여쭤봐도 될까요?',
    isMine: false,
    time: '오후 2:33',
  },
  {
    id: 4,
    content: '이 메시지는 삭제되었습니다.',
    isMine: false,
    time: '오후 2:34',
    isDeleted: true,
  },
  {
    id: 5,
    content:
      '물론이죠! "성능을 개선했다"보다 "쿼리 최적화로 응답 속도를 40% 단축했다"처럼 수치를 넣으면 훨씬 설득력 있어요.',
    isMine: true,
    time: '오후 2:35',
  },
  { id: 6, content: '네, 감사합니다!', isMine: false, time: '오후 2:40' },
]

const selectedRoomId = ref<string | null>('1')
const selectedRoom = computed(() => rooms.find((r) => r.id === selectedRoomId.value) ?? null)
const newMessage = ref('')
const messageListRef = ref<HTMLElement | null>(null)

const isMobileChat = computed(() => !!selectedRoomId.value)

function selectRoom(id: string) {
  selectedRoomId.value = id
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

function sendMessage() {
  if (!newMessage.value.trim()) return
  newMessage.value = ''
}
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
        <button
          v-for="room in rooms"
          :key="room.id"
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
          :class="{ 'bg-accent/50': selectedRoomId === room.id }"
          @click="selectRoom(room.id)"
        >
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700"
          >
            {{ room.initial }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-sm font-semibold text-foreground">{{ room.name }}</span>
              <span class="shrink-0 text-xs text-muted-foreground">{{ room.time }}</span>
            </div>
            <p class="mt-0.5 truncate text-sm text-muted-foreground">{{ room.lastMessage }}</p>
          </div>
          <span
            v-if="room.unread > 0"
            class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
          >
            {{ room.unread }}
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
            class="flex size-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700"
          >
            {{ selectedRoom.initial }}
          </div>
          <span class="text-sm font-semibold text-foreground">{{ selectedRoom.name }}</span>
        </div>

        <!-- 메시지 목록 -->
        <div ref="messageListRef" class="flex-1 overflow-y-auto px-5 py-6">
          <div class="grid gap-4">
            <ChatMessageBubble
              v-for="msg in messages"
              :key="msg.id"
              :content="msg.content"
              :is-mine="msg.isMine"
              :time="msg.time"
              :sender-initial="selectedRoom.initial"
              :sender-name="selectedRoom.name"
              :is-deleted="msg.isDeleted"
            />
          </div>
        </div>

        <!-- 입력창 -->
        <div class="border-t border-border px-4 py-3">
          <div class="flex gap-2">
            <div
              class="flex flex-1 items-center rounded-xl border border-input bg-white px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 transition-colors"
            >
              <input
                v-model="newMessage"
                type="text"
                placeholder="메시지를 입력해주세요."
                class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                @keydown.enter.prevent="sendMessage"
              />
            </div>
            <AppButton size="icon" :disabled="!newMessage.trim()" @click="sendMessage">
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
