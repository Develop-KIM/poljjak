import { eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../utils/auth'
import { extractPdfText } from '../../utils/pdf'
import { analyzePortfolio } from '../../utils/clova'
import { db } from '../../db'
import { analyses, notifications } from '../../db/schema'

const MAX_FILE_BYTES = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: 'PDF 파일을 첨부해주세요' })
  }

  const fileParts = parts.filter((p) => p.name === 'file')
  const notePart = parts.find((p) => p.name === 'additionalNote')

  if (fileParts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'PDF 파일을 첨부해주세요' })
  }

  for (const fp of fileParts) {
    if (fp.type !== 'application/pdf') {
      throw createError({ statusCode: 400, statusMessage: 'PDF 파일만 업로드할 수 있어요' })
    }
    if (fp.data.length > MAX_FILE_BYTES) {
      throw createError({ statusCode: 400, statusMessage: `${fp.filename ?? '파일'} 크기가 10MB를 초과해요` })
    }
  }

  const additionalNote = notePart?.data?.toString('utf8')?.trim()

  // 모든 PDF 텍스트 추출 + 첫 번째 파일 Storage 업로드
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const firstFile = fileParts[0]!

  const [texts, pdfUrl] = await Promise.all([
    Promise.all(fileParts.map((fp) => extractPdfText(fp.data))),
    (async () => {
      const filename = `${user.id}/${Date.now()}.pdf`
      const { error } = await supabase.storage
        .from('portfolios')
        .upload(filename, firstFile.data, { contentType: 'application/pdf' })
      if (error) return ''
      const { data } = supabase.storage.from('portfolios').getPublicUrl(filename)
      return data.publicUrl
    })(),
  ])

  // 여러 파일이면 구분선으로 텍스트 합치기
  const text = texts.join('\n\n--- 다음 파일 ---\n\n')

  // pending 상태로 즉시 저장 후 응답 반환
  const [analysis] = await db
    .insert(analyses)
    .values({
      userId: user.id,
      pdfUrl,
      additionalNote: additionalNote || null,
      status: 'processing',
    })
    .returning({ id: analyses.id })

  if (!analysis) {
    throw createError({ statusCode: 500, statusMessage: '분석 요청에 실패했어요' })
  }

  // 백그라운드에서 CLOVA 분석 실행
  runAnalysis(analysis.id, text, user.id, user.jobType ?? null, additionalNote).catch(() => {})

  return { data: { id: analysis.id, status: 'processing' } }
})

async function runAnalysis(
  analysisId: string,
  text: string,
  userId: string,
  jobType: 'developer' | 'designer' | null,
  additionalNote?: string,
) {
  try {
    const result = await analyzePortfolio(text, jobType, additionalNote)

    await db
      .update(analyses)
      .set({ status: 'completed', result, updatedAt: new Date() })
      .where(eq(analyses.id, analysisId))

    // 분석 완료 알림
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
