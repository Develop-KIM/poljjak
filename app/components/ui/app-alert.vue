<script setup lang="ts">
import { computed } from 'vue'
import { Info, CheckCircle2, AlertTriangle, XCircle } from '@lucide/vue'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(
  defineProps<{
    variant?: AlertVariant
  }>(),
  { variant: 'info' }
)

const config = computed(() => {
  const map: Record<AlertVariant, { classes: string; icon: typeof Info }> = {
    info: { classes: 'border-blue-100 bg-blue-50 text-blue-900', icon: Info },
    success: { classes: 'border-emerald-100 bg-emerald-50 text-emerald-900', icon: CheckCircle2 },
    warning: { classes: 'border-amber-100 bg-amber-50 text-amber-900', icon: AlertTriangle },
    error: { classes: 'border-red-100 bg-red-50 text-red-900', icon: XCircle },
  }
  return map[props.variant]
})
</script>

<template>
  <div :class="['flex gap-3 rounded-lg border px-4 py-3 text-sm leading-6', config.classes]">
    <component :is="config.icon" class="mt-0.5 size-4 shrink-0" />
    <div><slot /></div>
  </div>
</template>
