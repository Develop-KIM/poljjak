<template>
  <header class="border-b bg-white dark:bg-dark">
    <nav class="container mx-auto px-4 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="text-2xl font-bold text-primary no-underline">폴짝</NuxtLink>

      <div class="flex items-center gap-6">
        <NuxtLink
          to="/community"
          class="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors font-medium no-underline"
        >
          커뮤니티
        </NuxtLink>
        <ClientOnly>
          <button
            @click="toggleDark"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="테마 전환"
          >
            <SunIcon v-if="!isDark" class="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <MoonIcon v-else class="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </ClientOnly>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const toggleDark = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
