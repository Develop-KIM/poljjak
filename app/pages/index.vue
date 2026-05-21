<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  ArrowRight,
  Sparkles,
  MessageSquare,
  Users,
  Zap,
  Link,
  Share2,
  CheckCircle2,
  Loader2,
  Lock,
  ChevronDown,
  FileUp,
  Download,
} from '@lucide/vue'

const demoStep = ref(0)
const analysisStep = ref(0)
const showScores = ref(false)
let demoTimer: ReturnType<typeof setTimeout> | null = null
let analysisStepTimer: ReturnType<typeof setInterval> | null = null

const steps = [
  { label: 'PDF 업로드 중', sublabel: '파일을 서버로 전송하고 있어요' },
  { label: '텍스트 추출 중', sublabel: 'PDF에서 내용을 읽고 있어요' },
  { label: 'AI 분석 중', sublabel: 'AI가 포트폴리오를 꼼꼼히 보고 있어요' },
]

function schedulNext() {
  const durations = [4000, 5000, 7000]
  demoTimer = setTimeout(() => {
    showScores.value = false
    analysisStep.value = 0
    if (analysisStepTimer) clearInterval(analysisStepTimer)
    demoStep.value = (demoStep.value + 1) % 3
    if (demoStep.value === 1) {
      analysisStepTimer = setInterval(() => {
        if (analysisStep.value < steps.length - 1) analysisStep.value++
      }, 1500)
    }
    schedulNext()
  }, durations[demoStep.value])
}

onMounted(() => {
  schedulNext()
})
onUnmounted(() => {
  if (demoTimer) clearTimeout(demoTimer)
  if (analysisStepTimer) clearInterval(analysisStepTimer)
})
</script>

<template>
  <div>
    <!-- ─── 히어로 ─────────────────────────────────────────── -->
    <section class="border-b border-border px-5 py-24 text-center md:py-36 md:px-8">
      <div class="mx-auto max-w-3xl">
        <AppBadge variant="blue">AI 포트폴리오 분석 서비스</AppBadge>

        <h1
          class="mt-6 text-4xl font-black leading-[1.15] tracking-tight text-foreground md:text-5xl lg:text-6xl"
        >
          PDF 하나로<br />
          포트폴리오의 약점을<br class="hidden sm:block" />
          정확히 파악하세요.
        </h1>

        <p class="mx-auto mt-6 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
          AI가 10가지 항목을 점수와 코멘트로 분석하고,<br class="hidden sm:block" />
          구체적인 Before/After 개선안까지 제시해드려요.
        </p>

        <div
          class="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center"
        >
          <NuxtLink to="/analyze" class="sm:w-auto">
            <AppButton size="lg" class="w-full">
              무료로 분석 시작하기
              <ArrowRight class="size-4" />
            </AppButton>
          </NuxtLink>
          <NuxtLink to="/community" class="sm:w-auto">
            <AppButton variant="outline" size="lg" class="w-full">커뮤니티 둘러보기</AppButton>
          </NuxtLink>
        </div>

        <p class="mt-4 text-sm text-muted-foreground">AI 심층 분석 · PDF 다운 · 링크로 바로 공유</p>
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
            <p class="text-xl font-black text-foreground md:text-2xl">Before→After</p>
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
            :class="
              demoStep === i ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground'
            "
            @click="demoStep = i"
          >
            {{ label }}
          </button>
        </div>

        <!-- 데모 화면 -->
        <div
          class="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
        >
          <!-- 브라우저 크롬 -->
          <div class="flex items-center gap-2 border-b border-border bg-slate-50 px-4 py-3">
            <div class="flex gap-1.5">
              <div class="size-3 rounded-full bg-red-400" />
              <div class="size-3 rounded-full bg-amber-400" />
              <div class="size-3 rounded-full bg-emerald-400" />
            </div>
            <div
              class="mx-auto flex h-6 w-56 items-center rounded-md bg-white px-3 text-xs text-muted-foreground ring-1 ring-border"
            >
              {{
                demoStep === 2 ? 'poljjak.vercel.app/analysis/...' : 'poljjak.vercel.app/analyze'
              }}
            </div>
          </div>

          <!-- 스텝 0: 업로드 (실제 analyze.vue 재현) -->
          <Transition name="demo">
            <div v-if="demoStep === 0" class="p-6 md:p-8">
              <AppBadge variant="blue">포트폴리오 분석</AppBadge>
              <h3 class="mt-3 text-xl font-black leading-tight text-foreground">
                PDF를 올리고 AI 피드백을 받아보세요
              </h3>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                추가 요청사항을 적으면 원하는 방향에 맞춰 더 구체적인 피드백을 받을 수 있어요.
              </p>
              <div class="mt-5 grid gap-4 lg:grid-cols-[1fr_200px]">
                <!-- 왼쪽: 업로드 카드 -->
                <div class="rounded-xl border border-border bg-card p-5">
                  <!-- PDF 드롭존 (실제 PdfUploadDropzone 빈 상태 재현) -->
                  <div
                    class="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-accent/50 px-6 py-7 text-center"
                  >
                    <span
                      class="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-white text-primary ring-1 ring-blue-100"
                    >
                      <FileUp class="size-6" />
                    </span>
                    <span class="text-sm font-bold text-foreground"
                      >PDF 포트폴리오를 올려주세요</span
                    >
                    <span class="mt-1 text-xs text-muted-foreground"
                      >파일을 끌어오거나 클릭해서 선택 · 최대 5개</span
                    >
                    <div class="mt-2.5 flex flex-wrap justify-center gap-1.5">
                      <AppBadge variant="blue">PDF 전용</AppBadge>
                      <AppBadge variant="gray">파일당 10MB 이하</AppBadge>
                    </div>
                  </div>
                  <!-- 추가 요청사항 -->
                  <div class="mt-4">
                    <p class="text-sm font-bold text-foreground">
                      추가 요청사항 <span class="font-normal text-muted-foreground">(선택)</span>
                    </p>
                    <div
                      class="mt-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                    >
                      프로젝트 설명이 설득력 있는지 봐주세요.
                    </div>
                  </div>
                  <div class="mt-4 flex justify-end">
                    <div
                      class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                    >
                      분석 시작 <ArrowRight class="size-3.5" />
                    </div>
                  </div>
                </div>
                <!-- 오른쪽: 체크리스트 -->
                <div class="grid content-start gap-3">
                  <div class="rounded-xl border border-border bg-card p-4">
                    <p class="text-sm font-black text-foreground">업로드 전 확인</p>
                    <ul class="mt-3 grid gap-2">
                      <li
                        v-for="item in ['PDF 파일만 가능', '10MB 이하', '텍스트 선택 가능한 PDF']"
                        :key="item"
                        class="flex items-center gap-2 text-xs font-semibold text-foreground"
                      >
                        <CheckCircle2 class="size-4 shrink-0 text-emerald-500" />{{ item }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <!-- 스텝 1: 분석 중 (실제 analyze.vue analyzing 화면 재현) -->
          <Transition name="demo">
            <div
              v-if="demoStep === 1"
              class="flex flex-col items-center justify-center px-6 py-14 text-center"
            >
              <p class="text-sm text-muted-foreground">portfolio_2026.pdf</p>
              <div class="relative mt-8">
                <div
                  class="size-20 animate-spin rounded-full border-4 border-border border-t-primary"
                />
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-xs font-bold text-primary">AI</span>
                </div>
              </div>
              <div class="mt-8 w-full max-w-xs">
                <div
                  v-for="(step, i) in steps"
                  :key="step.label"
                  class="flex items-start gap-3 py-3"
                  :class="i < steps.length - 1 ? 'border-b border-border' : ''"
                >
                  <div class="mt-0.5 shrink-0">
                    <CheckCircle2 v-if="i < analysisStep" class="size-5 text-emerald-500" />
                    <Loader2
                      v-else-if="i === analysisStep"
                      class="size-5 animate-spin text-primary"
                    />
                    <div v-else class="size-5 rounded-full border-2 border-border" />
                  </div>
                  <div class="text-left">
                    <p
                      class="text-sm font-bold"
                      :class="i <= analysisStep ? 'text-foreground' : 'text-muted-foreground'"
                    >
                      {{ step.label }}
                    </p>
                    <p v-if="i === analysisStep" class="mt-0.5 text-xs text-muted-foreground">
                      {{ step.sublabel }}
                    </p>
                  </div>
                </div>
              </div>
              <p class="mt-6 text-sm text-muted-foreground">보통 30초~1분 정도 소요돼요</p>
            </div>
          </Transition>

          <!-- 스텝 2: 결과 (실제 analysis/[id].vue 재현) -->
          <Transition name="demo">
            <div v-if="demoStep === 2" class="p-6 md:p-8">
              <!-- 헤더 -->
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <AppBadge variant="green">분석 완료</AppBadge>
                  <h3 class="mt-3 text-xl font-black leading-tight text-foreground">
                    포트폴리오 분석 결과
                  </h3>
                  <p class="mt-1 text-sm text-muted-foreground">2026년 5월 21일</p>
                </div>
                <div class="flex shrink-0 flex-wrap gap-2">
                  <div
                    class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    <Download class="size-3.5" /> PDF 저장
                  </div>
                  <div
                    class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    <Link class="size-3.5" /> 링크 복사
                  </div>
                  <div
                    class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    <Lock class="size-3.5" /> 비공개
                  </div>
                  <div
                    class="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <MessageSquare class="size-3.5" /> 커뮤니티에 공유
                  </div>
                </div>
              </div>

              <!-- 종합 피드백 -->
              <div class="mt-5 rounded-xl border border-border bg-card p-5">
                <h4 class="text-base font-black text-foreground">종합 피드백</h4>
                <p class="mt-2.5 text-sm leading-7 text-muted-foreground">
                  프로젝트 설명의 구체성은 양호하나 성과 수치 표현이 부족합니다. "개선했다" 대신
                  "응답 속도를 40% 단축했다"처럼 수치를 넣으면 설득력이 크게 높아져요.
                </p>
              </div>

              <!-- 개선 포인트 -->
              <div class="mt-5">
                <h4 class="text-base font-black text-foreground">
                  개선 포인트
                  <span class="ml-1 text-sm font-semibold text-muted-foreground">3개</span>
                </h4>
                <p class="mt-1 text-sm text-muted-foreground">
                  아래 개선안을 포트폴리오에 바로 적용해보세요.
                </p>
                <div class="mt-3 overflow-hidden rounded-xl border border-border bg-card">
                  <div class="border-b border-border bg-accent/40 px-4 py-2.5">
                    <div class="flex items-center gap-2">
                      <span
                        class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
                        >성과 표현</span
                      >
                      <p class="text-xs text-muted-foreground">프로젝트 성과 수치화</p>
                    </div>
                  </div>
                  <div class="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
                    <div class="p-4">
                      <span
                        class="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500"
                        >Before</span
                      >
                      <p
                        class="mt-2.5 text-sm leading-6 text-muted-foreground line-through decoration-slate-300"
                      >
                        "성능을 크게 개선했습니다."
                      </p>
                    </div>
                    <div class="bg-primary/[0.03] p-4">
                      <span class="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary"
                        >After</span
                      >
                      <p class="mt-2.5 text-sm font-semibold leading-6 text-foreground">
                        "쿼리 최적화로 응답 속도를 40% 단축했습니다."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 항목별 점수 -->
              <div class="mt-4">
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-bold text-foreground hover:bg-slate-50"
                  @click="showScores = !showScores"
                >
                  항목별 점수 보기
                  <ChevronDown
                    class="size-4 text-muted-foreground transition-transform"
                    :class="{ 'rotate-180': showScores }"
                  />
                </button>
                <Transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="opacity-0 -translate-y-2"
                  enter-to-class="opacity-100 translate-y-0"
                >
                  <div v-if="showScores" class="mt-3 grid gap-2 md:grid-cols-3">
                    <div
                      v-for="s in [
                        { title: '프로젝트 설명', score: 70 },
                        { title: '성과 표현', score: 60 },
                        { title: '구조와 흐름', score: 80 },
                      ]"
                      :key="s.title"
                      class="rounded-xl border border-border bg-card p-3"
                    >
                      <div class="flex justify-between text-xs">
                        <span class="font-semibold text-foreground">{{ s.title }}</span>
                        <span class="font-bold text-primary">{{ s.score }}</span>
                      </div>
                      <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div class="h-full rounded-full bg-primary" :style="`width:${s.score}%`" />
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
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
              구성, 임팩트, 기술 스택 등 10가지 항목을 점수와 이유와 함께 알려드려요. 무엇이
              부족한지 바로 파악할 수 있어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-white p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <MessageSquare class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">Before/After 개선안</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              막막했던 문장을 구체적으로 어떻게 고칠지 바로 보여드려요. 수정 방향을 고민할 필요
              없어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-white p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Users class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">커뮤니티로 연결</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              AI 피드백에서 그치지 않아요. 분석 결과를 커뮤니티에 공유해 실무자·취준생 피드백까지
              받을 수 있어요.
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
          준비된 포트폴리오가<br />합격을 만듭니다.
        </h2>
        <p class="mt-4 text-white/70">AI 심층 분석 · PDF 다운 · 링크로 바로 공유</p>
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
.demo-enter-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.demo-leave-active {
  transition: opacity 0.25s ease;
  position: absolute;
  width: 100%;
}
.demo-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.demo-leave-to {
  opacity: 0;
}
</style>
