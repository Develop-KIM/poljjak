<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, ShieldCheck, Eye, Mail, Phone, Link } from '@lucide/vue'
import { detectPii, applyMasking, type DetectedPii } from '~/utils/piiMasker'

const props = defineProps<{
  open: boolean
  afterHtml: string
}>()

const emit = defineEmits<{
  confirm: [maskedHtml: string]
  cancel: []
}>()

const detected = ref<DetectedPii[]>([])
const selectedIds = ref<Set<string>>(new Set())
const showPreview = ref(false)

watch(
  () => props.open,
  (val) => {
    if (!val) return
    detected.value = detectPii(props.afterHtml)
    // 기본: 전체 선택
    selectedIds.value = new Set(detected.value.map((d) => d.id))
    showPreview.value = false
  },
  { immediate: true }
)

const maskedHtml = computed(() => applyMasking(props.afterHtml, detected.value, selectedIds.value))

const TYPE_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  phone: Phone,
  url: Link,
}

function toggle(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function confirm() {
  emit('confirm', maskedHtml.value)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
        @click.self="emit('cancel')"
      >
        <div
          class="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
        >
          <!-- 헤더 -->
          <div class="flex items-center gap-3 border-b border-border px-6 py-4">
            <ShieldCheck class="size-5 text-primary" />
            <div class="flex-1">
              <h2 class="text-base font-black text-foreground">공개 전 개인정보 마스킹</h2>
              <p class="text-xs text-muted-foreground">마스킹할 항목을 선택하세요</p>
            </div>
            <button
              type="button"
              class="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              @click="emit('cancel')"
            >
              <X class="size-4" />
            </button>
          </div>

          <!-- 본문 -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <!-- 감지된 항목 없음 -->
            <div
              v-if="detected.length === 0"
              class="flex flex-col items-center gap-2 py-8 text-center"
            >
              <ShieldCheck class="size-10 text-emerald-500" />
              <p class="font-semibold text-foreground">개인정보가 감지되지 않았어요</p>
              <p class="text-sm text-muted-foreground">바로 공개해도 안전해요</p>
            </div>

            <!-- 감지된 PII 목록 -->
            <div v-else class="grid gap-2">
              <label
                v-for="item in detected"
                :key="item.id"
                class="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors"
                :class="
                  selectedIds.has(item.id)
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-card hover:bg-muted/40'
                "
              >
                <input
                  type="checkbox"
                  class="accent-primary"
                  :checked="selectedIds.has(item.id)"
                  @change="toggle(item.id)"
                />
                <component
                  :is="TYPE_ICONS[item.type] ?? Link"
                  class="size-4 shrink-0 text-muted-foreground"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-muted-foreground">{{ item.label }}</p>
                  <p class="truncate text-sm font-medium text-foreground">{{ item.value }}</p>
                </div>
                <span
                  v-if="selectedIds.has(item.id)"
                  class="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
                >
                  {{ item.replacement }}
                </span>
              </label>
            </div>

            <!-- 미리보기 토글 -->
            <button
              v-if="detected.length > 0"
              type="button"
              class="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary"
              @click="showPreview = !showPreview"
            >
              <Eye class="size-3.5" />
              {{ showPreview ? '미리보기 닫기' : '마스킹 결과 미리보기' }}
            </button>

            <!-- eslint-disable-next-line vue/no-v-html -->
            <div
              v-if="showPreview"
              class="after-mask-preview mt-3 max-h-48 overflow-y-auto rounded-xl border border-border bg-muted/40 p-4 text-xs leading-6"
              v-html="maskedHtml"
            />
          </div>

          <!-- 푸터 -->
          <div class="flex gap-2 border-t border-border px-6 py-4">
            <AppButton variant="outline" class="flex-1" @click="emit('cancel')">취소</AppButton>
            <AppButton class="flex-1" @click="confirm">
              <ShieldCheck class="size-4" />
              {{ detected.length > 0 ? '마스킹 후 공개하기' : '공개하기' }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.after-mask-preview :deep([data-issue-id]) {
  text-decoration: none;
  background: transparent;
}
</style>
