import jwt from 'jsonwebtoken'

const config = useRuntimeConfig()

export const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
}

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiresIn,
  })
}

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch (error) {
    return null
  }
}

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.refreshTokenSecret)
  } catch (error) {
    return null
  }
}
