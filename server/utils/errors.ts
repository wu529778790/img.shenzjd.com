import { createError, type H3Error } from 'h3'

/**
 * 创建API错误对象
 * @param statusCode HTTP状态码
 * @param message 错误信息
 * @param details 错误详情
 * @returns 标准化的错误对象
 */
export function createApiError(
  statusCode: number,
  message: string,
  details?: any
): H3Error {
  return createError({
    statusCode,
    statusMessage: getStatusMessage(statusCode),
    message,
    data: details ? { details } : undefined
  })
}

/**
 * 获取HTTP状态码对应的状态消息
 * @param statusCode HTTP状态码
 * @returns 状态消息
 */
function getStatusMessage(statusCode: number): string {
  const statusMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  }
  return statusMessages[statusCode] || 'Unknown Error'
}

/**
 * 认证错误
 * @param message 错误信息
 * @returns 401 Unauthorized错误
 */
export function createAuthError(message: string = '未授权访问') {
  return createApiError(401, message)
}

/**
 * 参数错误
 * @param message 错误信息
 * @returns 400 Bad Request错误
 */
export function createBadRequestError(message: string = '参数错误') {
  return createApiError(400, message)
}

/**
 * 禁止访问错误
 * @param message 错误信息
 * @returns 403 Forbidden错误
 */
export function createForbiddenError(message: string = '禁止访问') {
  return createApiError(403, message)
}

/**
 * 资源不存在错误
 * @param message 错误信息
 * @returns 404 Not Found错误
 */
export function createNotFoundError(message: string = '资源不存在') {
  return createApiError(404, message)
}

/**
 * 服务器内部错误
 * @param message 错误信息
 * @param details 错误详情
 * @returns 500 Internal Server Error错误
 */
export function createServerError(message: string = '服务器内部错误', details?: any) {
  return createApiError(500, message, details)
}
