import { extractText, getDocumentProxy } from 'unpdf'
import { PDFDocument } from 'pdf-lib'

export async function mergePdfs(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length === 1) return buffers[0]!
  const merged = await PDFDocument.create()
  for (const buf of buffers) {
    const src = await PDFDocument.load(buf)
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
  }
  const bytes = await merged.save()
  return Buffer.from(bytes)
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))

  if (pdf.numPages > 50) {
    throw createError({ statusCode: 400, statusMessage: '50페이지 이하의 PDF만 분석할 수 있어요' })
  }

  const { text } = await extractText(pdf, { mergePages: true })
  const result = (Array.isArray(text) ? text.join('\n') : text).trim()

  if (!result) {
    throw createError({
      statusCode: 422,
      statusMessage:
        '텍스트를 추출할 수 없어요. 이미지 스캔 PDF가 아닌 텍스트 선택이 가능한 PDF를 올려주세요',
    })
  }

  // CLOVA 컨텍스트 초과 방지 — 최대 12,000자
  return result.slice(0, 12000)
}
