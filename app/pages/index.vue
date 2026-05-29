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
  ChevronRight,
  FileUp,
} from '@lucide/vue'

useHead({ titleTemplate: '%s' })
useSeoMeta({
  title: '폴짝 - AI 포트폴리오 분석 서비스',
  description:
    'PDF 하나로 포트폴리오의 약점을 파악하세요. AI가 이슈를 우선순위별로 분석하고 Before/After 개선안을 제시해드려요.',
  ogTitle: '폴짝 - AI 포트폴리오 분석 서비스',
  ogDescription:
    'PDF 하나로 포트폴리오의 약점을 파악하세요. AI가 이슈를 우선순위별로 분석하고 Before/After 개선안을 제시해드려요.',
  ogUrl: 'https://poljjak.kr',
  twitterTitle: '폴짝 - AI 포트폴리오 분석 서비스',
  twitterDescription: 'PDF 하나로 포트폴리오의 약점을 파악하세요.',
})
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: '폴짝',
        url: 'https://poljjak.kr',
        description: 'AI가 포트폴리오를 분석하고 개선해주는 서비스',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
        inLanguage: 'ko',
      }),
    },
  ],
})

const demoStep = ref(0)
const analysisStep = ref(0)
let demoTimer: ReturnType<typeof setTimeout> | null = null
let analysisStepTimer: ReturnType<typeof setInterval> | null = null

const demoIssues = [
  {
    priority: 'high',
    section: '프로젝트',
    title: '성과 수치 미기재',
    desc: '구체적인 수치 없이 막연한 표현만 있어 설득력이 낮아요.',
    before: '"API 성능을 크게 개선했습니다."',
    after: '"N+1 쿼리를 제거해 응답 속도를 [실제 수치] 단축했습니다."',
  },
  {
    priority: 'medium',
    section: '기술스택',
    title: '선택 근거 부재',
    desc: '사용한 기술을 나열만 했고 왜 그 기술을 골랐는지 이유가 없어요.',
    before: '"기술 스택: React, TypeScript, PostgreSQL"',
    after:
      '"실시간 상태 동기화가 필요해 React Query를 도입했고, 타입 안정성을 위해 TypeScript를 적용했습니다."',
  },
  {
    priority: 'low',
    section: '자기소개',
    title: '분량 과다',
    desc: '자기소개가 너무 길어 핵심 메시지가 희석되고 있어요.',
    before: '"저는 항상 노력하는 개발자로서..."',
    after: '"문제를 발견하면 끝까지 파고드는 백엔드 개발자입니다."',
  },
]

const steps = [
  { label: 'PDF 업로드 중', sublabel: '파일을 서버로 전송하고 있어요' },
  { label: '텍스트 추출 중', sublabel: 'PDF에서 내용을 읽고 있어요' },
  { label: 'AI 분석 중', sublabel: 'AI가 포트폴리오를 꼼꼼히 보고 있어요' },
]

function schedulNext() {
  const durations = [4000, 5000, 7000]
  demoTimer = setTimeout(() => {
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
          AI가 이슈를 우선순위별로 짚어주고,<br class="hidden sm:block" />
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
      <div class="mx-auto max-w-[1440px]">
        <div class="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
          <div class="px-8 py-6 text-center">
            <p class="text-2xl font-black text-foreground">총점 100</p>
            <p class="mt-1 text-sm text-muted-foreground">AI 종합 점수</p>
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
      <div class="mx-auto max-w-[1440px]">
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
          class="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        >
          <!-- 브라우저 크롬 -->
          <div class="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3">
            <div class="flex gap-1.5">
              <div class="size-3 rounded-full bg-red-400" />
              <div class="size-3 rounded-full bg-amber-400" />
              <div class="size-3 rounded-full bg-emerald-400" />
            </div>
            <div
              class="mx-auto flex h-6 w-56 items-center rounded-md bg-background px-3 text-xs text-muted-foreground ring-1 ring-border"
            >
              {{ demoStep === 2 ? 'poljjak.kr/analysis/...' : 'poljjak.kr/analyze' }}
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
                      class="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-background text-primary ring-1 ring-border"
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
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      class="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground"
                      >풀스택</span
                    >
                    <span
                      class="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground"
                      >주니어</span
                    >
                  </div>
                  <h3 class="mt-2 text-lg font-black leading-tight text-foreground">
                    포트폴리오 분석 결과
                  </h3>
                  <p class="mt-0.5 text-sm text-muted-foreground">2026년 5월 21일</p>
                </div>
                <div class="flex shrink-0 flex-wrap gap-2">
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
                    <MessageSquare class="size-3.5" /> 커뮤니티 공유
                  </div>
                </div>
              </div>

              <!-- AI 총평 -->
              <div class="mt-4 rounded-xl border border-border bg-card p-4">
                <h4 class="text-sm font-bold text-foreground">AI 총평</h4>
                <p class="mt-2 text-sm leading-6 text-muted-foreground">
                  프로젝트 구현 경험은 충분하나 성과 표현이 막연하고 기술 선택 근거가 부족합니다.
                  수치와 맥락을 보완하면 설득력이 크게 높아질 수 있어요.
                </p>
              </div>

              <!-- 이슈 목록 -->
              <div class="mt-4">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-black text-foreground">
                    이슈 목록
                    <span class="font-semibold text-muted-foreground">(3개)</span>
                  </h4>
                  <div class="flex gap-1">
                    <span
                      class="rounded-full border border-primary bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-white"
                      >전체</span
                    >
                    <span
                      class="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
                      >높음</span
                    >
                    <span
                      class="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
                      >중간</span
                    >
                  </div>
                </div>

                <div class="mt-3 grid gap-2">
                  <div
                    v-for="issue in demoIssues"
                    :key="issue.title"
                    class="rounded-xl border border-border bg-card p-3"
                  >
                    <div class="flex items-start gap-2.5">
                      <span
                        class="mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                        :class="{
                          'border-red-200 bg-red-50 text-red-600': issue.priority === 'high',
                          'border-amber-200 bg-amber-50 text-amber-600':
                            issue.priority === 'medium',
                          'border-border bg-muted text-muted-foreground': issue.priority === 'low',
                        }"
                        >{{
                          issue.priority === 'high'
                            ? '높음'
                            : issue.priority === 'medium'
                              ? '중간'
                              : '낮음'
                        }}</span
                      >
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5">
                          <span class="text-[11px] font-semibold text-muted-foreground">{{
                            issue.section
                          }}</span>
                          <ChevronRight class="size-3 text-muted-foreground/40" />
                          <span class="text-xs font-bold text-foreground">{{ issue.title }}</span>
                        </div>
                        <p class="mt-1 text-xs text-muted-foreground">{{ issue.desc }}</p>
                        <div class="mt-2 grid gap-1.5 rounded-lg bg-muted/50 p-2.5 text-xs">
                          <div>
                            <span class="font-semibold text-muted-foreground">Before</span>
                            <p class="mt-0.5 italic text-foreground/60">{{ issue.before }}</p>
                          </div>
                          <div>
                            <span class="font-semibold text-primary">After</span>
                            <p class="mt-0.5 text-foreground">{{ issue.after }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <!-- ─── 왜 폴짝인가요? ─────────────────────────────────── -->
    <section class="border-b border-border bg-muted/40 px-5 py-20 md:px-8">
      <div class="mx-auto max-w-[1440px]">
        <div class="text-center">
          <AppBadge variant="gray">왜 폴짝인가요?</AppBadge>
          <h2 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
            포트폴리오 개선에<br />필요한 것만 담았어요.
          </h2>
        </div>

        <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="rounded-xl border border-border bg-card p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Sparkles class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">우선순위별 이슈 분석</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              구성, 성과 표현, 기술 스택 등 발견된 이슈를 높음·중간·낮음으로 분류해 알려드려요.
              무엇부터 고쳐야 할지 바로 파악할 수 있어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-card p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <MessageSquare class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">Before/After 개선안</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              막막했던 문장을 구체적으로 어떻게 고칠지 바로 보여드려요. 수정 방향을 고민할 필요
              없어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-card p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Users class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">커뮤니티로 연결</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              AI 피드백에서 그치지 않아요. 분석 결과를 커뮤니티에 공유해 실무자·취준생 피드백까지
              받을 수 있어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-card p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Zap class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">1분 이내 완료</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              업로드 후 보통 30초~1분 안에 전체 분석 결과를 받아볼 수 있어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-card p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Link class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">결과 저장 · 공유</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              분석 결과를 저장해두고 공유 링크를 만들어 멘토, 지인에게 바로 보여줄 수 있어요.
            </p>
          </div>
          <div class="rounded-xl border border-border bg-card p-6">
            <div
              class="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50"
            >
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
              class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-foreground px-6 text-base font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
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
