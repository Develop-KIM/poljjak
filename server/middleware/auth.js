import { verifyAccessToken } from '~/server/utils/jwt'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const path = event.path

  // 인증 불필요한 경로
  const publicPaths = [
    '/api/auth/kakao/login',
    '/api/auth/kakao/token',
    '/api/auth/refresh',
    '/api/auth/logout',
  ]

  // API가 아닌 페이지 요청은 무시
  if (!path.startsWith('/api/')) {
    return
  }

  if (publicPaths.some((p) => path.startsWith(p))) {
    return
  }

  // GET /api/posts는 인증 불필요
  if (path === '/api/posts' && event.method === 'GET') {
    return
  }

  // 쿠키에서 액세스 토큰 가져오기
  const token = getCookie(event, 'accessToken')

  if (!token) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.',
    })
  }

  const decoded = verifyAccessToken(token)

  if (!decoded) {
    throw createError({
      statusCode: 401,
      message: '유효하지 않거나 만료된 토큰입니다.',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '사용자를 찾을 수 없습니다.',
    })
  }

  event.context.user = user
})
