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
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-100',
    red: 'bg-red-50 text-red-700 ring-red-100',
    gray: 'bg-slate-100 text-slate-700 ring-slate-200',
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
