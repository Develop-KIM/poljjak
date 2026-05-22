<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RotateCcw, CheckCircle } from '@lucide/vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeoMeta({ title: '프롬프트 관리 · 폴짝 관리자' })

// ────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────
interface ScoreItem {
  title: string
  score: number
  comment: string
  improvement: string
}

interface AnalysisResult {
  scores: ScoreItem[]
  summary: string
  suggestions: Array<{ category: string; context: string; before: string; after: string }>
}

interface ActivePrompt {
  id: string
  content: string
  createdAt: string
}

interface HistoryItem {
  id: string
  isActive: boolean
  createdAt: string
  createdByNickname: string
}

type JobType = 'developer' | 'designer'

// ────────────────────────────────────────────
// 상태
// ────────────────────────────────────────────
const toast = useToastStore()

// 탭
const activeTab = ref<JobType>('developer')
const tabs: Array<{ label: string; value: JobType }> = [
  { label: '개발자', value: 'developer' },
  { label: '디자이너', value: 'designer' },
]

// 프롬프트 데이터
const activePrompt = ref<ActivePrompt | null>(null)
const history = ref<HistoryItem[]>([])
const editorContent = ref('')
const loadingPrompts = ref(false)

// 저장
const saving = ref(false)

// 복원
const restoringId = ref<string | null>(null)

// 테스트 모달
const showTestModal = ref(false)
const testFile = ref<File | null>(null)
const testing = ref(false)
const testResult = ref<AnalysisResult | null>(null)
const testTokenUsage = ref<number | null>(null)

// ────────────────────────────────────────────
// 프롬프트 fetch
// ────────────────────────────────────────────
async function fetchPrompts() {
  loadingPrompts.value = true
  try {
    const res = await $fetch<{
      data: { active: ActivePrompt | null; history: HistoryItem[] }
    }>('/api/admin/prompts', {
      query: { jobType: activeTab.value },
    })
    activePrompt.value = res.data.active
    history.value = res.data.history
    // 에디터를 현재 활성 프롬프트 내용으로 초기화
    editorContent.value = res.data.active?.content ?? ''
  } catch {
    toast.error('프롬프트를 불러오지 못했어요')
  } finally {
    loadingPrompts.value = false
  }
}

// 탭 전환 시 해당 직군 프롬프트 fetch
watch(activeTab, () => {
  testResult.value = null
  testTokenUsage.value = null
  fetchPrompts()
})

onMounted(() => {
  fetchPrompts()
})

// ────────────────────────────────────────────
// 저장
// ────────────────────────────────────────────
async function savePrompt() {
  if (!editorContent.value.trim()) {
    toast.error('프롬프트 내용을 입력해주세요')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/prompts', {
      method: 'POST',
      body: { jobType: activeTab.value, content: editorContent.value },
    })
    toast.success('프롬프트가 저장되었어요')
    // 저장 후 이력 새로고침
    await fetchPrompts()
  } catch {
    toast.error('저장에 실패했어요')
  } finally {
    saving.value = false
  }
}

// ────────────────────────────────────────────
// 버전 복원
// ────────────────────────────────────────────
async function restoreVersion(id: string) {
  restoringId.value = id
  try {
    await $fetch(`/api/admin/prompts/${id}/restore`, { method: 'POST' })
    toast.success('버전이 복원되었어요')
    await fetchPrompts()
  } catch {
    toast.error('복원에 실패했어요')
  } finally {
    restoringId.value = null
  }
}

// ────────────────────────────────────────────
// 테스트 모달
// ────────────────────────────────────────────
function openTestModal() {
  testResult.value = null
  testTokenUsage.value = null
  testFile.value = null
  showTestModal.value = true
}

function closeTestModal() {
  showTestModal.value = false
}

async function runTest() {
  if (!testFile.value) {
    toast.error('PDF 파일을 업로드해주세요')
    return
  }
  if (!editorContent.value.trim()) {
    toast.error('프롬프트 내용을 입력해주세요')
    return
  }
  testing.value = true
  testResult.value = null
  testTokenUsage.value = null
  try {
    const formData = new FormData()
    formData.append('file', testFile.value)
    formData.append('jobType', activeTab.value)
    formData.append('promptContent', editorContent.value)

    const res = await $fetch<{
      data: { result: AnalysisResult; tokenUsage: number }
    }>('/api/admin/prompts/test', {
      method: 'POST',
      body: formData,
    })
    testResult.value = res.data.result
    testTokenUsage.value = res.data.tokenUsage
  } catch {
    toast.error('테스트 실행에 실패했어요')
  } finally {
    testing.value = false
  }
}

// ────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

</script>

<template>
  <div class="space-y-6">
    <!-- 페이지 제목 -->
    <div>
      <h1 class="text-xl font-bold text-foreground">프롬프트 관리</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        직군별 AI 분석 프롬프트를 편집하고 버전을 관리해요.
      </p>
    </div>

    <!-- 직군 탭 -->
    <div class="flex gap-1 border-b border-border">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors"
        :class="
          activeTab === tab.value
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loadingPrompts" class="flex items-center justify-center py-16">
      <span
        class="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
      />
    </div>

    <!-- 본문 그리드: 에디터(좌) + 이력(우) -->
    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <!-- ── 에디터 영역 ── -->
      <div class="space-y-4">
        <div class="rounded-xl border border-border bg-background p-5 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-foreground">프롬프트 편집</h2>
            <span v-if="!activePrompt" class="text-xs text-muted-foreground">
              등록된 프롬프트가 없어요
            </span>
          </div>

          <!-- 에디터 textarea -->
          <textarea
            v-model="editorContent"
            class="w-full resize-y rounded-lg border border-border bg-muted/30 p-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            style="min-height: 400px"
            placeholder="프롬프트 내용을 입력하세요"
            spellcheck="false"
          />

          <!-- 버튼 그룹 -->
          <div class="mt-4 flex gap-2">
            <AppButton :loading="saving" @click="savePrompt">저장</AppButton>
            <AppButton variant="outline" :disabled="saving" @click="openTestModal">
              테스트 실행
            </AppButton>
          </div>
        </div>
      </div>

      <!-- ── 버전 이력 영역 ── -->
      <div class="rounded-xl border border-border bg-background p-5 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold text-foreground">버전 이력</h2>

        <div v-if="history.length === 0" class="text-sm text-muted-foreground">
          이력이 없어요.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="item in history"
            :key="item.id"
            class="rounded-lg border border-border p-3 text-sm"
            :class="item.isActive ? 'border-primary/40 bg-primary/5' : 'bg-muted/20'"
          >
            <!-- 날짜 + 현재 뱃지 -->
            <div class="flex items-center gap-2">
              <CheckCircle
                v-if="item.isActive"
                class="size-4 shrink-0 text-primary"
              />
              <span class="font-medium text-foreground">
                {{ formatDate(item.createdAt) }}
              </span>
              <span
                v-if="item.isActive"
                class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
              >
                현재
              </span>
            </div>

            <!-- 저장자 -->
            <p class="mt-1 text-xs text-muted-foreground">
              저장: {{ item.createdByNickname }}
            </p>

            <!-- 복원 버튼 -->
            <button
              v-if="!item.isActive"
              class="mt-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              :disabled="restoringId === item.id"
              @click="restoreVersion(item.id)"
            >
              <span
                v-if="restoringId === item.id"
                class="size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              <RotateCcw v-else class="size-3" />
              복원
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ── 테스트 모달 ── -->
  <Teleport to="body">
    <div
      v-if="showTestModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      @click.self="closeTestModal"
    >
      <div
        class="w-full max-w-2xl rounded-2xl bg-background p-6 shadow-xl"
        style="max-height: 90vh; overflow-y: auto"
      >
        <!-- 모달 헤더 -->
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-base font-bold text-foreground">프롬프트 테스트</h2>
          <button
            class="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="closeTestModal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- PDF 파일 업로드 -->
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-semibold text-foreground">
            테스트할 포트폴리오 PDF
          </label>
          <label
            class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors hover:border-primary hover:bg-accent"
          >
            <span class="text-sm font-medium text-foreground">
              {{ testFile ? testFile.name : 'PDF 파일을 클릭하거나 끌어다 놓으세요' }}
            </span>
            <span class="mt-1 text-xs text-muted-foreground">10MB 이하 · 50페이지 이하</span>
            <input
              type="file"
              accept="application/pdf"
              class="sr-only"
              @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) testFile = f }"
            />
          </label>
        </div>

        <!-- 실행 버튼 -->
        <AppButton :loading="testing" @click="runTest">분석 실행</AppButton>

        <!-- 로딩 안내 -->
        <div v-if="testing" class="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <span
            class="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
          />
          AI가 분석 중이에요. 잠시만 기다려주세요...
        </div>

        <!-- 테스트 결과 -->
        <div v-if="testResult" class="mt-6 space-y-5">
          <hr class="border-border" />

          <!-- 토큰 사용량 -->
          <p v-if="testTokenUsage !== null" class="text-xs text-muted-foreground">
            토큰 사용량: {{ testTokenUsage.toLocaleString('ko-KR') }}
          </p>

          <!-- 요약 -->
          <div>
            <h3 class="mb-2 text-sm font-bold text-foreground">종합 요약</h3>
            <p class="text-sm leading-relaxed text-foreground">{{ testResult.summary }}</p>
          </div>

          <!-- 점수 목록 -->
          <div>
            <h3 class="mb-3 text-sm font-bold text-foreground">항목별 점수</h3>
            <ul class="space-y-3">
              <li
                v-for="score in testResult.scores"
                :key="score.title"
                class="rounded-lg border border-border bg-muted/20 p-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-foreground">{{ score.title }}</span>
                  <span class="text-sm font-bold text-primary">{{ score.score }}점</span>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">{{ score.comment }}</p>
                <p v-if="score.improvement" class="mt-1 text-xs text-foreground/70">
                  개선: {{ score.improvement }}
                </p>
              </li>
            </ul>
          </div>

          <!-- 개선 제안 -->
          <div v-if="testResult.suggestions.length > 0">
            <h3 class="mb-3 text-sm font-bold text-foreground">개선 제안</h3>
            <ul class="space-y-3">
              <li
                v-for="(sug, idx) in testResult.suggestions"
                :key="idx"
                class="rounded-lg border border-border bg-muted/20 p-3 text-xs"
              >
                <p class="font-semibold text-foreground">{{ sug.category }}</p>
                <p class="mt-0.5 text-muted-foreground">{{ sug.context }}</p>
                <div class="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span class="font-medium text-destructive">수정 전</span>
                    <p class="mt-0.5 text-foreground/80">{{ sug.before }}</p>
                  </div>
                  <div>
                    <span class="font-medium text-primary">수정 후</span>
                    <p class="mt-0.5 text-foreground/80">{{ sug.after }}</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- 닫기 버튼 (하단) -->
        <div class="mt-6">
          <AppButton variant="outline" @click="closeTestModal">닫기</AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
