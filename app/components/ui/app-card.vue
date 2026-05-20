<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean
  }>(),
  {
    padded: true,
  }
)
</script>

<template>
  <section
    class="rounded-lg border border-border bg-card text-card-foreground"
    :class="{ 'p-5 md:p-6': padded }"
  >
    <slot />
  </section>
</template>
