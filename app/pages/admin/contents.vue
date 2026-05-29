<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@lucide/vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: '콘텐츠 관리 · 폴짝 관리자' })

interface ContentItem {
  id: string
  type: 'post' | 'comment'
  content: string
  authorNickname: string
  createdAt: string
  isDeleted: boolean
}

const toast = useToastStore()
const PAGE_SIZE = 10

// 하위 탭: 게시글 / 댓글
type ContentTab = 'post' | 'comment'
const activeTab = ref<ContentTab>('post')

const searchInput = ref('')
const appliedQuery = ref('')
const page = ref(1)
const items = ref<ContentItem[]>([])
const total = ref(0)
const pending = ref(false)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

const tabs: Array<{ label: string; value: ContentTab }> = [
  { label: '게시글', value: 'post' },
  { label: '댓글', value: 'comment' },
]

// 삭제 확인 대상
const confirmTarget = ref<{ type: 'post' | 'comment'; id: string } | null>(null)
const deletingIds = ref<Set<string>>(new Set())
const restoringIds = ref<Set<string>>(new Set())

async function fetchContents() {
  pending.value = true
  try {
    const query: Record<string, string | number> = { page: page.value }
    if (appliedQuery.value) query.q = appliedQuery.value
    query.type = activeTab.value

    const res = await $fetch<{ data: { items: ContentItem[]; total: number } }>(
      '/api/admin/contents',
      { query }
    )
    items.value = res.data.items
    total.value = res.data.total
  } catch {
    toast.error('콘텐츠 목록을 불러오지 못했어요')
  } finally {
    pending.value = false
  }
}

function changeTab(tab: ContentTab) {
  activeTab.value = tab
  page.value = 1
  fetchContents()
}

function submitSearch() {
  appliedQuery.value = searchInput.value.trim()
  page.value = 1
  fetchContents()
}

function goPage(p: number) {
  page.value = p
  fetchContents()
}

function requestDelete(type: 'post' | 'comment', id: string) {
  confirmTarget.value = { type, id }
}

function cancelDelete() {
  confirmTarget.value = null
}

async function restoreContent(type: 'post' | 'comment', id: string) {
  if (restoringIds.value.has(id)) return
  restoringIds.value = new Set([...restoringIds.value, id])
  try {
    await $fetch(`/api/admin/contents/${type}/${id}/restore`, { method: 'POST' })
    toast.success('콘텐츠를 복구했어요')
    const idx = items.value.findIndex((c) => c.id === id)
    if (idx !== -1) items.value[idx] = { ...items.value[idx]!, isDeleted: false }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '복구에 실패했어요')
  } finally {
    const next = new Set(restoringIds.value)
    next.delete(id)
    restoringIds.value = next
  }
}

async function executeDelete() {
  if (!confirmTarget.value) return
  const { type, id } = confirmTarget.value
  confirmTarget.value = null

  if (deletingIds.value.has(id)) return
  deletingIds.value = new Set([...deletingIds.value, id])

  try {
    await $fetch(`/api/admin/contents/${type}/${id}`, { method: 'DELETE' })
    toast.success('콘텐츠를 삭제했어요')
    const idx = items.value.findIndex((c) => c.id === id)
    if (idx !== -1) items.value[idx] = { ...items.value[idx]!, isDeleted: true }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '삭제에 실패했어요')
  } finally {
    const next = new Set(deletingIds.value)
    next.delete(id)
    deletingIds.value = next
  }
}

onMounted(fetchContents)
</script>

<template>
  <div>
    <!-- 페이지 헤더 -->
    <div class="mb-6">
      <h1 class="text-2xl font-black text-foreground">콘텐츠 관리</h1>
      <p class="mt-1 text-sm text-muted-foreground">게시글·댓글을 검색하고 직접 삭제할 수 있어요</p>
    </div>

    <!-- 검색 -->
    <form class="mb-5 flex gap-2" @submit.prevent="submitSearch">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <AppInput v-model="searchInput" placeholder="키워드 검색" class="pl-9" />
      </div>
      <AppButton type="submit" variant="outline" :loading="pending">검색</AppButton>
    </form>

    <!-- 하위 탭 -->
    <div class="mb-5 flex gap-1 rounded-xl border border-border bg-muted/50 p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
        :class="
          activeTab === tab.value
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="changeTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 삭제 확인 모달 -->
    <Teleport to="body">
      <div
        v-if="confirmTarget"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="cancelDelete"
      >
        <div class="absolute inset-0 bg-black/40" @click="cancelDelete" />
        <div class="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
          <h3 class="text-base font-black text-foreground">콘텐츠를 삭제할까요?</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            삭제된 콘텐츠는 사용자에게 보이지 않아요. 복구할 수 없어요.
          </p>
          <div class="mt-5 flex gap-2">
            <AppButton variant="outline" class="flex-1" @click="cancelDelete">취소</AppButton>
            <AppButton variant="destructive" class="flex-1" @click="executeDelete">삭제</AppButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 로딩 -->
    <div v-if="pending" class="flex justify-center py-20">
      <div class="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
    </div>

    <!-- 빈 상태 -->
    <div
      v-else-if="items.length === 0"
      class="rounded-xl border border-border bg-background py-16 text-center text-sm text-muted-foreground"
    >
      검색 결과가 없어요
    </div>

    <!-- 콘텐츠 목록 -->
    <template v-else>
      <!-- 테이블 (xl+) -->
      <div class="hidden xl:block overflow-x-auto rounded-xl border border-border">
        <table class="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr class="bg-muted">
              <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground w-20">
                종류
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">내용</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                작성자
              </th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                작성일
              </th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                상태
              </th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                삭제
              </th>
            </tr>
          </thead>
          <tbody class="bg-background">
            <tr
              v-for="item in items"
              :key="item.id"
              class="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
              :class="{ 'opacity-50': item.isDeleted }"
            >
              <td class="px-4 py-3 text-center">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="
                    item.type === 'post'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-purple-50 text-purple-700'
                  "
                >
                  {{ item.type === 'post' ? '게시글' : '댓글' }}
                </span>
              </td>
              <td class="px-4 py-3 text-foreground">
                <p class="line-clamp-2 text-xs">{{ item.content }}</p>
              </td>
              <td class="px-4 py-3 text-center text-xs text-muted-foreground">
                {{ item.authorNickname }}
              </td>
              <td class="px-4 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                {{ item.createdAt }}
              </td>
              <td class="px-4 py-3 text-center">
                <AppBadge :variant="item.isDeleted ? 'gray' : 'green'">{{
                  item.isDeleted ? '삭제됨' : '정상'
                }}</AppBadge>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <AppButton
                    v-if="item.isDeleted"
                    variant="outline"
                    size="sm"
                    :loading="restoringIds.has(item.id)"
                    @click="restoreContent(item.type, item.id)"
                    >복구</AppButton
                  >
                  <AppButton
                    v-else
                    variant="destructive"
                    size="sm"
                    :disabled="deletingIds.has(item.id)"
                    @click="requestDelete(item.type, item.id)"
                    >삭제</AppButton
                  >
                </div>
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
          :class="{ 'opacity-60': item.isDeleted }"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="
                  item.type === 'post' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                "
              >
                {{ item.type === 'post' ? '게시글' : '댓글' }}
              </span>
              <AppBadge :variant="item.isDeleted ? 'gray' : 'green'">{{
                item.isDeleted ? '삭제됨' : '정상'
              }}</AppBadge>
            </div>
            <span class="shrink-0 text-xs text-muted-foreground">{{ item.createdAt }}</span>
          </div>
          <p class="mt-3 line-clamp-3 text-xs text-foreground">{{ item.content }}</p>
          <div class="mt-2 text-xs text-muted-foreground">
            작성자 <span class="ml-1 font-medium text-foreground">{{ item.authorNickname }}</span>
          </div>
          <div class="mt-3">
            <AppButton
              v-if="item.isDeleted"
              variant="outline"
              size="sm"
              class="w-full"
              :loading="restoringIds.has(item.id)"
              @click="restoreContent(item.type, item.id)"
              >복구</AppButton
            >
            <AppButton
              v-else
              variant="destructive"
              size="sm"
              class="w-full"
              :disabled="deletingIds.has(item.id)"
              @click="requestDelete(item.type, item.id)"
              >삭제</AppButton
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
