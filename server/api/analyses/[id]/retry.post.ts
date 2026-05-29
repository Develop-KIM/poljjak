import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { extractPdfText } from '../../../utils/pdf'
import { analyzePortfolio, type AnalysisResultV2 } from '../../../utils/clova'
import type { JobRole, Seniority } from '../../../utils/prompts'
import { db } from '../../../db'
import { analyses } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1)

  if (!analysis) throw createError({ statusCode: 404, statusMessage: '분석 결과를 찾을 수 없어요' })
  if (analysis.userId !== user.id)
    throw createError({ statusCode: 403, statusMessage: '권한이 없어요' })
  if (analysis.status === 'processing')
    throw createError({ statusCode: 409, statusMessage: '이미 분석 중이에요' })
  if (!analysis.pdfUrl)
    throw createError({ statusCode: 400, statusMessage: '원본 PDF가 없어 재시도할 수 없어요' })

  // 상태를 processing으로 초기화
  await db
    .update(analyses)
    .set({
      status: 'processing',
      result: null,
      issues: null,
      actionPlan: null,
      afterHtml: null,
      updatedAt: new Date(),
    })
    .where(eq(analyses.id, id))

  // PDF 다운로드 후 백그라운드에서 재분석
  runRetry(
    id,
    analysis.pdfUrl,
    analysis.jobRole as JobRole | null,
    analysis.seniority as Seniority | null,
    analysis.additionalNote ?? undefined
  ).catch(() => {})

  return { data: { id, status: 'processing' } }
})

async function runRetry(
  analysisId: string,
  pdfUrl: string,
  jobRole: JobRole | null,
  seniority: Seniority | null,
  additionalNote?: string
) {
  try {
    const res = await $fetch<ArrayBuffer>(pdfUrl, { responseType: 'arrayBuffer' })
    const buffer = Buffer.from(res)
    const text = await extractPdfText(buffer)
    const { result, tokenUsage } = await analyzePortfolio(text, jobRole, seniority, additionalNote)

    const v2 = result as AnalysisResultV2
    const afterHtml = Array.isArray(v2.afterHtmlSections)
      ? v2.afterHtmlSections.map((s) => s.html).join('\n')
      : null

    await db
      .update(analyses)
      .set({
        status: 'completed',
        result,
        tokenUsage,
        issues: Array.isArray(v2.issues) ? v2.issues : null,
        actionPlan: Array.isArray(v2.actionPlan) ? v2.actionPlan : null,
        afterHtml,
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId))
  } catch (e) {
    const err = e as { statusMessage?: string; message?: string }
    await db
      .update(analyses)
      .set({
        status: 'failed',
        result: {
          _error: err.statusMessage ?? err.message ?? String(e),
        } as unknown as AnalysisResultV2,
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId))
  }
}
