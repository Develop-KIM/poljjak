export type PiiType = 'email' | 'phone' | 'url' | 'school' | 'gpa'

export interface DetectedPii {
  id: string
  type: PiiType
  label: string
  value: string
  replacement: string
}

const TYPE_LABELS: Record<PiiType, string> = {
  email: '이메일',
  phone: '전화번호',
  url: '링크',
  school: '학교명',
  gpa: '학점',
}

export function detectPii(html: string): DetectedPii[] {
  const textContent = html.replace(/<[^>]+>/g, ' ')
  const seen = new Set<string>()
  const items: DetectedPii[] = []
  let counter = 0

  const add = (type: PiiType, value: string) => {
    const clean = value.replace(/[.,;)'"]+$/, '').trim()
    if (clean.length < 2 || seen.has(clean)) return
    seen.add(clean)
    items.push({
      id: `pii_${counter++}`,
      type,
      label: TYPE_LABELS[type],
      value: clean,
      replacement: `[${TYPE_LABELS[type]}]`,
    })
  }

  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  for (const m of textContent.matchAll(emailRe)) add('email', m[0])

  const phoneRe = /(?:0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}/g
  for (const m of textContent.matchAll(phoneRe)) add('phone', m[0])

  const urlRe = /https?:\/\/[^\s<>"']+/g
  for (const m of textContent.matchAll(urlRe)) add('url', m[0])

  // 학교명 (XX대학교, XX대학, XX전문대학, XX고등학교 등)
  const schoolRe = /[가-힣a-zA-Z0-9]+(?:대학교|전문대학|대학|고등학교|중학교|초등학교)/g
  for (const m of textContent.matchAll(schoolRe)) add('school', m[0])

  // 학점 / GPA (3.68 / 4.5, 4.0/4.0 등)
  const gpaRe = /\d+\.\d{1,2}\s*[/／]\s*\d+(?:\.\d{1,2})?/g
  for (const m of textContent.matchAll(gpaRe)) add('gpa', m[0])

  return items
}

export function applyMasking(html: string, items: DetectedPii[], selectedIds: Set<string>): string {
  let result = html
  for (const item of items) {
    if (!selectedIds.has(item.id)) continue
    result = result.replaceAll(item.value, item.replacement)
  }
  return result
}
