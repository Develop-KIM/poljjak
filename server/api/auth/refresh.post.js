import { verifyRefreshToken, signAccessToken } from '~/server/utils/jwt'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refreshToken')

  if (!refreshToken) {
    throw createError({
      statusCode: 400,
      message: '리프레시 토큰이 없습니다.',
    })
  }

  const decoded = verifyRefreshToken(refreshToken)

  if (!decoded) {
    // 만료된 토큰 삭제
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    })

    throw createError({
      statusCode: 401,
      message: '만료된 리프레시 토큰입니다.',
    })
  }

  // DB에서 토큰 확인
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  })

  if (!tokenRecord) {
    throw createError({
      statusCode: 401,
      message: '유효하지 않은 리프레시 토큰입니다.',
    })
  }

  // 만료 시간 확인
  if (tokenRecord.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    })

    throw createError({
      statusCode: 401,
      message: '만료된 리프레시 토큰입니다.',
    })
  }

  const newAccessToken = signAccessToken({
    userId: tokenRecord.user.id,
    publicId: tokenRecord.user.publicId,
  })

  setCookie(event, 'accessToken', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  })

  return { success: true }
})
