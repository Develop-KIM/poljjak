<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
} from 'chart.js'
import { RotateCcw } from '@lucide/vue'

// chart.js 필수 컴포넌트 등록
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
)

// 어드민 레이아웃 + 미들웨어 적용
definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeoMeta({ title: '대시보드 · 폴짝 관리자' })

const toast = useToastStore()

// ─── 서비스·AI 현황 카드 ─────────────────────────────────────────────────

interface DashboardStats {
  todayUsers: number
  todayLogins: number
  todayPosts: number
  todayComments: number
  totalUsers: number
  totalPosts: number
  todayAnalyses: number
  todaySuccess: number
  todayFailed: number
  successRate: number
  avgResponseSec: number
  todayTokens: number
  totalTokens: number
}

const stats = ref<DashboardStats | null>(null)
const statsPending = ref(true)

async function fetchStats() {
  statsPending.value = true
  try {
    const res = await $fetch<{ data: DashboardStats }>('/api/admin/dashboard')
    stats.value = res.data
  } catch {
    toast.error('서비스 현황을 불러오지 못했어요')
  } finally {
    statsPending.value = false
  }
}

// ─── 차트 데이터 ─────────────────────────────────────────────────────────

interface HourlyRequest {
  hour: number
  count: number
}

interface DailyAvgResponse {
  date: string
  avgSec: number
}

interface ChartData {
  hourlyRequests: HourlyRequest[]
  dailyAvgResponseSec: DailyAvgResponse[]
}

const chartData = ref<ChartData | null>(null)
const chartPending = ref(true)

async function fetchCharts() {
  chartPending.value = true
  try {
    const res = await $fetch<{ data: ChartData }>('/api/admin/dashboard/charts')
    chartData.value = res.data
  } catch {
    toast.error('차트 데이터를 불러오지 못했어요')
  } finally {
    chartPending.value = false
  }
}

// 막대 차트 옵션 및 데이터 (시간대별 분석 요청)
const barChartData = computed(() => {
  const hourly = chartData.value?.hourlyRequests ?? []
  return {
    labels: Array.from({ length: 24 }, (_, h) => `${h}시`),
    datasets: [
      {
        label: '분석 요청 수',
        data: hourly.map((r) => r.count),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }
})

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: { parsed: { y: number } }) => `${ctx.parsed.y}건` } },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
  },
} as const

// 꺾은선 차트 옵션 및 데이터 (최근 7일 평균 응답시간)
const lineChartData = computed(() => {
  const daily = chartData.value?.dailyAvgResponseSec ?? []
  return {
    labels: daily.map((r) => r.date),
    datasets: [
      {
        label: '평균 응답시간(초)',
        data: daily.map((r) => r.avgSec),
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        tension: 0.3,
        fill: true,
      },
    ],
  }
})

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: { parsed: { y: number } }) => `${ctx.parsed.y}초` } },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true },
  },
} as const

// ─── 전체 새로고침 ────────────────────────────────────────────────────────

async function refresh() {
  await Promise.all([fetchStats(), fetchCharts()])
}

onMounted(refresh)

// 토큰 수 포맷 (1,000 단위 구분)
function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR')
}
</script>

<template>
  <div class="space-y-8">
    <!-- 페이지 헤더 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-black text-foreground">대시보드</h1>
        <p class="mt-0.5 text-sm text-muted-foreground">서비스 현황을 한눈에 확인하세요</p>
      </div>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        @click="refresh"
      >
        <RotateCcw class="size-4" />
        새로고침
      </button>
    </div>

    <!-- 서비스 현황 -->
    <section>
      <h2 class="text-base font-bold text-foreground mb-4">서비스 현황</h2>

      <!-- 로딩 스켈레톤 -->
      <div v-if="statsPending" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="i in 6"
          :key="i"
          class="rounded-xl border border-border bg-white p-5 animate-pulse"
        >
          <div class="h-3 w-16 rounded bg-muted mb-3" />
          <div class="h-7 w-12 rounded bg-muted" />
        </div>
      </div>

      <!-- 카드 6개 -->
      <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">오늘 신규 가입</p>
          <p class="mt-2 text-2xl font-black text-foreground">
            {{ formatNumber(stats?.todayUsers ?? 0) }}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">오늘 로그인</p>
          <p class="mt-2 text-2xl font-black text-foreground">
            {{ formatNumber(stats?.todayLogins ?? 0) }}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">오늘 게시글</p>
          <p class="mt-2 text-2xl font-black text-foreground">
            {{ formatNumber(stats?.todayPosts ?? 0) }}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">오늘 댓글</p>
          <p class="mt-2 text-2xl font-black text-foreground">
            {{ formatNumber(stats?.todayComments ?? 0) }}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">누적 사용자</p>
          <p class="mt-2 text-2xl font-black text-foreground">
            {{ formatNumber(stats?.totalUsers ?? 0) }}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">누적 게시글</p>
          <p class="mt-2 text-2xl font-black text-foreground">
            {{ formatNumber(stats?.totalPosts ?? 0) }}
          </p>
        </div>
      </div>
    </section>

    <!-- AI 현황 -->
    <section>
      <h2 class="text-base font-bold text-foreground mb-4">AI 현황</h2>

      <!-- 로딩 스켈레톤 -->
      <div v-if="statsPending" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="i in 6"
          :key="i"
          class="rounded-xl border border-border bg-white p-5 animate-pulse"
        >
          <div class="h-3 w-16 rounded bg-muted mb-3" />
          <div class="h-7 w-12 rounded bg-muted" />
        </div>
      </div>

      <!-- 카드 6개 (3열 그리드) -->
      <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">오늘 분석 요청</p>
          <p class="mt-2 text-2xl font-black text-foreground">
            {{ formatNumber(stats?.todayAnalyses ?? 0) }}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">성공</p>
          <p class="mt-2 text-2xl font-black text-green-600">
            {{ formatNumber(stats?.todaySuccess ?? 0) }}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">실패</p>
          <p class="mt-2 text-2xl font-black text-red-500">
            {{ formatNumber(stats?.todayFailed ?? 0) }}
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">성공률</p>
          <p class="mt-2 text-2xl font-black text-foreground">
            {{ stats?.successRate ?? 0 }}<span class="text-base font-semibold">%</span>
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="text-sm text-muted-foreground">평균 응답</p>
          <p class="mt-2 text-2xl font-black text-foreground">
            {{ stats?.avgResponseSec ?? 0 }}<span class="text-base font-semibold">초</span>
          </p>
        </div>
        <div class="rounded-xl border border-border bg-white p-5 col-span-2 sm:col-span-1">
          <p class="text-sm text-muted-foreground">오늘 토큰</p>
          <p class="mt-2 text-2xl font-black text-foreground">
            {{ formatNumber(stats?.todayTokens ?? 0) }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            누적 {{ formatNumber(stats?.totalTokens ?? 0) }}
          </p>
        </div>
      </div>
    </section>

    <!-- AI 모니터링 차트 -->
    <section>
      <h2 class="text-base font-bold text-foreground mb-4">AI 모니터링</h2>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- 시간대별 분석 요청 막대 차트 -->
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="mb-4 text-sm font-semibold text-foreground">오늘 시간대별 분석 요청</p>
          <div v-if="chartPending" class="flex h-56 items-center justify-center">
            <div class="size-7 animate-spin rounded-full border-4 border-border border-t-blue-500" />
          </div>
          <ClientOnly v-else>
            <div class="h-56">
              <Bar :data="barChartData" :options="barChartOptions" />
            </div>
          </ClientOnly>
        </div>

        <!-- 최근 7일 평균 응답시간 꺾은선 차트 -->
        <div class="rounded-xl border border-border bg-white p-5">
          <p class="mb-4 text-sm font-semibold text-foreground">최근 7일 평균 응답시간</p>
          <div v-if="chartPending" class="flex h-56 items-center justify-center">
            <div class="size-7 animate-spin rounded-full border-4 border-border border-t-violet-500" />
          </div>
          <ClientOnly v-else>
            <div class="h-56">
              <template v-if="(chartData?.dailyAvgResponseSec ?? []).length === 0">
                <div class="flex h-full items-center justify-center text-sm text-muted-foreground">
                  최근 7일간 완료된 분석이 없어요
                </div>
              </template>
              <Line v-else :data="lineChartData" :options="lineChartOptions" />
            </div>
          </ClientOnly>
        </div>
      </div>
    </section>

  </div>
</template>
