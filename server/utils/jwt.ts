import { jwtVerify, SignJWT } from 'jose'

export interface JWTPayload {
  id: number
  login: string
  email: string
  avatarUrl: string
}

/**
 * 生成 JWT Token
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.jwt.secret)

  const jwt = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setSubject(payload.id.toString())
    .sign(secret)

  return jwt
}

/**
 * 验证 JWT Token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const config = useRuntimeConfig()
    const secret = new TextEncoder().encode(config.jwt.secret)

    const { payload } = await jwtVerify(token, secret)

    return {
      id: Number(payload.id),
      login: String(payload.login || ''),
      email: String(payload.email || ''),
      avatarUrl: String(payload.avatarUrl || '')
    }
  } catch (error) {
    return null
  }
}

/**
 * 从请求头中提取 Token
 */
export function getTokenFromHeader(event: any): string | null {
  const headers = getHeaders(event)
  const authHeader = headers.authorization || headers['authorization']

  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return parts[1] || null
}

/**
 * 从 Cookie 中获取 Token
 */
export function getTokenFromCookie(event: any): string | null {
  const cookies = parseCookies(event)
  return cookies.auth_token || null
}
