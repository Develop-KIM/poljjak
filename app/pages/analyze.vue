<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowRight, CheckCircle2 } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import type { AnalysisResult } from '~/server/utils/clova'

const authStore = useAuthStore()
const toast = useToastStore()

const uploadedFile = ref<File | null>(null)
const additionalNote = ref('')
const showLoginModal = ref(false)
const analyzing = ref(false)

const checklist = ['PDF 파일만 가능', '10MB 이하', '최대 50페이지', '텍스트 선택이 가능한 PDF']

const canAnalyze = computed(() => !!uploadedFile.value && !analyzing.value)

// 직접 URL 진입 시 비로그인이면 로그인 모달 표시
onMounted(() => {
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
  }
})

async function handleStartAnalysis() {
  if (!canAnalyze.value || !uploadedFile.value) return

  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
    return
  }

  analyzing.value = true
  errorMsg.value = null

  try {
    const formData = new FormData()
    formData.append('file', uploadedFile.value)
    if (additionalNote.value.trim()) {
      formData.append('additionalNote', additionalNote.value.trim())
    }

    const res = await $fetch<{ data: { id: string; result: AnalysisResult } }>('/api/analyses', {
      method: 'POST',
      body: formData,
    })

    await navigateTo(`/analysis/${res.data.id}`)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; statusCode?: number }
    const msg = err.data?.statusMessage ?? '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.'
    toast.error(msg)
  } finally {
    analyzing.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-14">
    <div class="max-w-2xl">
      <AppBadge variant="blue">포트폴리오 분석</AppBadge>
      <h1 class="mt-4 text-3xl font-black leading-tight text-foreground md:text-4xl">
        PDF를 올리고 AI 피드백을 받아보세요
      </h1>
      <p class="mt-4 text-base leading-7 text-muted-foreground">
        추가 요청사항을 적으면 원하는 방향에 맞춰 더 구체적인 피드백을 받을 수 있어요.
      </p>
    </div>

    <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
      <AppCard>
        <PdfUploadDropzone @update:file="uploadedFile = $event" />

        <div class="mt-6">
          <label for="analysis-note" class="text-sm font-bold text-foreground">
            추가 요청사항
            <span class="ml-1 font-normal text-muted-foreground">(선택)</span>
          </label>
          <AppTextarea
            id="analysis-note"
            v-model="additionalNote"
            class="mt-2"
            placeholder="예: 프로젝트 설명이 설득력 있는지, 주니어 프론트엔드 포지션에 맞는지 봐주세요."
            :rows="5"
            :maxlength="500"
            :show-count="true"
          />
        </div>

        <div class="mt-6 flex justify-end">
          <AppButton size="lg" :disabled="!canAnalyze" @click="handleStartAnalysis">
            <span v-if="analyzing" class="flex items-center gap-2">
              <span
                class="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              />
              분석 중...
            </span>
            <span v-else class="flex items-center gap-2">
              분석 시작
              <ArrowRight class="size-4" />
            </span>
          </AppButton>
        </div>
      </AppCard>

      <div class="grid content-start gap-4">
        <AppAlert>
          이미지 스캔 PDF는 텍스트를 추출할 수 없어 분석이 제한됩니다. 텍스트 선택이 가능한 PDF를
          올려주세요.
        </AppAlert>
        <AppCard>
          <h2 class="text-base font-black text-foreground">업로드 전 확인</h2>
          <ul class="mt-4 grid gap-3">
            <li
              v-for="item in checklist"
              :key="item"
              class="flex items-center gap-3 text-sm font-semibold"
            >
              <CheckCircle2 class="size-5 shrink-0 text-emerald-500" />
              {{ item }}
            </li>
          </ul>
        </AppCard>
      </div>
    </div>

    <LoginModal
      :open="showLoginModal"
      context="포트폴리오 분석하기"
      description="로그인 후 AI 포트폴리오 분석을 이용할 수 있어요."
      @close="
        () => {
          showLoginModal = false
          if (!authStore.isLoggedIn) navigateTo('/')
        }
      "
    />
  </div>
</template>
