import { jwtVerify, SignJWT } from 'jose'
import crypto from 'crypto'

export interface JWTPayload {
  id: number
  login: string
  email: string
  avatarUrl: string
}

/**
 * 获取或生成 JWT 密钥
 */
function getJWTSecret(): string {
  const config = useRuntimeConfig()
  let secret = config.jwt.secret

  // 如果没有配置密钥
  if (!secret) {
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction) {
      // 生产环境必须配置密钥
      throw new Error(
        '生产环境必须配置 JWT_SECRET 环境变量！\n' +
        '请在 .env 文件中设置: JWT_SECRET=your-strong-secret-key\n' +
        '生成强密钥: openssl rand -base64 32'
      )
    }

    // 开发环境自动生成临时密钥
    secret = crypto.randomBytes(32).toString('base64')
    console.warn(
      '\n⚠️  [警告] 未配置 JWT_SECRET，使用自动生成的临时密钥\n' +
      '   临时密钥仅在本次运行有效，重启服务后会重新生成\n' +
      '   建议在 .env 文件中配置固定的 JWT_SECRET 以保持登录状态\n' +
      '   生成命令: openssl rand -base64 32\n'
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
