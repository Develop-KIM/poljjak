import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../utils/auth'
import { extractPdfText } from '../../utils/pdf'
import { analyzePortfolio } from '../../utils/clova'
import { db } from '../../db'
import { analyses } from '../../db/schema'

const MAX_FILE_BYTES = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: 'PDF 파일을 첨부해주세요' })
  }

  const filePart = parts.find((p) => p.name === 'file')
  const notePart = parts.find((p) => p.name === 'additionalNote')

  if (!filePart?.data) {
    throw createError({ statusCode: 400, statusMessage: 'PDF 파일을 첨부해주세요' })
  }
  if (filePart.type !== 'application/pdf') {
    throw createError({ statusCode: 400, statusMessage: 'PDF 파일만 업로드할 수 있어요' })
  }
  if (filePart.data.length > MAX_FILE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: '파일 크기가 10MB를 초과해요' })
  }

  const additionalNote = notePart?.data?.toString('utf8')?.trim()

  // PDF 텍스트 추출
  const text = await extractPdfText(filePart.data)

  // Supabase Storage 업로드
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const filename = `${user.id}/${Date.now()}.pdf`
  let pdfUrl = ''
  const { error: uploadError } = await supabase.storage
    .from('portfolios')
    .upload(filename, filePart.data, { contentType: 'application/pdf' })
  if (!uploadError) {
    const { data: urlData } = supabase.storage.from('portfolios').getPublicUrl(filename)
    pdfUrl = urlData.publicUrl
  }

  // CLOVA 분석 — 직군별 프롬프트 적용
  const result = await analyzePortfolio(text, user.jobType ?? null, additionalNote)

  // DB 저장
  const [analysis] = await db
    .insert(analyses)
    .values({
      userId: user.id,
      pdfUrl,
      additionalNote: additionalNote || null,
      status: 'completed',
      result,
    })
    .returning()

  if (!analysis) {
    throw createError({ statusCode: 500, statusMessage: '분석 결과 저장에 실패했어요' })
  }

  return { data: { id: analysis.id, result } }
})
