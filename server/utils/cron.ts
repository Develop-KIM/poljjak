import type { H3Event } from 'h3'

export function requireCronAuth(event: H3Event) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    throw createError({ statusCode: 500, statusMessage: 'CRON_SECRET 환경변수가 필요해요' })
  }

  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
