import { $fetch } from 'ofetch'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { prompts } from '../db/schema'

export interface AnalysisResult {
  scores: Array<{
    title: string
    score: number
    comment: string // 현재 상태 평가
    improvement: string // 10점을 위한 구체적 개선 방향
  }>
  summary: string
  suggestions: Array<{
    category: string // 개선 유형 (예: "성과 수치화", "역할 명시", "기술 근거")
    context: string // 왜 이 개선이 채용에 유리한지 1문장
    before: string // 원문 또는 개선 전 패턴
    after: string // 구체적으로 개선된 버전
  }>
}

export type JobType = 'developer' | 'designer'

// DB에서 활성 프롬프트 조회
async function loadPrompt(jobType: JobType): Promise<string> {
  const [row] = await db
    .select({ content: prompts.content })
    .from(prompts)
    .where(and(eq(prompts.jobType, jobType), eq(prompts.isActive, true)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 500, statusMessage: `${jobType} 프롬프트를 찾을 수 없어요` })
  }
  return row.content
}

export interface AnalysisResponse {
  result: AnalysisResult
  tokenUsage: number
}

export async function analyzePortfolio(
  text: string,
  jobType: JobType,
  additionalNote?: string,
  customPrompt?: string // 테스트용 임시 프롬프트
): Promise<AnalysisResponse> {
  const apiKey = process.env.CLOVA_STUDIO_API_KEY?.trim()
  const apiUrl = process.env.CLOVA_STUDIO_API_URL

  if (!apiKey || !apiUrl) {
    throw createError({ statusCode: 500, statusMessage: 'CLOVA Studio 설정이 없어요' })
  }

  const systemPrompt = customPrompt ?? (await loadPrompt(jobType))

  const noteSection = additionalNote?.trim() ? `\n[추가 요청사항]\n${additionalNote.trim()}\n` : ''

  const userMessage = `다음 포트폴리오를 분석하고 JSON으로 응답하세요.
${noteSection}
[포트폴리오 내용]
${text}`

  let response: {
    status: { code: string; message: string }
    result: {
      message: { role: string; content: string }
      inputLength?: number
      outputLength?: number
    }
  }

  console.log('[CLOVA] 분석 시작 — jobType:', jobType, '/ 입력 텍스트 길이:', userMessage.length)

  try {
    response = await $fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        maxTokens: 2048,
        temperature: 0.3,
        topP: 0.8,
        stream: false,
      },
      timeout: 60000,
    })
  } catch (e: unknown) {
    const err = e as { message?: string; statusCode?: number; data?: unknown }
    console.error('[CLOVA ERROR]', err.message, err.statusCode, JSON.stringify(err.data))
    throw createError({
      statusCode: 502,
      statusMessage: 'AI 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.',
    })
  }

  if (response.status.code !== '20000') {
    throw createError({ statusCode: 502, statusMessage: 'AI 분석 중 오류가 발생했어요' })
  }

  const content = response.result.message.content.trim()
  console.log(
    '[CLOVA] 응답 수신 — 응답 길이:',
    content.length,
    '/ 앞 200자:',
    content.slice(0, 200)
  )
  // 입력+출력 토큰 합산
  const tokenUsage = (response.result.inputLength ?? 0) + (response.result.outputLength ?? 0)

  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ?? content.match(/({[\s\S]*})/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : content
    const result = JSON.parse(jsonStr) as AnalysisResult
    return { result, tokenUsage }
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'AI 응답을 파싱할 수 없어요' })
  }
}
