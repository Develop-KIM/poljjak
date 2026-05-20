<script setup lang="ts">
import { CheckCircle2, Circle, Loader2 } from '@lucide/vue'

type StepStatus = 'done' | 'active' | 'pending'

interface Step {
  label: string
  status: StepStatus
}

withDefaults(
  defineProps<{
    steps?: Step[]
    streamingText?: string
  }>(),
  {
    steps: () => [
      { label: '업로드 확인', status: 'done' },
      { label: '텍스트 추출', status: 'done' },
      { label: 'AI 분석', status: 'active' },
      { label: '결과 정리', status: 'pending' },
    ],
    streamingText: 'AI가 포트폴리오의 구조와 내용을 분석 중입니다...',
  }
)
</script>

<template>
  <div class="flex flex-col items-center py-16 text-center">
    <h1 class="text-2xl font-black text-foreground">포트폴리오를 분석하고 있어요</h1>
    <p class="mt-3 text-sm text-muted-foreground">
      잠시만 기다려주세요. 보통 30초에서 1분 정도 걸려요.
    </p>

    <div class="mt-10 flex items-center gap-2">
      <template v-for="(step, i) in steps" :key="step.label">
        <div class="flex flex-col items-center gap-2">
          <div class="flex size-8 items-center justify-center">
            <CheckCircle2 v-if="step.status === 'done'" class="size-6 text-emerald-500" />
            <Loader2
              v-else-if="step.status === 'active'"
              class="size-6 animate-spin text-primary"
            />
            <Circle v-else class="size-6 text-border" />
          </div>
          <span
            class="text-xs font-semibold"
            :class="step.status === 'pending' ? 'text-muted-foreground/60' : 'text-foreground'"
          >
            {{ step.label }}
          </span>
        </div>
        <div v-if="i < steps.length - 1" class="mb-5 h-px w-8 shrink-0 bg-border" />
      </template>
    </div>

    <div class="mt-10 w-full max-w-xl rounded-lg border border-border bg-card p-5 text-left">
      <p class="min-h-24 text-sm leading-7 text-muted-foreground">
        {{ streamingText }}
      </p>
    </div>
  </div>
</template>
