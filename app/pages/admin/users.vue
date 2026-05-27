<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@lucide/vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: '사용자 관리 · 폴짝 관리자' })

type UserRole = 'user' | 'admin'
type JobType = 'developer' | 'designer' | null

interface AdminUser {
  id: string
  nickname: string
  email: string | null
  role: UserRole
  jobType: JobType
  suspendedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  postCount: number
  commentCount: number
  analysisCount: number
}

const toast = useToastStore()
const searchInput = ref('')
const currentPage = ref(1)
const total = ref(0)
const pending = ref(false)
const users = ref<AdminUser[]>([])
const actionLoading = ref<Record<string, boolean>>({})
const PAGE_SIZE = 20
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

// 역할 변경 확인 모달
const roleConfirmTarget = ref<{ user: AdminUser; nextRole: UserRole } | null>(null)

function formatDate(val: string | null): string {
  return val ?? '-'
}

function jobTypeLabel(jobType: JobType): string {
  if (jobType === 'developer') return '개발자'
  if (jobType === 'designer') return '디자이너'
  return '-'
}

async function fetchUsers() {
  pending.value = true
  try {
    const query: Record<string, string | number> = { page: currentPage.value }
    if (searchInput.value.trim()) query.q = searchInput.value.trim()
    const res = await $fetch<{ data: { items: AdminUser[]; total: number } }>(
      '/api/admin/users',
      { query }
    )
    users.value = res.data.items
    total.value = res.data.total
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '사용자 목록을 불러오지 못했어요')
  } finally {
    pending.value = false
  }
}

function submitSearch() {
  currentPage.value = 1
  fetchUsers()
}

function goPage(p: number) {
  currentPage.value = p
  fetchUsers()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 역할 변경 — 확인 모달 오픈
function requestRoleChange(user: AdminUser) {
  const nextRole: UserRole = user.role === 'admin' ? 'user' : 'admin'
  roleConfirmTarget.value = { user, nextRole }
}

// 역할 변경 확인
async function confirmRoleChange() {
  if (!roleConfirmTarget.value) return
  const { user, nextRole } = roleConfirmTarget.value
  roleConfirmTarget.value = null

  if (actionLoading.value[user.id]) return
  actionLoading.value[user.id] = true
  try {
    await $fetch(`/api/admin/users/${user.id}/role`, {
      method: 'PATCH',
      body: { role: nextRole },
    })
    user.role = nextRole
    toast.success(`역할을 '${nextRole === 'admin' ? '관리자' : '일반 사용자'}'로 변경했어요`)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '역할 변경에 실패했어요')
  } finally {
    actionLoading.value[user.id] = false
  }
}

async function toggleSuspend(user: AdminUser) {
  if (actionLoading.value[user.id]) return
  const suspend = !user.suspendedAt
  actionLoading.value[user.id] = true
  try {
    await $fetch(`/api/admin/users/${user.id}/suspend`, {
      method: 'PATCH',
      body: { suspend },
    })
    user.suspendedAt = suspend ? new Date().toISOString() : null
    toast.success(suspend ? '사용자를 정지했어요' : '정지를 해제했어요')
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '정지 처리에 실패했어요')
  } finally {
    actionLoading.value[user.id] = false
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-black text-foreground">사용자 관리</h1>
      <p class="mt-1 text-sm text-muted-foreground">가입 사용자 조회, 역할 변경, 계정 정지 처리</p>
    </div>

    <!-- 역할 변경 확인 모달 -->
    <Teleport to="body">
      <div
        v-if="roleConfirmTarget"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="roleConfirmTarget = null"
      >
        <div class="absolute inset-0 bg-black/40" @click="roleConfirmTarget = null" />
        <div class="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
          <h3 class="text-base font-black text-foreground">역할을 변경할까요?</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            <span class="font-semibold text-foreground">{{ roleConfirmTarget.user.nickname }}</span>님의 역할을
            <span class="font-semibold text-primary">{{ roleConfirmTarget.nextRole === 'admin' ? '관리자' : '일반 사용자' }}</span>로
            변경해요.
          </p>
          <div class="mt-5 flex gap-2">
            <AppButton variant="outline" class="flex-1" @click="roleConfirmTarget = null">취소</AppButton>
            <AppButton class="flex-1" @click="confirmRoleChange">변경</AppButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 검색 -->
    <form class="mb-5 flex gap-2" @submit.prevent="submitSearch">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <AppInput v-model="searchInput" placeholder="닉네임 또는 이메일 검색" class="pl-9" />
      </div>
      <AppButton type="submit" variant="outline" :loading="pending">검색</AppButton>
    </form>

    <!-- 로딩 -->
    <div v-if="pending" class="flex justify-center py-20">
      <div class="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
    </div>

    <!-- 빈 상태 -->
    <div
      v-else-if="users.length === 0"
      class="rounded-xl border border-border bg-background py-16 text-center text-sm text-muted-foreground"
    >
      검색 결과가 없어요
    </div>

    <!-- 사용자 테이블 -->
    <div v-else class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr class="bg-muted">
            <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">닉네임</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">이메일</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">직군</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">역할</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">가입일</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">마지막 로그인</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">게시글</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">댓글</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">분석</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">상태</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">액션</th>
          </tr>
        </thead>
        <tbody class="bg-background">
          <tr
            v-for="user in users"
            :key="user.id"
            class="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
          >
            <!-- 닉네임: 왼쪽 정렬 -->
            <td class="px-4 py-3 font-medium text-foreground">{{ user.nickname }}</td>
            <!-- 이메일: 중앙 정렬 -->
            <td class="px-4 py-3 text-center text-xs text-muted-foreground">{{ user.email ?? '-' }}</td>
            <!-- 직군: 중앙 정렬 -->
            <td class="px-4 py-3 text-center text-xs text-muted-foreground">{{ jobTypeLabel(user.jobType) }}</td>
            <!-- 역할: 중앙 정렬, 클릭 → 확인 모달 -->
            <td class="px-4 py-3 text-center">
              <button
                type="button"
                :disabled="actionLoading[user.id]"
                class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-colors disabled:opacity-50 cursor-pointer hover:opacity-80"
                :class="
                  user.role === 'admin'
                    ? 'bg-blue-50 text-blue-700 ring-blue-100'
                    : 'bg-slate-100 text-slate-600 ring-slate-200'
                "
                @click="requestRoleChange(user)"
              >
                {{ user.role === 'admin' ? '관리자' : '일반' }}
              </button>
            </td>
            <!-- 가입일: 중앙 정렬 -->
            <td class="px-4 py-3 text-center text-xs text-muted-foreground">{{ formatDate(user.createdAt) }}</td>
            <!-- 마지막 로그인: 중앙 정렬 -->
            <td class="px-4 py-3 text-center text-xs text-muted-foreground">{{ formatDate(user.lastLoginAt) }}</td>
            <!-- 활동 수치 -->
            <td class="px-4 py-3 text-center text-xs font-medium text-foreground">{{ user.postCount }}</td>
            <td class="px-4 py-3 text-center text-xs font-medium text-foreground">{{ user.commentCount }}</td>
            <td class="px-4 py-3 text-center text-xs font-medium text-foreground">{{ user.analysisCount }}</td>
            <!-- 상태: 중앙 정렬 -->
            <td class="px-4 py-3 text-center">
              <AppBadge :variant="user.suspendedAt ? 'red' : 'green'">
                {{ user.suspendedAt ? '정지됨' : '정상' }}
              </AppBadge>
            </td>
            <!-- 액션: 중앙 정렬 -->
            <td class="px-4 py-3 text-center">
              <AppButton
                :variant="user.suspendedAt ? 'outline' : 'destructive'"
                size="sm"
                :loading="actionLoading[user.id]"
                @click="toggleSuspend(user)"
              >
                {{ user.suspendedAt ? '정지해제' : '정지' }}
              </AppButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="!pending && total > 0" class="mt-3 text-xs text-muted-foreground">
      전체 <span class="font-semibold text-foreground">{{ total }}</span>명
    </p>

    <Pagination
      v-if="!pending && totalPages > 1"
      :current="currentPage"
      :total="totalPages"
      class="mt-6"
      @change="goPage"
    />
  </div>
</template>
