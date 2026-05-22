import type { H3Event } from 'h3'
import { requireAuth } from './auth'

// 어드민 권한 확인 — 비어드민 시 403 throw
export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '관리자 권한이 필요해요' })
  }
  return user
}
