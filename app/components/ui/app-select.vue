<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'

defineProps<{
  id?: string
  modelValue?: string
  options: Array<{ label: string; value: string }>
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="relative">
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      class="h-11 w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-9 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted"
      :class="{ 'text-muted-foreground': !modelValue }"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled :selected="!modelValue">
        {{ placeholder }}
      </option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <ChevronDown
      class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
    />
  </div>
</template>
