<script setup lang="ts">
defineProps<{
  content: string
  isMine: boolean
  time: string
  senderInitial?: string
  senderName?: string
  isDeleted?: boolean
}>()
</script>

<template>
  <div class="flex items-end gap-2" :class="isMine ? 'flex-row-reverse' : 'flex-row'">
    <!-- 상대방 아바타 -->
    <div
      v-if="!isMine"
      class="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
    >
      {{ senderInitial ?? 'U' }}
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
              : 'border border-border bg-white text-foreground',
        ]"
      >
        {{ isDeleted ? '삭제된 메시지예요.' : content }}
      </div>
      <span class="text-xs text-muted-foreground">{{ time }}</span>
    </div>
  </div>
</template>
