<script setup lang="ts">
import { ref } from 'vue'
import { X, Link2, Check } from '@lucide/vue'

withDefaults(
  defineProps<{
    open: boolean
    link?: string
  }>(),
  { link: 'https://poljjak.com/share/abc123' }
)

const emit = defineEmits<{ close: [] }>()

const copied = ref(false)

function copyLink(link: string) {
  navigator.clipboard.writeText(link).catch(() => {})
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        @click.self="emit('close')"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />
        <div class="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <button
            type="button"
            class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-100"
            @click="emit('close')"
          >
            <X class="size-4" />
          </button>
          <div class="flex flex-col items-center text-center">
            <div class="flex size-12 items-center justify-center rounded-full bg-accent">
              <Link2 class="size-6 text-primary" />
            </div>
            <h2 class="mt-4 text-xl font-black text-foreground">공유 링크</h2>
            <p class="mt-2 text-sm text-muted-foreground">링크를 복사해서 공유해보세요.</p>
          </div>
          <div class="mt-6 flex gap-2">
            <input
              type="text"
              :value="link"
              readonly
              class="h-11 min-w-0 flex-1 rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground outline-none"
            />
            <AppButton variant="outline" @click="copyLink(link)">
              <Check v-if="copied" class="size-4 text-emerald-500" />
              <template v-else>복사</template>
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
