export async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdf-parse는 CJS 패키지라 dynamic import로 처리
  const pdfParse = await import('pdf-parse/lib/pdf-parse.js').catch(() => import('pdf-parse'))
  const fn = (pdfParse as { default?: typeof pdfParse }).default ?? pdfParse
  const data = await (fn as (buf: Buffer) => Promise<{ text: string; numpages: number }>)(buffer)

  if (data.numpages > 50) {
    throw createError({ statusCode: 400, statusMessage: '50페이지 이하의 PDF만 분석할 수 있어요' })
  }

  const text = data.text.trim()
  if (!text) {
    throw createError({
      statusCode: 422,
      statusMessage:
        '텍스트를 추출할 수 없어요. 이미지 스캔 PDF가 아닌 텍스트 선택이 가능한 PDF를 올려주세요',
    })
  }

  // CLOVA 컨텍스트 초과 방지 — 최대 12,000자
  return text.slice(0, 12000)
}
