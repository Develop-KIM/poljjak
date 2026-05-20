<script setup lang="ts">
import {
  ArrowRight,
  Sparkles,
  MessageSquare,
  Users,
  FileUp,
  CheckCircle2,
  Zap,
  Link,
  Share2,
} from '@lucide/vue'
</script>

<template>
  <div>
    <!-- ─── 히어로 ─────────────────────────────────────────── -->
    <section class="border-b border-border px-5 py-24 text-center md:py-32 md:px-8">
      <div class="mx-auto max-w-3xl">
        <AppBadge variant="blue">AI 포트폴리오 분석 · 1회 무료 체험</AppBadge>

        <h1
          class="mt-6 text-4xl font-black leading-[1.15] tracking-tight text-foreground md:text-5xl lg:text-6xl"
        >
          포트폴리오를 올리면<br />
          AI가 면접관보다<br />
          먼저 봐줘요.
        </h1>

        <p class="mx-auto mt-6 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
          PDF를 올리면 10가지 핵심 항목을 점수와 코멘트로 분석하고,<br class="hidden sm:block" />
          개선할 문장을 바로 보여드려요.
        </p>

        <!-- 버튼: 모바일 full-width, 데스크탑 inline -->
        <div
          class="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center"
        >
          <NuxtLink to="/analyze" class="sm:w-auto">
            <AppButton size="lg" class="w-full">
              지금 분석 시작하기
              <ArrowRight class="size-4" />
            </AppButton>
          </NuxtLink>
          <NuxtLink to="/community" class="sm:w-auto">
            <AppButton variant="outline" size="lg" class="w-full"> 커뮤니티 둘러보기 </AppButton>
          </NuxtLink>
        </div>

        <p class="mt-4 text-sm text-muted-foreground">로그인 없이 1회 무료로 체험할 수 있어요</p>
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
            <p class="text-2xl font-black text-foreground">Before</p>
            <p class="mt-1 text-sm text-muted-foreground">→ After 개선안 제공</p>
          </div>
          <div class="px-8 py-6 text-center">
            <p class="text-2xl font-black text-foreground">무료</p>
            <p class="mt-1 text-sm text-muted-foreground">로그인 없이 시작</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── 이렇게 사용하세요 ──────────────────────────────── -->
    <section class="border-b border-border px-5 py-20 md:px-8">
      <div class="mx-auto max-w-[1120px]">
        <div class="text-center">
          <AppBadge variant="gray">사용 방법</AppBadge>
          <h2 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
            3단계로 끝나는<br />AI 포트폴리오 분석
          </h2>
          <p class="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            복잡한 준비 없이 PDF 하나만 올리면 돼요.
          </p>
        </div>

        <div class="mt-14 grid gap-6 md:grid-cols-3">
          <!-- STEP 01 -->
          <div class="flex flex-col gap-5">
            <div class="flex items-center gap-3">
              <span class="text-4xl font-black text-primary/20">01</span>
              <div>
                <p class="font-black text-foreground">PDF 업로드</p>
                <p class="mt-0.5 text-sm text-muted-foreground">
                  파일을 끌어다 놓거나 클릭해서 선택
                </p>
              </div>
            </div>
            <!-- 업로드 UI 목업 -->
            <div class="rounded-xl border-2 border-dashed border-blue-200 bg-accent/50 p-5">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-blue-100"
                >
                  <FileUp class="size-5 text-primary" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-foreground">portfolio_2026.pdf</p>
                  <p class="text-xs text-muted-foreground">2.4 MB · 28페이지</p>
                </div>
                <CheckCircle2 class="size-5 shrink-0 text-emerald-500" />
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <AppBadge variant="blue">PDF</AppBadge>
                <AppBadge variant="gray">2.4 MB</AppBadge>
                <AppBadge variant="green">준비 완료</AppBadge>
              </div>
            </div>
          </div>

          <!-- STEP 02 -->
          <div class="flex flex-col gap-5">
            <div class="flex items-center gap-3">
              <span class="text-4xl font-black text-primary/20">02</span>
              <div>
                <p class="font-black text-foreground">AI 분석</p>
                <p class="mt-0.5 text-sm text-muted-foreground">AI가 문서를 읽고 분석해요</p>
              </div>
            </div>
            <!-- 분석 진행 목업 -->
            <div class="rounded-xl border border-border bg-card p-5">
              <div class="flex items-center justify-between gap-1">
                <div class="flex flex-col items-center gap-1.5">
                  <CheckCircle2 class="size-5 text-emerald-500" />
                  <span class="text-[10px] text-muted-foreground">업로드</span>
                </div>
                <div class="h-px flex-1 bg-border" />
                <div class="flex flex-col items-center gap-1.5">
                  <CheckCircle2 class="size-5 text-emerald-500" />
                  <span class="text-[10px] text-muted-foreground">추출</span>
                </div>
                <div class="h-px flex-1 bg-border" />
                <div class="flex flex-col items-center gap-1.5">
                  <span class="flex size-5 items-center justify-center">
                    <span
                      class="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
                    />
                  </span>
                  <span class="text-[10px] font-semibold text-primary">AI 분석</span>
                </div>
                <div class="h-px flex-1 bg-border" />
                <div class="flex flex-col items-center gap-1.5">
                  <span class="size-5 rounded-full border-2 border-border" />
                  <span class="text-[10px] text-muted-foreground/50">결과</span>
                </div>
              </div>
              <div
                class="mt-4 rounded-lg bg-muted/50 px-3 py-2.5 text-xs leading-5 text-muted-foreground"
              >
                프로젝트 설명의 구체성과 성과 표현 방식을 분석 중입니다...
              </div>
            </div>
          </div>

          <!-- STEP 03 -->
          <div class="flex flex-col gap-5">
            <div class="flex items-center gap-3">
              <span class="text-4xl font-black text-primary/20">03</span>
              <div>
                <p class="font-black text-foreground">결과 확인</p>
                <p class="mt-0.5 text-sm text-muted-foreground">
                  점수, 코멘트, Before/After 개선안
                </p>
              </div>
            </div>
            <!-- 결과 목업 -->
            <div class="rounded-xl border border-border bg-card p-5">
              <div class="grid gap-3">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-foreground">프로젝트 설명</span>
                    <span class="text-sm font-bold text-primary">7/10</span>
                  </div>
                  <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full w-[70%] rounded-full bg-primary" />
                  </div>
                </div>
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-foreground">성과 표현</span>
                    <span class="text-sm font-bold text-primary">6/10</span>
                  </div>
                  <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full w-[60%] rounded-full bg-primary" />
                  </div>
                </div>
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-foreground">구조와 흐름</span>
                    <span class="text-sm font-bold text-emerald-500">8/10</span>
                  </div>
                  <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full w-[80%] rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
              <div class="mt-4">
                <AppBadge variant="green">분석 완료</AppBadge>
              </div>
            </div>
          </div>
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
              AI 피드백에서 그치지 않아요. 분석 결과를 커뮤니티에 공유해 실무자, 취준생 피드백까지
              받을 수 있어요.
            </p>
          </div>

          <div class="rounded-xl border border-border bg-white p-6">
            <div class="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Zap class="size-5 text-primary" />
            </div>
            <h3 class="mt-4 font-black text-foreground">1분 이내 완료</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              업로드 후 보통 30초~1분 안에 전체 분석 결과를 받아볼 수 있어요. 기다림이 짧아요.
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
              로그인 없이 1회 무료로 체험할 수 있어요. 부담 없이 지금 바로 올려보세요.
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
        <p class="mt-4 text-white/70">로그인 없이 1회 무료 · 결과는 저장 및 공유 가능</p>
        <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <NuxtLink to="/analyze" class="sm:w-auto">
            <button
              type="button"
              class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-6 text-base font-semibold text-primary transition-colors hover:bg-blue-50 active:bg-blue-100"
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
