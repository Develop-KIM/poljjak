<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: '신고 관리 · 폴짝 관리자' })

interface ReportItem {
  id: string
  targetType: 'post' | 'comment'
  targetId: string
  targetPreview: string
  reason: string
  reporterNickname: string
  status: 'pending' | 'resolved'
  createdAt: string
  resolvedAt: string | null
}

const toast = useToastStore()
const PAGE_SIZE = 20

type ReportStatusTab = 'pending' | 'resolved'
const activeTab = ref<ReportStatusTab>('pending')
const page = ref(1)
const items = ref<ReportItem[]>([])
const total = ref(0)
const pending = ref(false)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

const resolvingIds = ref<Set<string>>(new Set())

async function fetchReports() {
  pending.value = true
  try {
    const res = await $fetch<{ data: { items: ReportItem[]; total: number } }>(
      '/api/admin/reports',
      { query: { status: activeTab.value, page: page.value } }
    )
    items.value = res.data.items
    total.value = res.data.total
  } catch {
    toast.error('신고 목록을 불러오지 못했어요')
  } finally {
    pending.value = false
  }
}

function changeTab(tab: ReportStatusTab) {
  activeTab.value = tab
  page.value = 1
  fetchReports()
}

function goPage(p: number) {
  page.value = p
  fetchReports()
}

async function resolveReport(id: string, deleteContent: boolean) {
  if (resolvingIds.value.has(id)) return
  resolvingIds.value = new Set([...resolvingIds.value, id])
  try {
    await $fetch(`/api/admin/reports/${id}/resolve`, {
      method: 'POST',
      body: { deleteContent },
    })
    toast.success(deleteContent ? '콘텐츠 삭제 후 처리 완료했어요' : '신고를 처리 완료했어요')
    const idx = items.value.findIndex((r) => r.id === id)
    if (idx !== -1) {
      items.value.splice(idx, 1)
      total.value = Math.max(0, total.value - 1)
    }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '신고 처리에 실패했어요')
  } finally {
    const next = new Set(resolvingIds.value)
    next.delete(id)
    resolvingIds.value = next
  }
}

onMounted(fetchReports)
</script>

<template>
  <div>
    <!-- 페이지 헤더 -->
    <div class="mb-6">
      <h1 class="text-2xl font-black text-foreground">신고 관리</h1>
      <p class="mt-1 text-sm text-muted-foreground">신고된 게시글·댓글을 검토하고 처리해요</p>
    </div>

    <!-- 탭 필터 -->
    <div class="mb-5 flex gap-1 rounded-xl border border-border bg-muted/50 p-1 w-fit">
      <button
        v-for="tab in [
          { label: '미처리', value: 'pending' },
          { label: '처리됨', value: 'resolved' },
        ]"
        :key="tab.value"
        type="button"
        class="rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
        :class="
          activeTab === tab.value
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="changeTab(tab.value as ReportStatusTab)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="pending" class="flex justify-center py-20">
      <div class="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
    </div>

    <!-- 빈 상태 -->
    <div
      v-else-if="items.length === 0"
      class="rounded-xl border border-border bg-background py-16 text-center text-sm text-muted-foreground"
    >
      {{ activeTab === 'pending' ? '처리할 신고가 없어요' : '처리된 신고가 없어요' }}
    </div>

    <!-- 신고 목록 -->
    <template v-else>
      <!-- 테이블 (xl+) -->
      <div class="hidden xl:block overflow-x-auto rounded-xl border border-border">
        <table class="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr class="bg-muted">
              <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">대상</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-64">
                미리보기
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                신고 사유
              </th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                신고자
              </th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                신고일
              </th>
              <th
                v-if="activeTab === 'pending'"
                class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground"
              >
                처리
              </th>
              <th v-else class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                처리일
              </th>
            </tr>
          </thead>
          <tbody class="bg-background">
            <tr
              v-for="item in items"
              :key="item.id"
              class="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
            >
              <td class="px-4 py-3">
                <NuxtLink
                  :to="`/community/${item.targetId}`"
                  target="_blank"
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-70"
                  :class="
                    item.targetType === 'post'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                  "
                >
                  {{ item.targetType === 'post' ? '게시글' : '댓글' }}
                  <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </NuxtLink>
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                <p class="line-clamp-2 text-xs">{{ item.targetPreview }}</p>
              </td>
              <td class="px-4 py-3 text-foreground text-xs">{{ item.reason }}</td>
              <td class="px-4 py-3 text-center text-muted-foreground text-xs">
                {{ item.reporterNickname }}
              </td>
              <td class="px-4 py-3 text-center text-muted-foreground text-xs whitespace-nowrap">
                {{ item.createdAt }}
              </td>
              <td v-if="activeTab === 'pending'" class="px-4 py-3">
                <div class="flex items-center justify-center gap-1.5">
                  <AppButton
                    variant="outline"
                    size="sm"
                    :loading="resolvingIds.has(item.id)"
                    @click="resolveReport(item.id, false)"
                    >처리됨</AppButton
                  >
                  <AppButton
                    variant="destructive"
                    size="sm"
                    :loading="resolvingIds.has(item.id)"
                    @click="resolveReport(item.id, true)"
                    >삭제+처리</AppButton
                  >
                </div>
              </td>
              <td
                v-else
                class="px-4 py-3 text-center text-muted-foreground text-xs whitespace-nowrap"
              >
                {{ item.resolvedAt ?? '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 카드 (xl 미만) -->
      <div class="grid gap-3 xl:hidden">
        <div
          v-for="item in items"
          :key="item.id"
          class="rounded-xl border border-border bg-card p-4"
        >
          <div class="flex items-start justify-between gap-2">
            <NuxtLink
              :to="`/community/${item.targetId}`"
              target="_blank"
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-70"
              :class="
                item.targetType === 'post'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-purple-50 text-purple-700'
              "
            >
              {{ item.targetType === 'post' ? '게시글' : '댓글' }}
              <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </NuxtLink>
            <span class="shrink-0 text-xs text-muted-foreground">{{ item.createdAt }}</span>
          </div>
          <p class="mt-3 line-clamp-3 text-xs text-muted-foreground">{{ item.targetPreview }}</p>
          <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div>
              <span class="text-muted-foreground">신고 사유</span>
              <span class="ml-1.5 font-medium text-foreground">{{ item.reason }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">신고자</span>
              <span class="ml-1.5 font-medium text-foreground">{{ item.reporterNickname }}</span>
            </div>
            <div v-if="activeTab === 'resolved'" class="col-span-2">
              <span class="text-muted-foreground">처리일</span>
              <span class="ml-1.5 font-medium text-foreground">{{ item.resolvedAt ?? '-' }}</span>
            </div>
          </div>
          <div v-if="activeTab === 'pending'" class="mt-3 flex gap-2">
            <AppButton
              variant="outline"
              size="sm"
              class="flex-1"
              :loading="resolvingIds.has(item.id)"
              @click="resolveReport(item.id, false)"
              >처리됨</AppButton
            >
            <AppButton
              variant="destructive"
              size="sm"
              class="flex-1"
              :loading="resolvingIds.has(item.id)"
              @click="resolveReport(item.id, true)"
              >삭제+처리</AppButton
            >
          </div>
        </div>
      </div>
    </template>

    <!-- 결과 요약 -->
    <p v-if="!pending && total > 0" class="mt-3 text-xs text-muted-foreground">
      전체 <span class="font-semibold text-foreground">{{ total }}</span
      >건
    </p>

    <!-- 페이지네이션 -->
    <Pagination
      v-if="!pending && totalPages > 1"
      :current="page"
      :total="totalPages"
      class="mt-6"
      @change="goPage"
    />
  </div>
</template>
