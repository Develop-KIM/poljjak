<script setup lang="ts">
defineProps<{
  id?: string
  modelValue?: string
  placeholder?: string
  type?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :id="id"
    :value="modelValue"
    :type="type ?? 'text'"
    :placeholder="placeholder"
    :disabled="disabled"
    class="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
