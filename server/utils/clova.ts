import { $fetch } from 'ofetch'
import { buildAnalysisPrompt, type JobRole, type Seniority } from './prompts'

// v1 결과 포맷 (하위호환)
export interface AnalysisResult {
  scores: Array<{
    title: string
    score: number
    comment: string
    improvement: string
  }>
  summary: string
  suggestions: Array<{
    category: string
    context: string
    before: string
    after: string
  }>
}

// v2 결과 포맷
export interface AnalysisIssue {
  id: string
  priority: 'high' | 'medium' | 'low'
  section: string
  title: string
  description: string
  originalText: string
  improvedText: string
}

export interface AnalysisActionItem {
  id: string
  priority: 'high' | 'medium' | 'low'
  task: string
  linkedIssueIds: string[]
}

export interface AfterHtmlSection {
  sectionName: string
  html: string
  changes: Array<{ issueId: string; tooltip: string }>
}

export interface AnalysisResultV2 {
  summary: string
  totalScore: number
  issues: AnalysisIssue[]
  actionPlan: AnalysisActionItem[]
  afterHtmlSections: AfterHtmlSection[]
}

export type JobType = 'developer' | 'designer'

export interface AnalysisResponse {
  result: AnalysisResultV2
  tokenUsage: number
}

export interface ArticleAIResult {
  summary: string
  keyPoints: string[]
  concepts: Array<{ name: string; desc: string }>
  difficulty: string
}

export async function summarizeArticle(title: string, content: string): Promise<ArticleAIResult> {
  const apiKey = process.env.CLOVA_STUDIO_API_KEY?.trim()
  const apiUrl = process.env.CLOVA_STUDIO_API_URL

  if (!apiKey || !apiUrl) {
    throw createError({ statusCode: 500, statusMessage: 'CLOVA Studio 설정이 없어요' })
  }

  const systemPrompt = `당신은 기술 아티클 분석 전문가입니다. 제공된 기술 아티클을 분석해 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "summary": "아티클 핵심 내용 3~4문장 요약 (한국어)",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "concepts": [{"name": "개념명", "desc": "한 줄 설명"}],
  "difficulty": "입문|초급|중급|고급"
}

규칙:
- summary: 한국어, 3~4문장, 핵심 내용만
- keyPoints: 3~5개, 각 50자 이내 한국어
- concepts: 2~4개, 아티클에 등장한 핵심 기술/개념
- difficulty: 반드시 입문/초급/중급/고급 중 하나`

  const userMessage = `제목: ${title}\n\n내용:\n${content.slice(0, 3000)}`

  let response: {
    status: { code: string; message: string }
    result: {
      message: { role: string; content: string }
      inputLength?: number
      outputLength?: number
    }
  }

  try {
    response = await $fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        maxTokens: 1024,
        temperature: 0.3,
        topP: 0.8,
        stream: false,
      },
      timeout: 30000,
    })
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'AI 서버에 연결할 수 없어요' })
  }

  if (response.status.code !== '20000') {
    throw createError({ statusCode: 502, statusMessage: 'AI 요약 중 오류가 발생했어요' })
  }

  const raw = response.result.message.content.trim()
  try {
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) ?? raw.match(/({[\s\S]*})/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : raw
    return JSON.parse(jsonStr) as ArticleAIResult
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'AI 응답을 파싱할 수 없어요' })
  }
}

export async function analyzePortfolio(
  text: string,
  jobRole?: JobRole | null,
  seniority?: Seniority | null,
  additionalNote?: string
): Promise<AnalysisResponse> {
  const apiKey = process.env.CLOVA_STUDIO_API_KEY?.trim()
  const apiUrl = process.env.CLOVA_STUDIO_API_URL

  if (!apiKey || !apiUrl) {
    throw createError({ statusCode: 500, statusMessage: 'CLOVA Studio 설정이 없어요' })
  }

  const systemPrompt = buildAnalysisPrompt(jobRole, seniority)

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

  console.log(
    '[CLOVA] 분석 시작 — jobRole:',
    jobRole,
    '/ seniority:',
    seniority,
    '/ 입력 길이:',
    userMessage.length
  )

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
        maxTokens: 4096,
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
  console.log('[CLOVA] 응답 수신 — 길이:', content.length, '/ 앞 200자:', content.slice(0, 200))
  const tokenUsage = (response.result.inputLength ?? 0) + (response.result.outputLength ?? 0)

  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ?? content.match(/({[\s\S]*})/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : content
    const result = JSON.parse(jsonStr) as AnalysisResultV2
    return { result, tokenUsage }
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'AI 응답을 파싱할 수 없어요' })
  }
}
