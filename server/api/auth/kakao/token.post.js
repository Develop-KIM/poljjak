import prisma from '~/server/utils/prisma'
import { signAccessToken, signRefreshToken } from '~/server/utils/jwt'
import { nanoid } from 'nanoid'

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_USER_INFO_URL = 'https://kapi.kakao.com/v2/user/me'

export default defineEventHandler(async (event) => {
  const { code, platform } = await readBody(event)

  if (!code) {
    throw createError({
      statusCode: 400,
      message: '인증 코드가 없습니다.',
    })
  }

  try {
    const accessToken = await fetchKakaoAccessToken(code)
    const kakaoUser = await fetchKakaoUserInfo(accessToken)
    const user = await findOrCreateUser(kakaoUser)
    const tokens = await generateAuthTokens(user)

    if (platform !== 'mobile') {
      setCookie(event, 'accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15,
        path: '/',
      })

      setCookie(event, 'refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })

      return {
        user: {
          publicId: user.publicId,
          name: user.nickname || user.name,
        },
      }
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        publicId: user.publicId,
        name: user.nickname || user.name,
      },
    }
  } catch (error) {
    console.error('카카오 로그인 에러:', error)
    throw createError({
      statusCode: 500,
      message: '로그인 처리 중 오류가 발생했습니다.',
    })
  }
})

async function fetchKakaoAccessToken(code) {
  const config = useRuntimeConfig()

  const response = await $fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.kakaoRestApiKey,
      redirect_uri: config.kakaoRedirectUri,
      code,
    }),
  })

  return response.access_token
}

async function fetchKakaoUserInfo(accessToken) {
  return await $fetch(KAKAO_USER_INFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

async function findOrCreateUser(kakaoUser) {
  const kakaoId = String(kakaoUser.id)

  let user = await prisma.user.findUnique({
    where: { kakaoId },
  })

  if (user) {
    return user
  }

  return await prisma.user.create({
    data: {
      kakaoId,
      publicId: nanoid(10),
      name: kakaoUser.properties?.nickname,
      nickname: kakaoUser.properties?.nickname,
    },
  })
}

async function generateAuthTokens(user) {
  const accessToken = signAccessToken({
    userId: user.id,
    publicId: user.publicId,
  })

  const refreshToken = signRefreshToken({
    userId: user.id,
    publicId: user.publicId,
  })

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { accessToken, refreshToken }
}
