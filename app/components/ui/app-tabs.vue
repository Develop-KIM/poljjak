<script setup lang="ts">
defineProps<{
  modelValue: string
  tabs: Array<{ label: string; value: string; count?: number }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex border-b border-border">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors"
      :class="
        modelValue === tab.value
          ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
          : 'text-muted-foreground hover:text-foreground'
      "
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
      <span v-if="tab.count !== undefined" class="rounded-full bg-muted px-1.5 py-0.5 text-xs">
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>
