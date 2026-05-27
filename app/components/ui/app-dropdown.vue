<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown, Check } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{
  modelValue: string
  options: Array<{ label: string; value: string }>
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

onClickOutside(dropdownRef, () => { open.value = false })

const selectedLabel = computed(
  () => props.options.find((o) => o.value === props.modelValue)?.label ?? props.placeholder ?? '선택',
)

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
}
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- 트리거 버튼 -->
    <button
      type="button"
      class="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      @click="open = !open"
    >
      <span class="truncate">{{ selectedLabel }}</span>
      <ChevronDown
        class="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <!-- 드롭다운 패널 -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute left-0 top-[calc(100%+6px)] z-50 min-w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg"
      >
        <ul class="max-h-60 overflow-y-auto py-1">
          <li v-for="opt in options" :key="opt.value">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-xs font-medium transition-colors"
              :class="
                opt.value === modelValue
                  ? 'bg-accent text-primary'
                  : 'text-foreground hover:bg-muted'
              "
              @click="select(opt.value)"
            >
              <span>{{ opt.label }}</span>
              <Check v-if="opt.value === modelValue" class="size-3 shrink-0 text-primary" />
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
