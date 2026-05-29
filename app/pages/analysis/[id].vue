<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import {
  Check,
  Link,
  Lock,
  Unlock,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  EyeOff,
  LayoutTemplate,
} from '@lucide/vue'
import { marked } from 'marked'
import type { AnalysisResultV2, AnalysisIssue } from '~~/server/utils/clova'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = route.params.id as string
const toast = useToastStore()

interface Analysis {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  isPublic: boolean
  shareToken: string | null
  jobRole: string | null
  seniority: string | null
  pdfUrl: string | null
  issues: AnalysisIssue[] | null
  afterHtml: string | null
  result: AnalysisResultV2 | null
  createdAt: string
}

const JOB_ROLE_LABELS: Record<string, string> = {
  frontend: '프론트엔드',
  backend: '백엔드',
  fullstack: '풀스택',
  devops: 'DevOps',
  ml: 'ML/AI',
}
const SENIORITY_LABELS: Record<string, string> = {
  junior: '신입',
  mid: '주니어',
  senior: '시니어',
}
const PRIORITY_STYLES: Record<string, { label: string; cls: string }> = {
  high: { label: '높음', cls: 'bg-red-50 text-red-600 border-red-200' },
  medium: { label: '중간', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  low: { label: '낮음', cls: 'bg-muted text-muted-foreground border-border' },
}

const analysis = ref<Analysis | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)
const linkCopied = ref(false)
const toggling = ref(false)
const retrying = ref(false)
const downloadingPdf = ref(false)
const maskingFaces = ref(false)
const faceMasked = ref(false)
const faceOverlays: HTMLCanvasElement[] = []
const piiModalOpen = ref(false)
let pollTimer: ReturnType<typeof setTimeout> | null = null
let stepTimer: ReturnType<typeof setInterval> | null = null

// 분할 뷰어
const beforePanel = ref<HTMLElement | null>(null)
const afterPanel = ref<HTMLElement | null>(null)

// AFTER 섹션 페이지네이션
const afterSectionIdx = ref(0)
const afterSections = computed(() => analysis.value?.result?.afterHtmlSections ?? [])
const currentAfterSection = computed(() => afterSections.value[afterSectionIdx.value] ?? null)
const hasSectionPagination = computed(() => afterSections.value.length > 0)

function prevAfterSection() {
  if (afterSectionIdx.value > 0) afterSectionIdx.value--
}
function nextAfterSection() {
  if (afterSectionIdx.value < afterSections.value.length - 1) afterSectionIdx.value++
}

// 이슈 필터
const issueFilter = ref<'all' | 'high' | 'medium' | 'low'>('all')

// 처리 중 애니메이션
const processingStep = ref(0)
const processingSteps = [
  { label: 'PDF 업로드 중', sublabel: '파일을 서버로 전송하고 있어요' },
  { label: '텍스트 추출 중', sublabel: 'PDF에서 내용을 읽고 있어요' },
  { label: 'AI 분석 중', sublabel: '직군·연차 기준으로 꼼꼼히 분석하고 있어요' },
]

const isProcessing = computed(
  () => analysis.value?.status === 'pending' || analysis.value?.status === 'processing'
)
const shouldShowProgress = computed(() => {
  if (pending.value) return true
  if (!analysis.value) return false
  if (analysis.value.status === 'failed') return false
  return isProcessing.value
})

const isV2 = computed(() => !!(analysis.value?.issues || analysis.value?.afterHtml))

// HTML 태그 밖의 텍스트에만 regex를 적용 (태그 속성 훼손 방지)
function maskPiiInHtml(html: string): string {
  return html.replace(/>([^<]*)</g, (match, text: string) => {
    const masked = text
      // 이메일
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[이메일]')
      // 한국 휴대폰 번호 (010-xxxx-xxxx, 010 xxxx xxxx, 01012345678 등)
      .replace(/\b01\d[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g, '[연락처]')
      // GitHub·GitLab 사용자 아이디 (URL 경로 첫 번째 세그먼트)
      .replace(/(github\.com|gitlab\.com)\/([A-Za-z0-9_.-]+)/gi, '$1/[아이디]')
    return `>${masked}<`
  })
}

function processHtml(raw: string | null | undefined): string | null {
  if (!raw) return null
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(raw)
  const html = hasHtmlTags ? raw : (marked.parse(raw, { async: false }) as string)
  const withMarkdown = html
    .replace(/\*\*\*(.+?)\*\*\*/gs, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/gs, '<em>$1</em>')
  return maskPiiInHtml(withMarkdown)
}

// 현재 섹션 HTML (페이지네이션용)
const currentAfterHtml = computed(() => processHtml(currentAfterSection.value?.html))

// 전체 합산 HTML (다운로드·fallback용)
const renderedAfterHtml = computed(() => processHtml(analysis.value?.afterHtml))

const issues = computed<AnalysisIssue[]>(() => {
  const raw = analysis.value?.issues ?? []
  const priority = { high: 0, medium: 1, low: 2 }
  return [...raw].sort((a, b) => (priority[a.priority] ?? 3) - (priority[b.priority] ?? 3))
})

const filteredIssues = computed(() =>
  issueFilter.value === 'all'
    ? issues.value
    : issues.value.filter((i) => i.priority === issueFilter.value)
)

const createdAtLabel = computed(() => {
  if (!analysis.value?.createdAt) return ''
  return new Date(analysis.value.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

async function fetchAnalysis() {
  try {
    const res = await $fetch<{ data: Analysis }>(`/api/analyses/${id}`)
    analysis.value = res.data
    error.value = res.data.status === 'failed' ? '분석에 실패했어요. 다시 시도해주세요.' : null

    if (shouldShowProgress.value) {
      startProcessingAnimation()
      pollTimer = setTimeout(fetchAnalysis, 4000)
    } else {
      stopProcessingAnimation()
    }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    if (analysis.value && shouldShowProgress.value) {
      pollTimer = setTimeout(fetchAnalysis, 4000)
      return
    }
    error.value = err.data?.statusMessage ?? '분석 결과를 불러오지 못했어요'
  } finally {
    pending.value = false
  }
}

function startProcessingAnimation() {
  if (stepTimer) return
  stepTimer = setInterval(() => {
    if (processingStep.value < processingSteps.length - 1) processingStep.value++
  }, 4000)
}

function stopProcessingAnimation() {
  if (!stepTimer) return
  clearInterval(stepTimer)
  stepTimer = null
}

async function onPdfRendered() {
  if (faceMasked.value || maskingFaces.value) return
  await toggleFaceMask()
}

onMounted(async () => {
  await fetchAnalysis()
})

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
  stopProcessingAnimation()
})

function requestTogglePublic() {
  if (!analysis.value || toggling.value) return
  // 비공개 → 공개 전환이고 v2 afterHtml 있으면 마스킹 모달 선행
  if (!analysis.value.isPublic && analysis.value.afterHtml) {
    piiModalOpen.value = true
    return
  }
  void togglePublic(null)
}

async function togglePublic(maskedAfterHtml: string | null) {
  if (!analysis.value || toggling.value) return
  toggling.value = true
  try {
    const next = !analysis.value.isPublic
    const body: Record<string, unknown> = { isPublic: next }
    if (next && maskedAfterHtml !== null) body.maskedAfterHtml = maskedAfterHtml
    const res = await $fetch<{ data: Analysis }>(`/api/analyses/${id}`, {
      method: 'PATCH',
      body,
    })
    analysis.value = res.data
    toast.success(next ? '공개로 전환됐어요' : '비공개로 전환됐어요')
  } catch {
    toast.error('전환에 실패했어요')
  } finally {
    toggling.value = false
  }
}

async function onPiiConfirm(maskedHtml: string) {
  piiModalOpen.value = false
  await togglePublic(maskedHtml)
}

async function copyShareLink() {
  if (!analysis.value) return
  if (!analysis.value.isPublic) {
    requestTogglePublic()
    // 모달이 열렸으면 여기서 중단 (모달 확인 후 공개)
    if (!analysis.value.isPublic) return
  }
  const token = analysis.value.shareToken
  if (!token) return
  const url = `${window.location.origin}/analysis/share/${token}`
  await navigator.clipboard.writeText(url)
  linkCopied.value = true
  toast.success('링크가 복사됐어요')
  setTimeout(() => {
    linkCopied.value = false
  }, 2000)
}

function scrollToIssue(issueId: string) {
  // 해당 이슈를 포함하는 섹션으로 먼저 이동
  if (hasSectionPagination.value) {
    const idx = afterSections.value.findIndex((s) => s.changes.some((c) => c.issueId === issueId))
    if (idx !== -1) afterSectionIdx.value = idx
  }
  nextTick(() => {
    if (!afterPanel.value) return
    const el = afterPanel.value.querySelector(`[data-issue-id="${issueId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

async function toggleFaceMask() {
  if (!beforePanel.value) return

  // 마스킹 해제
  if (faceMasked.value) {
    faceOverlays.forEach((el) => el.remove())
    faceOverlays.length = 0
    faceMasked.value = false
    return
  }

  if (maskingFaces.value) return
  maskingFaces.value = true

  try {
    const faceapi = await import('face-api.js')

    if (!faceapi.nets.tinyFaceDetector.isLoaded) {
      await faceapi.loadTinyFaceDetectorModel('/weights')
    }

    const canvases = beforePanel.value.querySelectorAll('canvas')
    if (canvases.length === 0) {
      toast.error('PDF가 아직 로드되지 않았어요. 잠시 후 다시 시도해주세요.')
      return
    }

    for (const canvas of canvases) {
      let detections
      try {
        detections = await faceapi.detectAllFaces(
          canvas,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 })
        )
      } catch {
        // canvas가 tainted인 경우 skip
        continue
      }

      if (!detections.length) continue

      // 오버레이 캔버스 생성
      const overlay = document.createElement('canvas')
      overlay.width = canvas.width
      overlay.height = canvas.height
      Object.assign(overlay.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: `${canvas.offsetWidth}px`,
        height: `${canvas.offsetHeight}px`,
        pointerEvents: 'none',
      })

      const ctx = overlay.getContext('2d')!

      for (const detection of detections) {
        const { x, y, width, height } = detection.box
        const pad = 20
        const bx = Math.max(0, Math.floor(x - pad))
        const by = Math.max(0, Math.floor(y - pad))
        const bw = Math.min(canvas.width - bx, Math.ceil(width + pad * 2))
        const bh = Math.min(canvas.height - by, Math.ceil(height + pad * 2))

        // 픽셀화로 블러 효과 (다운샘플 → 업샘플)
        const factor = 12
        const tmp = document.createElement('canvas')
        tmp.width = Math.max(1, Math.floor(bw / factor))
        tmp.height = Math.max(1, Math.floor(bh / factor))
        tmp.getContext('2d')!.drawImage(canvas, bx, by, bw, bh, 0, 0, tmp.width, tmp.height)

        ctx.imageSmoothingEnabled = false
        ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, bx, by, bw, bh)
        ctx.imageSmoothingEnabled = true

        // 반투명 다크 오버레이
        ctx.fillStyle = 'rgba(0,0,0,0.15)'
        ctx.fillRect(bx, by, bw, bh)
      }

      const parent = canvas.parentElement
      if (parent) {
        parent.style.position = 'relative'
        parent.appendChild(overlay)
        faceOverlays.push(overlay)
      }
    }

    // 텍스트 PII 블러 (얼굴과 같은 오버레이 배열에 추가)
    await applyTextPiiMask()
    faceMasked.value = true
  } catch {
    toast.error('마스킹에 실패했어요')
  } finally {
    maskingFaces.value = false
  }
}

async function applyTextPiiMask() {
  if (!beforePanel.value || !analysis.value?.pdfUrl) return

  const pdfjsLib = await import('pdfjs-dist')

  let pdf: Awaited<ReturnType<(typeof pdfjsLib)['getDocument']>['promise']>
  try {
    pdf = await pdfjsLib.getDocument(analysis.value.pdfUrl).promise
  } catch {
    return
  }

  const canvases = Array.from(beforePanel.value.querySelectorAll('canvas'))

  const PII_PATTERNS = [
    /01\d[-.\s]?\d{3,4}[-.\s]?\d{4}/, // 전화번호
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // 이메일
    /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/, // 생년월일 (한국식)
    /\d{4}[-.]\d{2}[-.]\d{2}/, // 생년월일 (숫자식)
    /https?:\/\/\S+/, // URL
    /github\.com/i, // GitHub
  ]
  const LABEL_KEYWORDS = [
    '이름',
    '성명',
    '생년월일',
    '생일',
    '연락처',
    '전화',
    '휴대폰',
    '이메일',
    'Email',
    'E-mail',
    'GitHub',
    'GitLab',
    'Phone',
    'Tel',
    '주소',
    'Address',
  ]
  const COMPANY_PREFIXES = ['주식회사', '(주)', '㈜', 'Inc.', 'Co.', 'Ltd.', 'Corp.']

  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, canvases.length); pageNum++) {
    const canvas = canvases[pageNum - 1]
    if (!canvas) continue

    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })
    const scaleX = canvas.width / viewport.width
    const scaleY = canvas.height / viewport.height

    const textContent = await page.getTextContent()
    type TItem = { str: string; transform: number[]; width: number; height: number }
    const items: TItem[] = []
    for (const rawItem of textContent.items) {
      const item = rawItem as {
        str?: unknown
        transform?: unknown
        width?: unknown
        height?: unknown
      }
      if (
        typeof item.str === 'string' &&
        Array.isArray(item.transform) &&
        typeof item.width === 'number' &&
        typeof item.height === 'number'
      ) {
        items.push({
          str: item.str,
          transform: item.transform.filter((v): v is number => typeof v === 'number'),
          width: item.width,
          height: item.height,
        })
      }
    }

    // y좌표 기준으로 같은 라인 묶기 (허용 오차 ±25 — 테이블 레이아웃 대응)
    const lines: TItem[][] = []
    for (const item of items) {
      const y = item.transform[5]!
      const line = lines.find((l) => Math.abs(l[0]!.transform[5]! - y) <= 25)
      if (line) line.push(item)
      else lines.push([item])
    }

    const toBlur = new Set<TItem>()

    for (const line of lines) {
      // 같은 라인 텍스트를 합쳐서 PII 패턴 검사 (분할된 토큰 대응)
      const lineText = line.map((it) => it.str).join('')

      // 라벨 키워드가 있는 줄 → 라벨이 아닌 항목 전부 블러
      const hasLabel = LABEL_KEYWORDS.some((kw) => line.some((it) => it.str.includes(kw)))
      if (hasLabel) {
        for (const it of line) {
          if (!LABEL_KEYWORDS.some((kw) => it.str.includes(kw)) && it.str.trim()) {
            toBlur.add(it)
          }
        }
      }

      // 합친 라인 텍스트에 PII 패턴이 있으면 해당 라인 비-라벨 항목 전부 블러
      if (!hasLabel && PII_PATTERNS.some((r) => r.test(lineText))) {
        for (const it of line) {
          if (it.str.trim()) toBlur.add(it)
        }
      }

      for (let i = 0; i < line.length; i++) {
        const it = line[i]!
        // 회사명 접두사 → 해당 항목 + 다음 항목 블러
        if (COMPANY_PREFIXES.some((p) => it.str.includes(p))) {
          toBlur.add(it)
          const next = line[i + 1]
          if (next?.str.trim()) toBlur.add(next)
        }
        // 개별 항목 PII 패턴 직접 매칭
        if (PII_PATTERNS.some((r) => r.test(it.str))) toBlur.add(it)
      }
    }

    if (toBlur.size === 0) continue

    const overlay = document.createElement('canvas')
    overlay.width = canvas.width
    overlay.height = canvas.height
    Object.assign(overlay.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: `${canvas.offsetWidth}px`,
      height: `${canvas.offsetHeight}px`,
      pointerEvents: 'none',
    })

    const ctx = overlay.getContext('2d')!

    for (const it of toBlur) {
      const pdfX = it.transform[4]!
      const pdfY = it.transform[5]!
      const pdfW = it.width
      const pdfH = it.height > 0 ? it.height : Math.abs(it.transform[3]!)
      const pad = 2

      const x = Math.max(0, pdfX * scaleX - pad)
      const y = Math.max(0, (viewport.height - pdfY - pdfH) * scaleY - pad)
      const w = Math.min(canvas.width - x, pdfW * scaleX + pad * 2)
      const h = Math.min(canvas.height - y, pdfH * scaleY + pad * 2)

      if (w <= 0 || h <= 0) continue

      // 솔리드 마스킹 — CORS tainted canvas에서도 항상 동작
      ctx.fillStyle = '#1c1c1e'
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2)
    }

    const parent = canvas.parentElement
    if (parent) {
      parent.style.position = 'relative'
      parent.appendChild(overlay)
      faceOverlays.push(overlay)
    }
  }
}

async function retryAnalysis() {
  if (retrying.value) return
  retrying.value = true
  try {
    await $fetch(`/api/analyses/${id}/retry`, { method: 'POST' })
    error.value = null
    pending.value = true
    processingStep.value = 0
    await fetchAnalysis()
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    toast.error(err.data?.statusMessage ?? '재시도에 실패했어요')
  } finally {
    retrying.value = false
  }
}

async function downloadAfterPdf() {
  if (!analysis.value?.afterHtml || downloadingPdf.value) return
  downloadingPdf.value = true
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    // After HTML 렌더링용 임시 스타일 (A4 너비 기준)
    const style = document.createElement('style')
    style.textContent = `
      .after-pdf-wrap h1, .after-pdf-wrap h2, .after-pdf-wrap h3 { font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.5rem; }
      .after-pdf-wrap h1 { font-size: 1.35rem; }
      .after-pdf-wrap h2 { font-size: 1.15rem; }
      .after-pdf-wrap h3 { font-size: 1rem; }
      .after-pdf-wrap p { margin-bottom: 0.75rem; }
      .after-pdf-wrap ul, .after-pdf-wrap ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
      .after-pdf-wrap li { margin-bottom: 0.25rem; }
    `
    document.head.appendChild(style)

    const container = document.createElement('div')
    container.className = 'after-pdf-wrap'
    Object.assign(container.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      width: '794px',
      padding: '60px 56px',
      background: '#ffffff',
      color: '#111111',
      fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
      fontSize: '14px',
      lineHeight: '1.8',
    })
    container.innerHTML = analysis.value.afterHtml
    document.body.appendChild(container)

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    document.body.removeChild(container)
    document.head.removeChild(style)

    // A4 기준 멀티 페이지 PDF 생성
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const scale = pageW / canvas.width
    const totalH = canvas.height * scale

    let offset = 0
    while (offset < totalH) {
      if (offset > 0) pdf.addPage()
      pdf.addImage(canvas, 'JPEG', 0, -offset, pageW, totalH)
      offset += pageH
    }

    pdf.save(`after-${id}.pdf`)
    toast.success('PDF가 다운로드됐어요')
  } catch {
    toast.error('PDF 생성에 실패했어요')
  } finally {
    downloadingPdf.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-5 py-10 md:px-8 md:py-14">
    <!-- 분석 중 -->
    <div v-if="shouldShowProgress" class="flex flex-col items-center justify-center py-24">
      <div class="relative mt-4">
        <div class="size-20 animate-spin rounded-full border-4 border-border border-t-primary" />
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xs font-bold text-primary">AI</span>
        </div>
      </div>
      <div class="mt-10 w-full max-w-sm">
        <div
          v-for="(step, i) in processingSteps"
          :key="step.label"
          class="flex items-start gap-3 py-3"
          :class="i < processingSteps.length - 1 ? 'border-b border-border' : ''"
        >
          <div class="mt-0.5 shrink-0">
            <CheckCircle2 v-if="i < processingStep" class="size-5 text-emerald-500" />
            <Loader2 v-else-if="i === processingStep" class="size-5 animate-spin text-primary" />
            <div v-else class="size-5 rounded-full border-2 border-border" />
          </div>
          <div>
            <p
              class="text-sm font-bold"
              :class="i <= processingStep ? 'text-foreground' : 'text-muted-foreground'"
            >
              {{ step.label }}
            </p>
            <p v-if="i === processingStep" class="mt-0.5 text-xs text-muted-foreground">
              {{ step.sublabel }}
            </p>
          </div>
        </div>
      </div>
      <p class="mt-8 text-sm text-muted-foreground">보통 30초~1분 정도 소요돼요</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle class="size-12 text-destructive" />
      <p class="mt-4 text-lg font-bold text-foreground">{{ error }}</p>
      <div class="mt-6 flex gap-3">
        <AppButton v-if="analysis?.pdfUrl" :disabled="retrying" @click="retryAnalysis">
          <Loader2 v-if="retrying" class="size-4 animate-spin" />
          재시도
        </AppButton>
        <NuxtLink to="/analyze">
          <AppButton variant="outline">새로 분석하기</AppButton>
        </NuxtLink>
      </div>
    </div>

    <!-- v2 결과 -->
    <template v-else-if="analysis && isV2">
      <!-- 헤더 -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="analysis.jobRole"
              class="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground"
            >
              {{ JOB_ROLE_LABELS[analysis.jobRole] ?? analysis.jobRole }}
            </span>
            <span
              v-if="analysis.seniority"
              class="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground"
            >
              {{ SENIORITY_LABELS[analysis.seniority] ?? analysis.seniority }}
            </span>
          </div>
          <h1 class="mt-3 text-2xl font-black leading-tight text-foreground md:text-3xl">
            {{ analysis.title }}
          </h1>
          <p class="mt-1 text-sm text-muted-foreground">{{ createdAtLabel }}</p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <AppButton variant="outline" size="sm" @click="copyShareLink">
            <Check v-if="linkCopied" class="size-4 text-emerald-500" />
            <Link v-else class="size-4" />
            {{ linkCopied ? '복사됐어요' : '링크 복사' }}
          </AppButton>
          <AppButton variant="outline" size="sm" :disabled="toggling" @click="requestTogglePublic">
            <Unlock v-if="analysis.isPublic" class="size-4" />
            <Lock v-else class="size-4" />
            {{ analysis.isPublic ? '공개' : '비공개' }}
          </AppButton>
          <AppButton size="sm" @click="navigateTo(`/community/write?analysisId=${id}`)">
            <MessageSquare class="size-4" />
            커뮤니티 공유
          </AppButton>
        </div>
      </div>

      <!-- PII 마스킹 모달 -->
      <PiiMaskingModal
        :open="piiModalOpen"
        :after-html="analysis.afterHtml ?? ''"
        @confirm="onPiiConfirm"
        @cancel="piiModalOpen = false"
      />

      <!-- 총평 -->
      <AppCard v-if="analysis.result?.summary" class="mt-6">
        <h2 class="text-base font-bold text-foreground">AI 총평</h2>
        <p class="mt-2 leading-7 text-muted-foreground">{{ analysis.result.summary }}</p>
      </AppCard>

      <!-- 포트폴리오 구조 분석 -->
      <AppCard v-if="analysis.result?.structureAnalysis" class="mt-4">
        <div class="flex items-center gap-2">
          <LayoutTemplate class="size-4 text-primary" />
          <h2 class="text-base font-bold text-foreground">구조 분석</h2>
        </div>
        <p class="mt-2 leading-7 text-muted-foreground">
          {{ analysis.result.structureAnalysis.overallFlow }}
        </p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ analysis.result.structureAnalysis.sectionOrder }}
        </p>
        <div
          v-if="analysis.result.structureAnalysis.missingSections?.length"
          class="mt-3 flex flex-wrap gap-2"
        >
          <span class="text-xs font-semibold text-muted-foreground">누락 섹션</span>
          <span
            v-for="s in analysis.result.structureAnalysis.missingSections"
            :key="s"
            class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
          >
            {{ s }}
          </span>
        </div>
        <ul v-if="analysis.result.structureAnalysis.suggestions?.length" class="mt-3 space-y-1.5">
          <li
            v-for="(sg, i) in analysis.result.structureAnalysis.suggestions"
            :key="i"
            class="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <span class="mt-0.5 shrink-0 text-primary">•</span>
            {{ sg }}
          </li>
        </ul>
      </AppCard>

      <!-- Before / After 분할 뷰어 -->
      <div class="mt-6">
        <div class="mb-3 flex items-center gap-3">
          <h2 class="text-lg font-black text-foreground">Before / After</h2>
          <span class="text-sm text-muted-foreground"
            >파란 밑줄에 마우스를 올리면 변경 이유를 확인할 수 있어요</span
          >
        </div>

        <div class="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card">
          <!-- Before: PDF 원본 -->
          <div class="flex flex-col border-r border-border">
            <div class="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
              <span class="size-2.5 rounded-full bg-red-400" />
              <span class="text-xs font-bold text-muted-foreground">BEFORE · 원본</span>
              <button
                v-if="analysis.pdfUrl && faceMasked"
                type="button"
                class="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 transition-opacity hover:opacity-70"
                @click="toggleFaceMask"
              >
                <EyeOff class="size-3" />
                마스킹 해제
              </button>
              <Loader2
                v-else-if="maskingFaces"
                class="ml-auto size-3.5 animate-spin text-muted-foreground"
              />
            </div>
            <div ref="beforePanel" class="p-4">
              <ClientOnly>
                <vue-pdf-embed
                  v-if="analysis.pdfUrl"
                  :source="analysis.pdfUrl"
                  class="w-full"
                  @rendered="onPdfRendered"
                />
                <div
                  v-else
                  class="flex flex-col items-center justify-center gap-3 py-16 text-center"
                >
                  <span class="text-4xl">📄</span>
                  <p class="text-sm text-muted-foreground">
                    원본 PDF를 표시할 수 없어요.<br />새로 분석하면 PDF가 저장됩니다.
                  </p>
                </div>
                <template #fallback>
                  <div class="flex h-32 items-center justify-center">
                    <Loader2 class="size-6 animate-spin text-muted-foreground" />
                  </div>
                </template>
              </ClientOnly>
            </div>
          </div>

          <!-- After: AI 개선본 -->
          <div class="flex flex-col">
            <!-- 헤더 -->
            <div class="flex items-center gap-2 border-b border-border bg-primary/5 px-4 py-2.5">
              <span class="size-2.5 rounded-full bg-emerald-400" />
              <span class="text-xs font-bold text-primary">AFTER · AI 개선본</span>
              <button
                type="button"
                class="ml-auto flex items-center gap-1 text-[11px] font-semibold text-primary transition-opacity hover:opacity-70 disabled:opacity-40"
                :disabled="downloadingPdf"
                @click="downloadAfterPdf"
              >
                <Loader2 v-if="downloadingPdf" class="size-3 animate-spin" />
                <Download v-else class="size-3" />
                PDF 저장
              </button>
            </div>
            <!-- 섹션 페이지네이션 바 -->
            <div
              v-if="hasSectionPagination && afterSections.length > 1"
              class="flex items-center justify-between border-b border-border px-4 py-2"
            >
              <button
                type="button"
                :disabled="afterSectionIdx === 0"
                class="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                @click="prevAfterSection"
              >
                <ChevronLeft class="size-3.5" />
                이전
              </button>
              <span class="text-[11px] font-bold text-foreground">
                {{ currentAfterSection?.sectionName }}
                <span class="ml-1 font-normal text-muted-foreground"
                  >({{ afterSectionIdx + 1 }} / {{ afterSections.length }})</span
                >
              </span>
              <button
                type="button"
                :disabled="afterSectionIdx === afterSections.length - 1"
                class="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                @click="nextAfterSection"
              >
                다음
                <ChevronRight class="size-3.5" />
              </button>
            </div>
            <!-- 콘텐츠 -->
            <div ref="afterPanel" data-after-panel class="bg-muted/30 p-4">
              <!-- 섹션 페이지네이션 모드 -->
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div
                v-if="hasSectionPagination && currentAfterHtml"
                class="after-html-viewer mx-auto rounded-lg bg-white px-10 py-10 shadow-sm"
                v-html="currentAfterHtml"
              />
              <!-- fallback: 구버전 afterHtml 단일 뷰 -->
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div
                v-else-if="renderedAfterHtml"
                class="after-html-viewer mx-auto rounded-lg bg-white px-10 py-10 shadow-sm"
                v-html="renderedAfterHtml"
              />
              <div
                v-else
                class="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground"
              >
                <span class="text-4xl">✨</span>
                <p class="text-sm">AI 개선본을 생성하고 있어요</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 이슈 목록 -->
      <section v-if="issues.length > 0" class="mt-8">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="text-lg font-black text-foreground">
            이슈 목록
            <span class="ml-1 text-base font-semibold text-muted-foreground"
              >({{ issues.length }}개)</span
            >
          </h2>
          <div class="flex gap-1.5">
            <button
              v-for="f in ['all', 'high', 'medium', 'low'] as const"
              :key="f"
              type="button"
              class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
              :class="
                issueFilter === f
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-muted-foreground hover:border-primary/40'
              "
              @click="issueFilter = f"
            >
              {{ f === 'all' ? '전체' : PRIORITY_STYLES[f]?.label }}
            </button>
          </div>
        </div>

        <div class="mt-4 grid gap-3">
          <div
            v-for="issue in filteredIssues"
            :key="issue.id"
            class="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div class="flex items-start gap-3">
              <span
                class="mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                :class="PRIORITY_STYLES[issue.priority]?.cls"
              >
                {{ PRIORITY_STYLES[issue.priority]?.label }}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-semibold text-muted-foreground">{{
                    issue.section
                  }}</span>
                  <ChevronRight class="size-3 text-muted-foreground/40" />
                  <span class="text-sm font-bold text-foreground">{{ issue.title }}</span>
                  <button
                    type="button"
                    class="ml-auto shrink-0 text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100"
                    @click="scrollToIssue(issue.id)"
                  >
                    After에서 보기 →
                  </button>
                </div>
                <p class="mt-1 text-sm text-muted-foreground">{{ issue.description }}</p>
                <div class="mt-3 grid gap-2 rounded-xl bg-muted/50 p-3 text-xs">
                  <div>
                    <span class="font-semibold text-muted-foreground">Before</span>
                    <p class="mt-0.5 italic text-foreground/70">"{{ issue.originalText }}"</p>
                  </div>
                  <div>
                    <span class="font-semibold text-primary">After</span>
                    <p class="mt-0.5 text-foreground">"{{ issue.improvedText }}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- 완료됐지만 결과 없는 경우 -->
    <div
      v-else-if="analysis && analysis.status === 'completed'"
      class="flex flex-col items-center justify-center py-24 text-center"
    >
      <AlertCircle class="size-12 text-destructive" />
      <p class="mt-4 text-lg font-bold text-foreground">분석 결과를 표시할 수 없어요</p>
      <p class="mt-2 text-sm text-muted-foreground">
        AI 응답이 올바르지 않아 결과 저장에 실패했어요
      </p>
      <div class="mt-6 flex gap-3">
        <AppButton v-if="analysis.pdfUrl" :disabled="retrying" @click="retryAnalysis">
          <Loader2 v-if="retrying" class="size-4 animate-spin" />
          재시도
        </AppButton>
        <NuxtLink to="/analyze">
          <AppButton variant="outline">새로 분석하기</AppButton>
        </NuxtLink>
      </div>
    </div>

    <!-- v1 결과 (하위호환) -->
    <template v-else-if="analysis?.result">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="mt-3 text-2xl font-black">{{ analysis.title }}</h1>
          <p class="mt-1 text-sm text-muted-foreground">{{ createdAtLabel }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppButton variant="outline" size="sm" @click="copyShareLink">
            <Check v-if="linkCopied" class="size-4 text-emerald-500" />
            <Link v-else class="size-4" />
            {{ linkCopied ? '복사됐어요' : '링크 복사' }}
          </AppButton>
          <AppButton variant="outline" size="sm" :disabled="toggling" @click="requestTogglePublic">
            <Unlock v-if="analysis.isPublic" class="size-4" />
            <Lock v-else class="size-4" />
            {{ analysis.isPublic ? '공개' : '비공개' }}
          </AppButton>
          <AppButton size="sm" @click="navigateTo(`/community/write?analysisId=${id}`)">
            <MessageSquare class="size-4" />커뮤니티 공유
          </AppButton>
        </div>
      </div>
      <AppCard class="mt-6">
        <h2 class="font-bold">종합 피드백</h2>
        <p class="mt-2 leading-7 text-muted-foreground">{{ analysis.result.summary }}</p>
      </AppCard>
      <section class="mt-6">
        <h2 class="text-lg font-black">개선 포인트</h2>
        <div class="mt-4 grid gap-4">
          <BeforeAfterBlock
            v-for="(s, i) in (analysis.result as any).suggestions"
            :key="i"
            :category="s.category"
            :context="s.context"
            :before="s.before"
            :after="s.after"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
/* After HTML — A4 문서 스타일 */
.after-html-viewer {
  color: #111;
  font-size: 0.875rem;
  line-height: 1.8;
}
.after-html-viewer :deep(h1) {
  font-size: 1.4rem;
  font-weight: 900;
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #111;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}
.after-html-viewer :deep(h2) {
  font-size: 1.05rem;
  font-weight: 800;
  margin-top: 1.5rem;
  margin-bottom: 0.4rem;
  color: #1a1a1a;
}
.after-html-viewer :deep(h3) {
  font-size: 0.9rem;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.25rem;
  color: #374151;
}
.after-html-viewer :deep(p) {
  margin-bottom: 0.6rem;
}
.after-html-viewer :deep(ul),
.after-html-viewer :deep(ol) {
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}
.after-html-viewer :deep(li) {
  margin-bottom: 0.2rem;
}
.after-html-viewer :deep(strong) {
  font-weight: 700;
  color: #111;
}
.after-html-viewer :deep(section),
.after-html-viewer :deep(div) {
  margin-bottom: 1rem;
}
.after-html-viewer :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.25rem 0;
}
.after-html-viewer :deep(code) {
  background: #f3f4f6;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 0.8em;
}
.after-html-viewer :deep(blockquote) {
  border-left: 3px solid #d1d5db;
  padding-left: 1rem;
  color: #6b7280;
  margin: 0.75rem 0;
}
.after-html-viewer :deep([data-issue-id]) {
  background-color: rgb(99 102 241 / 0.08);
  border-bottom: 2px solid rgb(99 102 241 / 0.5);
  cursor: pointer;
  border-radius: 2px;
  padding: 0 2px;
}
.after-html-viewer :deep([data-issue-id]:hover) {
  background-color: rgb(99 102 241 / 0.15);
}
</style>
