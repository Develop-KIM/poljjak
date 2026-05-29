import { eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../utils/auth'
import { extractPdfText } from '../../utils/pdf'
import { analyzePortfolio, type AnalysisResultV2 } from '../../utils/clova'
import type { JobRole, Seniority } from '../../utils/prompts'
import { db } from '../../db'
import { analyses, notifications } from '../../db/schema'

const MAX_FILE_BYTES = 10 * 1024 * 1024

const VALID_JOB_ROLES: JobRole[] = ['frontend', 'backend', 'fullstack', 'devops', 'ml']
const VALID_SENIORITIES: Seniority[] = ['junior', 'mid', 'senior']

async function uploadPdfToStorage(userId: string, data: Buffer): Promise<string | null> {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const filename = `${userId}/${Date.now()}.pdf`
    const { error } = await supabase.storage
      .from('portfolios')
      .upload(filename, data, { contentType: 'application/pdf' })
    if (error) {
      console.error('[PDF 업로드 실패]', error.message)
      return null
    }
    const { data: urlData } = supabase.storage.from('portfolios').getPublicUrl(filename)
    return urlData.publicUrl
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: 'PDF 파일을 첨부해주세요' })
  }

  const fileParts = parts.filter((p) => p.name === 'file')
  const notePart = parts.find((p) => p.name === 'additionalNote')
  const jobRolePart = parts.find((p) => p.name === 'jobRole')
  const seniorityPart = parts.find((p) => p.name === 'seniority')

  if (fileParts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'PDF 파일을 첨부해주세요' })
  }

  for (const fp of fileParts) {
    if (fp.type !== 'application/pdf') {
      throw createError({ statusCode: 400, statusMessage: 'PDF 파일만 업로드할 수 있어요' })
    }
    if (fp.data.length > MAX_FILE_BYTES) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fp.filename ?? '파일'} 크기가 10MB를 초과해요`,
      })
    }
  }

  const jobRoleRaw = jobRolePart?.data?.toString('utf8')?.trim() as JobRole | undefined
  const seniorityRaw = seniorityPart?.data?.toString('utf8')?.trim() as Seniority | undefined
  const seniority = seniorityRaw && VALID_SENIORITIES.includes(seniorityRaw) ? seniorityRaw : null

  // 폼에서 직접 넘기면 우선 사용, 없으면 사용자 프로필에서 fallback
  let jobRole: JobRole | null =
    jobRoleRaw && VALID_JOB_ROLES.includes(jobRoleRaw) ? jobRoleRaw : null
  if (!jobRole && user.jobType === 'developer') {
    jobRole = 'fullstack'
  }

  const additionalNote = notePart?.data?.toString('utf8')?.trim()

  // 첫 번째 PDF만 Storage에 업로드 (원본 뷰어용)
  const firstFile = fileParts[0]!
  const pdfUrl = await uploadPdfToStorage(user.id, firstFile.data)

  const texts = await Promise.all(fileParts.map((fp) => extractPdfText(fp.data)))
  const text = texts.join('\n\n--- 다음 파일 ---\n\n')

  const [analysis] = await db
    .insert(analyses)
    .values({
      userId: user.id,
      additionalNote: additionalNote || null,
      status: 'processing',
      jobRole,
      seniority,
      pdfUrl,
    })
    .returning({ id: analyses.id })

  if (!analysis) {
    throw createError({ statusCode: 500, statusMessage: '분석 요청에 실패했어요' })
  }

  runAnalysis(analysis.id, text, user.id, jobRole, seniority, additionalNote).catch(() => {})

  return { data: { id: analysis.id, status: 'processing' } }
})

async function runAnalysis(
  analysisId: string,
  text: string,
  userId: string,
  jobRole: JobRole | null,
  seniority: Seniority | null,
  additionalNote?: string
) {
  console.log(
    '[분석 시작] analysisId:',
    analysisId,
    '/ jobRole:',
    jobRole,
    '/ seniority:',
    seniority
  )
  try {
    const { result, tokenUsage } = await analyzePortfolio(text, jobRole, seniority, additionalNote)

    const v2 = result as AnalysisResultV2
    // Array.isArray 체크: CLOVA가 배열이 아닌 형태를 반환해도 TypeError 방지
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
    const err = e as { statusMessage?: string; message?: string; statusCode?: number }
    const errorMessage = err.statusMessage ?? err.message ?? String(e)
    console.error(
      '[runAnalysis 실패] analysisId:',
      analysisId,
      '/ statusCode:',
      err.statusCode,
      '/ message:',
      errorMessage,
      '/ full:',
      e
    )
    try {
      await db
        .update(analyses)
        .set({
          status: 'failed',
          result: { _error: errorMessage } as unknown as AnalysisResultV2,
          updatedAt: new Date(),
        })
        .where(eq(analyses.id, analysisId))
    } catch (dbErr) {
      console.error('[runAnalysis DB 업데이트 실패] analysisId:', analysisId, '/ error:', dbErr)
    }
    return
  }

  // 알림은 분석 완료 후 별도 처리 — 실패해도 분석 결과에 영향 없음
  db.insert(notifications)
    .values({
      userId,
      actorId: userId,
      type: 'analysis',
      referenceId: analysisId,
      linkUrl: `/analysis/${analysisId}`,
    })
    .catch((e) => console.error('[알림 삽입 실패]', e))
}
