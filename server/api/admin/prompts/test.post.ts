import { requireAdmin } from '../../../utils/admin'
import { analyzePortfolio } from '../../../utils/clova'
import { extractPdfText } from '../../../utils/pdf'

const MAX_FILE_BYTES = 10 * 1024 * 1024

// POST /api/admin/prompts/test
// PDF 파일을 업로드해 텍스트 추출 후 임시 프롬프트로 CLOVA 호출 (DB 저장 없음)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  if (!parts)
    throw createError({ statusCode: 400, statusMessage: 'PDF 파일과 프롬프트를 전달해주세요' })

  const filePart = parts.find((p) => p.name === 'file')
  const jobTypePart = parts.find((p) => p.name === 'jobType')
  const promptPart = parts.find((p) => p.name === 'promptContent')

  if (!filePart?.data)
    throw createError({ statusCode: 400, statusMessage: 'PDF 파일을 첨부해주세요' })
  if (filePart.type !== 'application/pdf')
    throw createError({ statusCode: 400, statusMessage: 'PDF 파일만 가능해요' })
  if (filePart.data.length > MAX_FILE_BYTES)
    throw createError({ statusCode: 400, statusMessage: '파일 크기가 10MB를 초과해요' })

  const jobType = jobTypePart?.data?.toString('utf8')?.trim()
  if (jobType !== 'developer' && jobType !== 'designer') {
    throw createError({
      statusCode: 400,
      statusMessage: 'jobType은 developer 또는 designer여야 해요',
    })
  }

  const promptContent = promptPart?.data?.toString('utf8')?.trim()
  if (!promptContent)
    throw createError({ statusCode: 400, statusMessage: '프롬프트 내용을 입력해주세요' })

  // PDF 텍스트 추출
  const text = await extractPdfText(filePart.data)

  // 임시 프롬프트로 CLOVA 호출 (DB 저장 없음)
  const { result, tokenUsage } = await analyzePortfolio(text, null, null, promptContent)

  return { data: { result, tokenUsage } }
})
