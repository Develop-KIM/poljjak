<script setup lang="ts">
import { CheckCircle2, XCircle, Info, X } from '@lucide/vue'
import { useToastStore } from '~/stores/toast'

const toast = useToastStore()

const icons = { success: CheckCircle2, error: XCircle, info: Info }

const colorMap = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-border bg-card text-foreground',
}

const iconColorMap = {
  success: 'text-emerald-500',
  error: 'text-destructive',
  info: 'text-muted-foreground',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2" style="max-width: 360px">
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="t in toast.toasts"
          :key="t.id"
          class="flex items-start gap-3 rounded-xl border p-4 shadow-lg"
          :class="colorMap[t.type]"
        >
          <component
            :is="icons[t.type]"
            class="mt-0.5 size-4 shrink-0"
            :class="iconColorMap[t.type]"
          />
          <p class="flex-1 text-sm font-semibold leading-5">{{ t.message }}</p>
          <button
            type="button"
            class="shrink-0 opacity-50 hover:opacity-100"
            @click="toast.remove(t.id)"
          >
            <X class="size-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
