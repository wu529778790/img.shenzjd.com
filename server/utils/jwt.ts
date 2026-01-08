import { jwtVerify, SignJWT } from 'jose'

export interface JWTPayload {
  id: number
  login: string
  email: string
  avatarUrl: string
}

/**
 * 获取 JWT 密钥
 */
function getJWTSecret(): string {
  const config = useRuntimeConfig()
  const secret = config.jwt.secret

  if (!secret) {
    throw new Error(
      '未配置 JWT_SECRET 环境变量！\n' +
      '请在 .env 文件中设置: JWT_SECRET=your-strong-secret-key\n' +
      '生成强密钥命令: openssl rand -base64 32'
    )
  }

  return secret
}

/**
 * 生成 JWT Token
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(getJWTSecret())

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
    const secret = new TextEncoder().encode(getJWTSecret())

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
