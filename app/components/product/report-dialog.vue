<script setup lang="ts">
import { ref } from 'vue'
import { X, CheckCircle2 } from '@lucide/vue'

const props = defineProps<{
  open: boolean
  targetType: 'post' | 'comment'
  targetId: string
}>()
const emit = defineEmits<{ close: [] }>()

const toast = useToastStore()
const selectedReason = ref('')
const submitted = ref(false)
const submitting = ref(false)

const reasons = ['스팸 또는 광고', '부적절한 내용', '허위 정보', '저작권 침해', '기타']

async function submit() {
  if (!selectedReason.value || submitting.value) return
  submitting.value = true
  try {
    await $fetch('/api/reports', {
      method: 'POST',
      body: {
        targetType: props.targetType,
        targetId: props.targetId,
        reason: selectedReason.value,
      },
    })
    submitted.value = true
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '신고 접수에 실패했어요')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  submitted.value = false
  selectedReason.value = ''
  emit('close')
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
        @click.self="handleClose"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose" />
        <div class="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <button
            type="button"
            class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-100"
            @click="handleClose"
          >
            <X class="size-4" />
          </button>

          <!-- 접수 완료 -->
          <div v-if="submitted" class="flex flex-col items-center text-center">
            <div class="flex size-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 class="size-6 text-emerald-500" />
            </div>
            <h2 class="mt-4 text-xl font-black text-foreground">신고가 접수됐어요</h2>
            <p class="mt-2 text-sm text-muted-foreground">운영팀이 검토 후 빠르게 조치할게요.</p>
            <AppButton class="mt-6 w-full" @click="handleClose">확인</AppButton>
          </div>

          <!-- 신고 폼 -->
          <div v-else>
            <h2 class="text-xl font-black text-foreground">신고하기</h2>
            <p class="mt-2 text-sm text-muted-foreground">신고 사유를 선택해주세요.</p>
            <ul class="mt-4 grid gap-2">
              <li v-for="reason in reasons" :key="reason">
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm font-semibold transition-colors"
                  :class="
                    selectedReason === reason
                      ? 'border-primary bg-accent text-foreground'
                      : 'border-border text-foreground hover:bg-slate-50'
                  "
                >
                  <input
                    type="radio"
                    :value="reason"
                    :checked="selectedReason === reason"
                    class="sr-only"
                    @change="selectedReason = reason"
                  />
                  {{ reason }}
                </label>
              </li>
            </ul>
            <AppButton
              class="mt-5 w-full"
              :disabled="!selectedReason"
              :loading="submitting"
              @click="submit"
            >
              신고 접수
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
