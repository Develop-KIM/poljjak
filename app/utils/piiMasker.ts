export type PiiType = 'email' | 'phone' | 'url'

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
}

export function detectPii(html: string): DetectedPii[] {
  const textContent = html.replace(/<[^>]+>/g, ' ')
  const seen = new Set<string>()
  const items: DetectedPii[] = []
  let counter = 0

  const add = (type: PiiType, value: string) => {
    const clean = value.replace(/[.,;)'"]+$/, '')
    if (clean.length < 4 || seen.has(clean)) return
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

  // 02-XXXX-XXXX, 010-XXXX-XXXX, 0X0-XXX-XXXX 등
  const phoneRe = /(?:0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}/g
  for (const m of textContent.matchAll(phoneRe)) add('phone', m[0])

  const urlRe = /https?:\/\/[^\s<>"']+/g
  for (const m of textContent.matchAll(urlRe)) add('url', m[0])

  return items
}

export function applyMasking(html: string, items: DetectedPii[], selectedIds: Set<string>): string {
  let result = html
  for (const item of items) {
    if (!selectedIds.has(item.id)) continue
    // HTML 텍스트 노드와 속성값(href 등) 모두 치환
    result = result.replaceAll(item.value, item.replacement)
  }
  return result
}
