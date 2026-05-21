export interface AnalysisResult {
  scores: Array<{ title: string; score: number; comment: string }>
  summary: string
  suggestions: Array<{ before: string; after: string }>
}

const SYSTEM_PROMPT = `당신은 IT 채용 전문가이자 포트폴리오 분석 전문가입니다.
사용자가 제공하는 포트폴리오 텍스트를 분석하고, 지정된 JSON 형식으로만 응답하세요.
JSON 이외의 텍스트는 절대 출력하지 마세요.`

const SCORE_CRITERIA = `[분석 항목 10가지 — 각 1~10점 정수]
1. 프로젝트 설명 명확성 — 문제·행동·결과가 명확히 서술됐는지
2. 성과 표현 — 수치·비교·임팩트가 포함됐는지
3. 구조와 흐름 — 읽기 편하고 논리적 순서인지
4. 기술 스택 적합성 — 기술 선택 근거와 깊이
5. 역할과 기여도 — 본인의 구체적 역할 명시 여부
6. 문제 해결 능력 — 도전 과제와 해결 방식 서술
7. 커뮤니케이션 역량 — 표현의 명확성과 간결성
8. 포트폴리오 완성도 — 전체적인 완성도와 통일성
9. 차별화 포인트 — 다른 지원자 대비 강점
10. 취업 준비도 — 실제 채용에서 통과 가능한 수준인지`

const RESPONSE_SCHEMA = `[응답 JSON — 이 형식 외 다른 텍스트 금지]
{
  "scores": [{"title": "항목명", "score": 점수, "comment": "한국어 1~2문장"}],
  "summary": "종합 피드백 한국어 3~5문장",
  "suggestions": [{"before": "원문 또는 패턴", "after": "개선된 버전"}]
}`

export async function analyzePortfolio(
  text: string,
  additionalNote?: string
): Promise<AnalysisResult> {
  const apiKey = process.env.CLOVA_STUDIO_API_KEY?.trim()
  const apiUrl = process.env.CLOVA_STUDIO_API_URL

  if (!apiKey || !apiUrl) {
    throw createError({ statusCode: 500, statusMessage: 'CLOVA Studio 설정이 없어요' })
  }

  const noteSection = additionalNote?.trim() ? `\n[추가 요청사항]\n${additionalNote.trim()}\n` : ''

  const userMessage = `다음 포트폴리오를 분석하고 JSON으로 응답하세요.
${noteSection}
${SCORE_CRITERIA}

${RESPONSE_SCHEMA}

[포트폴리오 내용]
${text}`

  const response = await $fetch<{
    status: { code: string; message: string }
    result: { message: { role: string; content: string } }
  }>(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      maxTokens: 2048,
      temperature: 0.3,
      topP: 0.8,
      stream: false,
    },
  })

  if (response.status.code !== '20000') {
    throw createError({ statusCode: 502, statusMessage: 'AI 분석 중 오류가 발생했어요' })
  }

  const content = response.result.message.content.trim()

  try {
    // JSON 블록이 있으면 추출
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ?? content.match(/({[\s\S]*})/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : content
    return JSON.parse(jsonStr) as AnalysisResult
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'AI 응답을 파싱할 수 없어요' })
  }
}
