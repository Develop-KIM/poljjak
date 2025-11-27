import { verifyRefreshToken, signAccessToken } from '~/server/utils/jwt'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  let refreshToken = getCookie(event, 'refreshToken')
  if (!refreshToken && body?.refreshToken) {
    refreshToken = body.refreshToken
  }

  if (!refreshToken) {
    throw createError({
      statusCode: 400,
      message: '리프레시 토큰이 없습니다.',
    })
  }

  const decoded = verifyRefreshToken(refreshToken)

  if (!decoded) {
    throw createError({
      statusCode: 401,
      message: '유효하지 않은 리프레시 토큰입니다.',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  })

  if (!user || user.refreshToken !== refreshToken) {
    throw createError({
      statusCode: 401,
      message: '리프레시 토큰이 일치하지 않습니다.',
    })
  }

  const newAccessToken = signAccessToken({
    userId: user.id,
    publicId: user.publicId,
  })

  if (getCookie(event, 'refreshToken')) {
    setCookie(event, 'accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    })
    return { success: true }
  }

  return { accessToken: newAccessToken }
})
