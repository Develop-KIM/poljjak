<template>
  <footer class="border-t py-6 bg-white dark:bg-dark">
    <div
      class="container mx-auto px-4 flex flex-col-reverse md:flex-row justify-between items-center gap-4"
    >
      <div class="text-gray-600 dark:text-gray-400 text-sm md:text-base">
        © 2025 폴짝. All rights reserved.
      </div>

      <div class="flex gap-6 text-sm md:text-base">
        <NuxtLink
          to="/about"
          class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
        >
          소개
        </NuxtLink>
        <NuxtLink
          to="/feedback"
          class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
        >
          서비스 피드백
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>
