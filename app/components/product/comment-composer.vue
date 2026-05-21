<script setup lang="ts">
import { ref } from 'vue'
import { Send } from '@lucide/vue'

const props = defineProps<{
  isLoggedIn: boolean
  loading?: boolean
}>()
const emit = defineEmits<{
  submit: [content: string]
  'open-login': []
}>()

const content = ref('')

function handleFocus() {
  if (!props.isLoggedIn) emit('open-login')
}

function handleSubmit() {
  if (!props.isLoggedIn) {
    emit('open-login')
    return
  }
  if (props.loading) return
  const trimmed = content.value.trim()
  if (!trimmed) return
  emit('submit', trimmed)
  content.value = ''
}
</script>

<template>
  <div class="flex gap-3">
    <div
      class="flex flex-1 items-start rounded-xl border border-input bg-white px-3.5 py-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20"
    >
      <textarea
        v-model="content"
        placeholder="댓글을 입력해주세요. (Ctrl+Enter로 전송)"
        rows="1"
        class="flex-1 resize-none bg-transparent text-sm leading-5 outline-none placeholder:text-muted-foreground"
        @focus="handleFocus"
        @keydown.ctrl.enter.prevent="handleSubmit"
        @keydown.meta.enter.prevent="handleSubmit"
      />
    </div>
    <AppButton
      size="icon"
      :disabled="!content.trim() || loading"
      :loading="loading"
      @click="handleSubmit"
    >
      <Send class="size-4" />
    </AppButton>
  </div>
</template>
