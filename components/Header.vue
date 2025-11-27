<template>
  <header class="border-b bg-white dark:bg-dark">
    <nav class="container mx-auto px-4 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="text-2xl font-bold text-primary no-underline"> 폴짝 </NuxtLink>

      <div class="flex items-center gap-4">
        <button
          @click="toggleDark"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-xl"
        >
          {{ isDark ? '🌙' : '☀️' }}
        </button>
      </div>
    </nav>
  </header>
</template>

<script setup>
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const toggleDark = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
