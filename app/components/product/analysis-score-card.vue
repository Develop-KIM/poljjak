<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp } from '@lucide/vue'

const props = defineProps<{
  title: string
  score: number
  comment: string
  improvement?: string
}>()

const barColor = computed(() => {
  if (props.score >= 8) return 'bg-emerald-500'
  if (props.score >= 6) return 'bg-primary'
  return 'bg-orange-400'
})

const scoreColor = computed(() => {
  if (props.score >= 8) return 'text-emerald-600'
  if (props.score >= 6) return 'text-primary'
  return 'text-orange-500'
})
</script>

<template>
  <div class="flex h-full flex-col rounded-xl border border-border bg-card p-5">
    <!-- 제목 + 점수 -->
    <div class="flex items-start justify-between gap-4">
      <h3 class="font-bold text-foreground">{{ title }}</h3>
      <div class="shrink-0 text-right">
        <span class="text-2xl font-bold" :class="scoreColor">{{ score }}</span>
        <span class="text-sm font-semibold text-muted-foreground">/10</span>
      </div>
    </div>

    <!-- 점수 바 -->
    <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        class="h-full rounded-full transition-all"
        :class="barColor"
        :style="{ width: `${score * 10}%` }"
      />
    </div>

    <!-- 현재 평가 -->
    <p class="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{{ comment }}</p>

    <!-- 개선 방향 — 항상 하단에 고정 -->
    <div v-if="improvement" class="mt-3 flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2.5">
      <TrendingUp class="mt-0.5 size-3.5 shrink-0 text-primary" />
      <p class="text-xs font-medium leading-5 text-primary">{{ improvement }}</p>
    </div>
  </div>
</template>
