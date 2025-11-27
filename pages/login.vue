<template>
  <main class="flex-1 flex items-center justify-center bg-white dark:bg-dark px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-10">
        <p class="text-xl text-gray-600 dark:text-gray-300">간편하게 로그인하고 시작하세요</p>
      </div>

      <a
        href="/api/auth/kakao/login"
        class="flex items-center justify-center gap-3 w-full bg-[#FEE500] text-[#000000] py-4 rounded-xl text-lg font-semibold hover:bg-[#FEE500]/90 transition no-underline shadow-md hover:shadow-lg"
      >
        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 3C6.477 3 2 6.477 2 10.75c0 2.764 1.853 5.185 4.598 6.556-.196.722-.737 2.758-.847 3.187-.136.535.196.528.414.384.174-.115 2.857-1.94 3.31-2.247.514.073 1.04.11 1.525.11 5.523 0 10-3.477 10-7.75S17.523 3 12 3z"
          />
        </svg>
        카카오로 시작하기
      </a>

      <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-8 leading-relaxed">
        로그인하면
        <NuxtLink to="/terms" class="text-primary hover:underline">이용약관</NuxtLink> 및
        <NuxtLink to="/privacy" class="text-primary hover:underline">개인정보처리방침</NuxtLink
        >에<br />
        동의하는 것으로 간주됩니다.
      </p>
    </div>
  </main>
</template>
