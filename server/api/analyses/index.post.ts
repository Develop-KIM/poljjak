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
    if (error) return null
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

  const jobRole = jobRolePart?.data?.toString('utf8')?.trim() as JobRole | undefined
  const seniority = seniorityPart?.data?.toString('utf8')?.trim() as Seniority | undefined

  if (!jobRole || !VALID_JOB_ROLES.includes(jobRole)) {
    throw createError({ statusCode: 400, statusMessage: '직군을 선택해주세요' })
  }
  if (!seniority || !VALID_SENIORITIES.includes(seniority)) {
    throw createError({ statusCode: 400, statusMessage: '연차를 선택해주세요' })
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
  jobRole: JobRole,
  seniority: Seniority,
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
    const afterHtml = v2.afterHtmlSections?.map((s) => s.html).join('\n') ?? null

    await db
      .update(analyses)
      .set({
        status: 'completed',
        result,
        tokenUsage,
        issues: v2.issues ?? null,
        actionPlan: v2.actionPlan ?? null,
        afterHtml,
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId))

    await db.insert(notifications).values({
      userId,
      actorId: userId,
      type: 'analysis',
      referenceId: analysisId,
      linkUrl: `/analysis/${analysisId}`,
    })
  } catch {
    await db
      .update(analyses)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(analyses.id, analysisId))
  }
}
