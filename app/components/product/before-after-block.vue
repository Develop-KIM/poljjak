<script setup lang="ts">
defineProps<{
  category?: string
  context?: string
  before: string
  after: string
}>()
</script>

<template>
  <div class="rounded-xl border border-border bg-card overflow-hidden">
    <!-- 카테고리 + 맥락 -->
    <div v-if="category || context" class="border-b border-border bg-accent/40 px-5 py-3">
      <div class="flex flex-wrap items-center gap-2">
        <span
          v-if="category"
          class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
        >
          {{ category }}
        </span>
        <p v-if="context" class="text-xs text-muted-foreground">{{ context }}</p>
      </div>
    </div>

    <!-- Before / After -->
    <div class="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
      <!-- Before -->
      <div class="p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="rounded px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-500"
            >Before</span
          >
        </div>
        <p class="text-sm leading-7 text-muted-foreground line-through decoration-slate-300">
          {{ before }}
        </p>
      </div>

      <!-- After -->
      <div class="bg-primary/[0.03] p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="rounded px-2 py-0.5 text-xs font-bold bg-primary/10 text-primary"
            >After</span
          >
        </div>
        <p class="text-sm font-semibold leading-7 text-foreground">{{ after }}</p>
      </div>
    </div>
  </div>
</template>
