<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowRight, Sparkles, MessageSquare, Users, Zap, Link, Share2, FileText } from '@lucide/vue'

// 데모 애니메이션 상태: 0=업로드, 1=분석중, 2=결과
const demoStep = ref(0)
let demoTimer: ReturnType<typeof setInterval> | null = null
const resultVisible = ref(false)

const stepDurations = [2500, 3000, 4500]

function nextStep() {
  resultVisible.value = false
  demoStep.value = (demoStep.value + 1) % 3
  if (demoStep.value === 2) {
    setTimeout(() => { resultVisible.value = true }, 300)
  }
}

onMounted(() => {
  demoTimer = setInterval(nextStep, stepDurations[demoStep.value])
})

onUnmounted(() => {
  if (demoTimer) clearInterval(demoTimer)
})
</script>

<template>
  <div>
    <!-- ─── 히어로 ─────────────────────────────────────────── -->
    <section class="border-b border-border px-5 py-24 text-center md:py-36 md:px-8">
      <div class="mx-auto max-w-3xl">
        <AppBadge variant="blue">AI 포트폴리오 분석 서비스</AppBadge>

        <h1 class="mt-6 text-4xl font-black leading-[1.15] tracking-tight text-foreground md:text-5xl lg:text-6xl">
          포트폴리오를 올리면<br />
          AI가 면접관보다<br class="hidden sm:block" />
          먼저 봐줘요.
        </h1>

        <p class="mx-auto mt-6 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
          PDF 하나면 충분해요. 10가지 항목 분석 · Before/After 개선안 · 커뮤니티 피드백까지.
        </p>

        <div class="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <NuxtLink to="/analyze" class="sm:w-auto">
            <AppButton size="lg" class="w-full">
              지금 무료로 분석하기
              <ArrowRight class="size-4" />
            </AppButton>
          </NuxtLink>
          <NuxtLink to="/community" class="sm:w-auto">
            <AppButton variant="outline" size="lg" class="w-full">커뮤니티 둘러보기</AppButton>
          </NuxtLink>
        </div>

        <p class="mt-4 text-sm text-muted-foreground">로그인 후 무제한 분석 · 결과 저장 및 공유 가능</p>
      </div>
    </section>

    <!-- ─── 수치 스트립 ───────────────────────────────────── -->
    <section class="border-b border-border">
      <div class="mx-auto max-w-[1120px]">
        <div class="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
          <div class="px-8 py-6 text-center">
            <p class="text-2xl font-black text-foreground">10종</p>
            <p class="mt-1 text-sm text-muted-foreground">핵심 분석 항목</p>
          </div>
          <div class="px-8 py-6 text-center">
            <p class="text-2xl font-black text-foreground">1분</p>
            <p class="mt-1 text-sm text-muted-foreground">이내 분석 완료</p>
          </div>
          <div class="px-8 py-6 text-center">
            <p class="text-2xl font-black text-foreground">Before→After</p>
            <p class="mt-1 text-sm text-muted-foreground">즉시 개선안 제공</p>
          </div>
          <div class="px-8 py-6 text-center">
            <p class="text-2xl font-black text-foreground">무료</p>
            <p class="mt-1 text-sm text-muted-foreground">로그인 후 시작</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── 분석 과정 애니메이션 데모 ──────────────────────── -->
    <section class="border-b border-border px-5 py-20 md:px-8">
      <div class="mx-auto max-w-[1120px]">
        <div class="text-center">
          <AppBadge variant="gray">이렇게 작동해요</AppBadge>
          <h2 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
            PDF 업로드부터 결과까지<br />3단계로 끝나요
          </h2>
        </div>

        <!-- 스텝 탭 -->
        <div class="mt-10 flex justify-center gap-2">
          <button
            v-for="(label, i) in ['① PDF 업로드', '② AI 분석 중', '③ 결과 확인']"
            :key="i"
            type="button"
            class="rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300"
            :class="demoStep === i ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground'"
            @click="demoStep = i; if (i === 2) resultVisible = true"
          >
            {{ label }}
          </button>
        </div>

        <!-- 데모 화면 -->
        <div class="relative mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
          <!-- 브라우저 크롬 -->
          <div class="flex items-center gap-2 border-b border-border bg-slate-50 px-4 py-3">
            <div class="flex gap-1.5">
              <div class="size-3 rounded-full bg-red-400" />
              <div class="size-3 rounded-full bg-amber-400" />
              <div class="size-3 rounded-full bg-emerald-400" />
            </div>
            <div class="mx-auto flex h-6 w-64 items-center rounded-md bg-white px-3 text-xs text-muted-foreground ring-1 ring-border">
              poljjak.vercel.app/analyze
            </div>
          </div>

          <!-- 스텝 0: 업로드 -->
          <Transition name="fade">
            <div v-if="demoStep === 0" class="p-8">
              <h3 class="text-lg font-black text-foreground">포트폴리오 분석</h3>
              <p class="mt-1 text-sm text-muted-foreground">PDF를 업로드하면 AI가 즉시 분석해드려요.</p>
              <div class="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-accent/30 py-12 transition-all">
                <div class="animate-bounce">
                  <FileText class="size-10 text-primary/60" />
                </div>
                <p class="mt-3 text-sm font-semibold text-foreground">PDF를 여기에 끌어다 놓거나</p>
                <button type="button" class="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                  파일 선택하기
                </button>
                <p class="mt-3 text-xs text-muted-foreground">최대 10MB · PDF 형식만 지원</p>
              </div>
              <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                <div class="flex items-center gap-3">
                  <FileText class="size-5 shrink-0 text-emerald-600" />
                  <div class="flex-1 min-w-0">
                    <p class="truncate text-sm font-semibold text-foreground">portfolio_2026.pdf</p>
                    <p class="text-xs text-muted-foreground">2.4 MB · 28페이지</p>
                  </div>
                  <span class="text-xs font-semibold text-emerald-600">준비 완료</span>
                </div>
              </div>
            </div>
          </Transition>

          <!-- 스텝 1: 분석 중 -->
          <Transition name="fade">
            <div v-if="demoStep === 1" class="p-8">
              <div class="flex flex-col items-center py-6 text-center">
                <div class="relative flex size-16 items-center justify-center">
                  <div class="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <div class="size-12 animate-spin rounded-full border-4 border-border border-t-primary" />
                </div>
                <p class="mt-5 text-lg font-black text-foreground">AI가 분석하고 있어요</p>
                <p class="mt-2 text-sm text-muted-foreground">보통 30초~1분 정도 걸려요</p>
              </div>
              <div class="mt-2 grid gap-2">
                <div v-for="(item, i) in ['문서 텍스트 추출 완료', '직군별 프롬프트 적용 중', '10가지 항목 채점 중', '개선안 생성 중...']" :key="i"
                  class="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5 text-sm"
                  :class="i < 2 ? 'text-foreground' : 'text-muted-foreground'"
                >
                  <div v-if="i < 2" class="size-4 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                    <div class="size-2 rounded-full bg-emerald-500" />
                  </div>
                  <div v-else class="size-4 shrink-0 animate-pulse rounded-full bg-primary/20" />
                  {{ item }}
                </div>
              </div>
            </div>
          </Transition>

          <!-- 스텝 2: 결과 -->
          <Transition name="fade">
            <div v-if="demoStep === 2" class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <AppBadge variant="green">분석 완료</AppBadge>
                  <h3 class="mt-2 text-base font-black text-foreground">portfolio_2026.pdf</h3>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-black text-primary">74</p>
                  <p class="text-xs text-muted-foreground">종합 점수</p>
                </div>
              </div>

              <Transition name="slide-up">
                <div v-if="resultVisible" class="mt-4 grid gap-3">
                  <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">종합 피드백</p>
                    <p class="mt-1.5 text-sm leading-6 text-foreground">
                      프로젝트 설명이 구체적이나 성과 수치 표현이 부족합니다. "개선했다" 대신 "응답 속도를 40% 단축했다"처럼 수치를 넣으면 설득력이 높아져요.
                    </p>
                  </div>
                  <div class="grid gap-2 sm:grid-cols-3">
                    <div v-for="(score, i) in [{ label: '프로젝트 설명', val: 70, color: 'bg-primary' }, { label: '성과 표현', val: 60, color: 'bg-amber-400' }, { label: '구조와 흐름', val: 80, color: 'bg-emerald-500' }]" :key="i"
                      class="rounded-lg border border-border bg-white p-3">
                      <div class="flex justify-between">
                        <span class="text-xs font-semibold text-foreground">{{ score.label }}</span>
                        <span class="text-xs font-bold text-foreground">{{ score.val }}/100</span>
                      </div>
                      <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div class="h-full rounded-full transition-all duration-1000" :class="score.color" :style="`width: ${score.val}%`" />
                      </div>
                    </div>
                  </div>
                  <div class="rounded-xl border border-border bg-white p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Before → After</p>
                    <div class="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
                      <div class="rounded-lg bg-red-50 p-2.5 text-red-700">
                        "성능을 크게 개선했습니다."
                      </div>
                      <div class="rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
                        "쿼리 최적화로 응답 속도를 40% 단축했습니다."
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <!-- ─── 왜 폴짝인가요? ─────────────────────────────────── -->
    <section class="border-b border-border bg-slate-50/60 px-5 py-20 md:px-8">
      <div class="mx-auto max-w-[1120px]">
        <div class="text-center">
          <AppBadge variant="gray">왜 폴짝인가요?</AppBadge>
          <h2 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
            포트폴리오 개선에<br />필요한 것만 담았어요.
          </h2>
        </div>

        <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="rounded-xl border border-border bg-white p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Sparkles class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">항목별 AI 분석</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              구성, 임팩트, 기술 스택 등 10가지 항목을 점수와 이유와 함께 알려드려요. 무엇이 부족한지 바로 파악할 수 있어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-white p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <MessageSquare class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">Before/After 개선안</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              막막했던 문장을 구체적으로 어떻게 고칠지 바로 보여드려요. 수정 방향을 고민할 필요 없어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-white p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Users class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">커뮤니티로 연결</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              AI 피드백에서 그치지 않아요. 분석 결과를 커뮤니티에 공유해 실무자·취준생 피드백까지 받을 수 있어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-white p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Zap class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">1분 이내 완료</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              업로드 후 보통 30초~1분 안에 전체 분석 결과를 받아볼 수 있어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-white p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Link class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">결과 저장 · 공유</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              분석 결과를 저장해두고 공유 링크를 만들어 멘토, 지인에게 바로 보여줄 수 있어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-white p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
              <Share2 class="size-5 text-emerald-600" />
            </div>
            <h3 class="mt-4 font-black text-foreground">무료로 바로 시작</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              카카오 또는 구글 계정으로 로그인하면 바로 분석을 시작할 수 있어요.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── 하단 CTA ──────────────────────────────────────── -->
    <section class="bg-primary px-5 py-20 text-center md:px-8">
      <div class="mx-auto max-w-xl">
        <p class="text-sm font-semibold text-white/70">지금 바로 시작하세요</p>
        <h2 class="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">
          내 포트폴리오,<br />AI에게 먼저 물어보세요.
        </h2>
        <p class="mt-4 text-white/70">로그인 후 무제한 분석 · 결과는 저장 및 공유 가능</p>
        <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <NuxtLink to="/analyze" class="sm:w-auto">
            <button
              type="button"
              class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-6 text-base font-semibold text-primary transition-colors hover:bg-blue-50"
            >
              지금 분석 시작하기
              <ArrowRight class="size-4" />
            </button>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
  position: absolute;
  width: 100%;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.5s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
</style>
