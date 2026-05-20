<template>
  <div>
    <header class="border-b">
      <div class="container mx-auto flex h-14 items-center px-4">
        <NuxtLink to="/" class="font-bold">폴짝</NuxtLink>
      </div>
    </header>
    <main class="container mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
