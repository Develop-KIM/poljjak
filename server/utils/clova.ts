import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface AnalysisResult {
  scores: Array<{ title: string; score: number; comment: string }>
  summary: string
  suggestions: Array<{ before: string; after: string }>
}

type JobType = 'developer' | 'designer' | null

function loadPrompt(jobType: JobType): string {
  const filename =
    jobType === 'developer'
      ? 'analysis-developer.txt'
      : jobType === 'designer'
        ? 'analysis-designer.txt'
        : 'analysis-general.txt'

  const promptPath = resolve(process.cwd(), 'server/prompts', filename)
  return readFileSync(promptPath, 'utf-8').trim()
}

export async function analyzePortfolio(
  text: string,
  jobType: JobType,
  additionalNote?: string
): Promise<AnalysisResult> {
  const apiKey = process.env.CLOVA_STUDIO_API_KEY?.trim()
  const apiUrl = process.env.CLOVA_STUDIO_API_URL

  if (!apiKey || !apiUrl) {
    throw createError({ statusCode: 500, statusMessage: 'CLOVA Studio 설정이 없어요' })
  }

  const systemPrompt = loadPrompt(jobType)

  const noteSection = additionalNote?.trim() ? `\n[추가 요청사항]\n${additionalNote.trim()}\n` : ''

  const userMessage = `다음 포트폴리오를 분석하고 JSON으로 응답하세요.
${noteSection}
[포트폴리오 내용]
${text}`

  let response: {
    status: { code: string; message: string }
    result: { message: { role: string; content: string } }
  }

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

  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ?? content.match(/({[\s\S]*})/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : content
    return JSON.parse(jsonStr) as AnalysisResult
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'AI 응답을 파싱할 수 없어요' })
  }
}
