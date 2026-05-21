import type { PostCategory } from '../validation/posts'

export const postCategoryLabels = {
  feedback: '피드백',
  project: '프로젝트 모집',
  study: '스터디 모집',
} as const satisfies Record<PostCategory, string>

export function getAuthorInitial(nickname: string): string {
  return Array.from(nickname.trim())[0] ?? '?'
}

export function getAvatarUrl(avatarUrl: string | null | undefined, nickname: string): string {
  if (avatarUrl) return avatarUrl
  const seed = encodeURIComponent(nickname.trim() || '?')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=6366f1&textColor=ffffff`
}

export function formatCommunityDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHour = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function createPostExcerpt(body: string): string {
  return body.replace(/\s+/g, ' ').trim().slice(0, 90)
}
