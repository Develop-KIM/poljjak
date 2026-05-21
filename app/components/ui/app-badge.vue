<script setup lang="ts">
import { computed } from 'vue'

type BadgeVariant = 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'gray'

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant
  }>(),
  {
    variant: 'default',
  }
)

const classes = computed(() => {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-primary text-primary-foreground',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-900/70',
    green:
      'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900/70',
    yellow:
      'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900/70',
    red: 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-900/70',
    gray: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-muted dark:text-muted-foreground dark:ring-border',
  }

  return [
    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
    variants[props.variant],
  ]
})
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
