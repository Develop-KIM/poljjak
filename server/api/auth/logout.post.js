import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refreshToken')

  if (refreshToken) {
    try {
      // RefreshToken 테이블에서 삭제
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      })
    } catch (error) {
      console.error('토큰 삭제 실패:', error)
    }
  }

  deleteCookie(event, 'accessToken')
  deleteCookie(event, 'refreshToken')

  return { success: true }
})
