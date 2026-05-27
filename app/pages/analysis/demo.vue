<script setup lang="ts">
import { Link, Lock, MessageSquare } from '@lucide/vue'

useSeoMeta({
  title: '분석 결과 미리보기',
  description:
    '폴짝 AI 포트폴리오 분석 결과를 미리 체험해보세요. 항목별 점수와 Before/After 개선안을 확인할 수 있어요.',
  ogTitle: '분석 결과 미리보기 · 폴짝',
  ogDescription: '폴짝 AI 포트폴리오 분석이 어떻게 생겼는지 미리 확인해보세요.',
  ogUrl: 'https://poljjak.kr/analysis/demo',
})

const scores = [
  {
    title: '프로젝트 설명 명확성',
    score: 7,
    comment: '문제 정의와 결과는 보이지만 본인의 역할이 더 선명하면 좋아요.',
  },
  {
    title: '성과 표현',
    score: 6,
    comment: '정성적 표현보다 수치, 전후 비교, 사용자 영향이 필요해요.',
  },
  {
    title: '구조와 흐름',
    score: 8,
    comment: '읽는 순서는 자연스럽지만 핵심 프로젝트를 더 앞에 배치해도 좋아요.',
  },
]

const suggestions = [
  {
    before: '사용자 경험을 개선하기 위해 UI를 수정했습니다.',
    after:
      '가입 전환율을 높이기 위해 첫 진입 화면의 CTA와 폼 단계를 재설계했고, 이탈 구간을 줄였습니다.',
  },
  {
    before: 'React를 사용해서 프로젝트를 개발했습니다.',
    after:
      'React와 TypeScript로 상태 흐름을 정리하고, 반복 UI를 컴포넌트화해 유지보수 비용을 낮췄습니다.',
  },
]
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 py-10 md:px-8 md:py-14">
    <!-- 결과 헤더 -->
    <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <AppBadge variant="green">분석 완료</AppBadge>
        <h1 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
          포트폴리오 분석 결과
        </h1>
        <p class="mt-2 text-sm text-muted-foreground">2026년 5월 21일 생성 · 비공개</p>
      </div>
      <div class="flex shrink-0 flex-wrap gap-2">
        <AppButton variant="outline" size="sm">
          <Link class="size-4" />
          공유 링크 생성
        </AppButton>
        <AppButton variant="outline" size="sm">
          <Lock class="size-4" />
          비공개
        </AppButton>
        <AppButton size="sm">
          <MessageSquare class="size-4" />
          커뮤니티에 공유
        </AppButton>
      </div>
    </div>

    <!-- 항목별 점수 -->
    <section class="mt-8 grid gap-4 md:grid-cols-3">
      <AnalysisScoreCard
        v-for="score in scores"
        :key="score.title"
        :title="score.title"
        :score="score.score"
        :comment="score.comment"
      />
    </section>

    <!-- 종합 피드백 + Before/After -->
    <section class="mt-6 grid gap-4 lg:grid-cols-2">
      <AppCard>
        <h2 class="text-xl font-black text-foreground">종합 피드백</h2>
        <p class="mt-4 leading-7 text-muted-foreground">
          전체적으로 프로젝트 경험은 충분히 전달되지만, 채용 담당자가 빠르게 판단할 수 있는 성과와
          역할 설명이 부족합니다. 각 프로젝트마다 문제, 행동, 결과를 같은 순서로 정리하고 수치나
          비교 기준을 추가하면 설득력이 높아집니다.
        </p>
      </AppCard>

      <div class="grid gap-4">
        <BeforeAfterBlock
          v-for="suggestion in suggestions"
          :key="suggestion.before"
          :before="suggestion.before"
          :after="suggestion.after"
        />
      </div>
    </section>
  </div>
</template>
