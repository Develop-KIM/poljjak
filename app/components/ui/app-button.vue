<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
  }
)

const classes = computed(() => {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
    outline:
      'border border-border bg-transparent text-foreground hover:bg-muted active:bg-muted/80',
    ghost: 'text-foreground hover:bg-muted active:bg-muted/80',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
  }
  const sizes: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
    icon: 'size-10 p-0',
  }
  return [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[props.variant],
    sizes[props.size],
  ]
})
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="classes">
    <span
      v-if="loading"
      class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
    <slot v-else />
  </button>
</template>
