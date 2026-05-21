import type { PostCategory } from '../validation/posts'

export const postCategoryLabels = {
  feedback: '피드백',
  project: '프로젝트 모집',
  study: '스터디 모집',
} as const satisfies Record<PostCategory, string>

export function getAuthorInitial(nickname: string): string {
  return Array.from(nickname.trim())[0] ?? '?'
}

export function formatCommunityDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function createPostExcerpt(body: string): string {
  return body.replace(/\s+/g, ' ').trim().slice(0, 90)
}
