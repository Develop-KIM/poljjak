<script setup lang="ts">
import { Trash2 } from '@lucide/vue'

defineProps<{
  content: string
  isMine: boolean
  time: string
  senderInitial?: string
  senderName?: string
  senderAvatarUrl?: string | null
  isDeleted?: boolean
}>()

const emit = defineEmits<{
  delete: []
}>()
</script>

<template>
  <div class="flex items-start gap-2" :class="isMine ? 'flex-row-reverse' : 'flex-row'">
    <!-- 상대방 아바타 -->
    <div
      v-if="!isMine"
      class="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold text-muted-foreground"
    >
      <span>{{ senderInitial ?? 'U' }}</span>
      <img
        v-if="senderAvatarUrl"
        :src="senderAvatarUrl"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
        @error="($event.currentTarget as HTMLImageElement).style.display = 'none'"
      />
    </div>

    <div class="flex max-w-[70%] flex-col gap-1" :class="isMine ? 'items-end' : 'items-start'">
      <span v-if="!isMine && senderName" class="text-xs text-muted-foreground">
        {{ senderName }}
      </span>
      <div
        class="rounded-2xl px-4 py-2.5 text-sm leading-5"
        :class="[
          isDeleted
            ? 'bg-muted italic text-muted-foreground'
            : isMine
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground',
        ]"
      >
        {{ isDeleted ? '삭제된 메시지예요.' : content }}
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="isMine && !isDeleted"
          type="button"
          class="text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
          aria-label="메시지 삭제"
          @click="emit('delete')"
        >
          <Trash2 class="size-3.5" />
        </button>
        <span class="text-xs text-muted-foreground">{{ time }}</span>
      </div>
    </div>
  </div>
</template>
