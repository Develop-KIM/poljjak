<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id?: string
  modelValue?: string
  placeholder?: string
  rows?: number
  maxlength?: number
  disabled?: boolean
  showCount?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const charCount = computed(() => props.modelValue?.length ?? 0)
</script>

<template>
  <div class="relative">
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows ?? 5"
      :maxlength="maxlength"
      :disabled="disabled"
      class="w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted"
      :class="{ 'pb-8': showCount && maxlength }"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <span
      v-if="showCount && maxlength"
      class="pointer-events-none absolute bottom-2.5 right-3 text-xs text-muted-foreground"
    >
      {{ charCount }}/{{ maxlength }}
    </span>
  </div>
</template>
