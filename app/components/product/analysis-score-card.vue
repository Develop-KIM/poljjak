<script setup lang="ts">
defineProps<{
  title: string
  score: number
  comment: string
}>()
</script>

<template>
  <AppCard>
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="font-bold text-foreground">{{ title }}</h3>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ comment }}</p>
      </div>
      <div class="shrink-0 text-right">
        <span class="text-2xl font-bold text-primary">{{ score }}</span>
        <span class="text-sm font-semibold text-muted-foreground">/10</span>
      </div>
    </div>
    <div class="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
      <div class="h-full rounded-full bg-primary" :style="{ width: `${score * 10}%` }" />
    </div>
  </AppCard>
</template>
