<script setup lang="ts">
import { ref } from 'vue'
import { AlertCircle } from '@lucide/vue'

interface GalleryItem {
  id: string
  shareToken: string
  jobRole: string | null
  seniority: string | null
  pdfUrl: string | null
  issueCount: number
  summary: string | null
  createdAt: string
}

const props = defineProps<{ item: GalleryItem }>()

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

const thumbnailRef = ref<HTMLElement | null>(null)
const thumbnailError = ref(false)
const masked = ref(false)

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

async function applyMasking() {
  if (masked.value || !thumbnailRef.value || !props.item.pdfUrl) return
  masked.value = true

  try {
    const canvas = thumbnailRef.value.querySelector('canvas')
    if (!canvas) return

    const pdfjsLib = await import('pdfjs-dist')
    let pdf: Awaited<ReturnType<(typeof pdfjsLib)['getDocument']>['promise']>
    try {
      pdf = await pdfjsLib.getDocument(props.item.pdfUrl).promise
    } catch {
      return
    }

    const page = await pdf.getPage(1)
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

    const lines: TItem[][] = []
    for (const item of items) {
      const y = item.transform[5]!
      const line = lines.find((l) => Math.abs(l[0]!.transform[5]! - y) <= 8)
      if (line) line.push(item)
      else lines.push([item])
    }

    const toBlur = new Set<TItem>()
    for (const line of lines) {
      const hasLabel = LABEL_KEYWORDS.some((kw) => line.some((it) => it.str.includes(kw)))
      if (hasLabel) {
        for (const it of line) {
          if (!LABEL_KEYWORDS.some((kw) => it.str.includes(kw)) && it.str.trim()) toBlur.add(it)
        }
      }
      for (let i = 0; i < line.length; i++) {
        const it = line[i]!
        if (COMPANY_PREFIXES.some((p) => it.str.includes(p))) {
          toBlur.add(it)
          const next = line[i + 1]
          if (next?.str.trim()) toBlur.add(next)
        }
        if (PII_PATTERNS.some((r) => r.test(it.str))) toBlur.add(it)
      }
    }

    if (toBlur.size === 0) return

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
      ctx.fillStyle = '#1c1c1e'
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2)
    }

    const parent = canvas.parentElement
    if (parent) {
      parent.style.position = 'relative'
      parent.appendChild(overlay)
    }
  } catch {
    // 마스킹 실패는 무시
  }
}

function onThumbnailError() {
  thumbnailError.value = true
}
</script>

<template>
  <NuxtLink
    :to="`/analysis/share/${item.shareToken}`"
    class="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
  >
    <!-- PDF 썸네일 -->
    <div ref="thumbnailRef" class="relative aspect-[3/4] w-full overflow-hidden bg-muted/50">
      <ClientOnly>
        <vue-pdf-embed
          v-if="item.pdfUrl && !thumbnailError"
          :source="item.pdfUrl"
          :page="1"
          class="w-full"
          @rendered="applyMasking"
          @loading-failed="onThumbnailError"
        />
        <template #fallback>
          <div class="flex h-full items-center justify-center">
            <div class="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        </template>
      </ClientOnly>
      <div
        v-if="thumbnailError || !item.pdfUrl"
        class="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"
      >
        <AlertCircle class="size-8 opacity-30" />
        <p class="text-xs">미리보기 없음</p>
      </div>
    </div>

    <!-- 카드 정보 -->
    <div class="flex flex-1 flex-col gap-2 p-4">
      <!-- 뱃지 -->
      <div class="flex flex-wrap gap-1.5">
        <span
          v-if="item.jobRole"
          class="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground"
        >
          {{ JOB_ROLE_LABELS[item.jobRole] ?? item.jobRole }}
        </span>
        <span
          v-if="item.seniority"
          class="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground"
        >
          {{ SENIORITY_LABELS[item.seniority] ?? item.seniority }}
        </span>
      </div>

      <!-- AI 총평 -->
      <p v-if="item.summary" class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {{ item.summary }}
      </p>
      <p v-else class="text-sm text-muted-foreground/50">총평 없음</p>

      <!-- 이슈 개수 -->
      <div class="mt-auto pt-1">
        <span class="text-xs font-semibold text-muted-foreground">
          이슈 {{ item.issueCount }}개
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
