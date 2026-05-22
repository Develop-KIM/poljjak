import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../../utils/admin'
import { extractPdfText } from '../../../../utils/pdf'
import { analyzePortfolio } from '../../../../utils/clova'
import type { AnalysisResult } from '../../../../utils/clova'
import { db } from '../../../../db'
import { analyses, notifications, users } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  // 관리자 권한 확인
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })
  }

  // 분석 조회
  const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1)
  if (!analysis) {
    throw createError({ statusCode: 404, statusMessage: '분석 결과를 찾을 수 없어요' })
  }

  // failed 상태인 경우만 재시도 허용
  if (analysis.status !== 'failed') {
    throw createError({ statusCode: 400, statusMessage: 'failed 상태인 분석만 재시도할 수 있어요' })
  }

  // 사용자의 jobType 조회 (analyzePortfolio에 필요)
  const [user] = await db
    .select({ jobType: users.jobType })
    .from(users)
    .where(eq(users.id, analysis.userId))
    .limit(1)

  if (!user?.jobType) {
    throw createError({ statusCode: 400, statusMessage: '사용자의 직군 정보를 찾을 수 없어요' })
  }

  // status를 'processing'으로 업데이트
  await db
    .update(analyses)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(analyses.id, id))

  // 백그라운드에서 재분석 실행
  retryAnalysis(id, analysis.pdfUrl, analysis.userId, user.jobType, analysis.additionalNote ?? undefined).catch(() => {})

  return { data: { id, status: 'processing' } }
})

async function retryAnalysis(
  analysisId: string,
  pdfUrl: string,
  userId: string,
  jobType: 'developer' | 'designer',
  additionalNote?: string,
) {
  try {
    // PDF URL에서 파일 다운로드
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`PDF 다운로드 실패: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // PDF 텍스트 추출
    const text = await extractPdfText(buffer)

    // CLOVA 분석 실행
    const { result, tokenUsage } = await analyzePortfolio(text, jobType, additionalNote)

    // 완료 상태로 업데이트
    await db
      .update(analyses)
      .set({
        status: 'completed',
        result: result as unknown as AnalysisResult,
        tokenUsage,
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId))

    // 분석 완료 알림 발송
    await db.insert(notifications).values({
      userId,
      actorId: userId,
      type: 'analysis',
      referenceId: analysisId,
      linkUrl: `/analysis/${analysisId}`,
    })
  } catch {
    // 실패 시 failed 상태로 업데이트
    await db
      .update(analyses)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(analyses.id, analysisId))
  }
}
