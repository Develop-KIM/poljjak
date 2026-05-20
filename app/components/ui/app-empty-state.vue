<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <slot name="icon" />
    <p class="mt-4 text-base font-bold text-foreground">{{ title }}</p>
    <p v-if="description" class="mt-1.5 max-w-xs text-sm leading-6 text-muted-foreground">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>
