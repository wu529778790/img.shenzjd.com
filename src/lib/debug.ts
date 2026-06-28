/**
 * 调试工具
 * 仅在开发环境输出日志
 */

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * 开发环境日志
 */
export function debugLog(...args: unknown[]): void {
  if (isDevelopment) {
    console.log(...args)
  }
}

/**
 * 开发环境警告
 */
export function debugWarn(...args: unknown[]): void {
  if (isDevelopment) {
    console.warn(...args)
  }
}

/**
 * 开发环境错误
 */
export function debugError(...args: unknown[]): void {
  if (isDevelopment) {
    console.error(...args)
  }
}
