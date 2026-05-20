<script setup lang="ts">
defineProps<{
  before: string
  after: string
}>()
</script>

<template>
  <AppCard>
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <AppBadge variant="gray">Before</AppBadge>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">{{ before }}</p>
      </div>
      <div>
        <AppBadge variant="blue">After</AppBadge>
        <p class="mt-3 text-sm font-medium leading-6 text-foreground">{{ after }}</p>
      </div>
    </div>
  </AppCard>
</template>
