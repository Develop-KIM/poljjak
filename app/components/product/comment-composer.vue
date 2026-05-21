<script setup lang="ts">
import { ref } from 'vue'

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
      class="flex flex-1 items-start rounded-xl border border-input bg-background px-3.5 py-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20"
    >
      <textarea
        v-model="content"
        placeholder="댓글을 입력해주세요."
        rows="1"
        class="flex-1 resize-none bg-transparent text-sm leading-5 outline-none placeholder:text-muted-foreground"
        @focus="handleFocus"
        @keydown.enter.prevent="handleSubmit"
      />
    </div>
    <AppButton
      size="sm"
      class="h-[46px] px-4"
      :disabled="!content.trim() || loading"
      :loading="loading"
      @click="handleSubmit"
    >
      등록
    </AppButton>
  </div>
</template>
