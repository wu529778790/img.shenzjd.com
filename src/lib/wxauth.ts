/**
 * wx-auth 客户端层
 *
 * wx-auth（https://wx-auth.shenzjd.com）是登录态与 GitHub 凭证的唯一持有方：
 * - 登录态 = 根域共享 Cookie `wxauth-token`（*.shenzjd.com 全部子站可读）
 * - GitHub 能力按「状态判定 → 按需引导 → 领 token 直传」三段交互
 *
 * 红线：
 * - installation token 只存内存，不落 localStorage / 数据库
 * - token 缓存不得超过其 expiresAt（剩余 <30min 即重领）
 * - setups 结果可按会话缓存，但引导（bind/install/setup）完成后必须重查
 */

import { debugLog } from './debug'

export const WXAUTH_BASE = 'https://wx-auth.shenzjd.com'
export const WXAUTH_TOKEN_COOKIE = 'wxauth-token'
export const FIGUREBED_CAPABILITY = 'figurebed'
/**
 * 图床能力的目标仓库（与站点域名一致，wx-auth setup 以此建仓/判定就绪）。
 * 注意：repo 必须固定传同一个值，换名重调会切换目标仓库。
 */
export const FIGUREBED_REPO = 'img.shenzjd.com'

/** token 剩余有效期低于该值时重新领取（毫秒） */
const TOKEN_REFRESH_MARGIN_MS = 30 * 60 * 1000

export type GithubActionType = 'bind' | 'install' | 'setup' | 'ready'

export interface WxAuthGithubUser {
  login: string
  avatar?: string
}

export interface FigurebedCapability {
  label?: string
  status: 'active' | 'not_setup' | string
  repo?: string
}

export interface GithubSetupsResponse {
  bound: boolean
  github?: WxAuthGithubUser
  installation?: { installed: boolean; installationId?: number }
  credentialStatus?: 'ok' | 'refresh_invalid' | 'uninstalled' | string
  capabilities?: { figurebed?: FigurebedCapability }
}

export interface CapabilityToken {
  token: string
  expiresAt: string
  owner: string
  repo: string
  permission?: string
}

export interface SetupResult {
  capability: string
  /** active=就绪；pending_grant=需要用户去 GitHub 完成仓库授权（用 installUrl） */
  status: 'active' | 'pending_grant' | string
  repo?: string
  created?: boolean
  /** pending_grant 时下发：新窗口打开，用户完成 GitHub 仓库勾选后回来重新调 setup */
  installUrl?: string
  /** pending_grant 时展示给用户的提示文案 */
  message?: string
}

export interface AuthCheckResult {
  loggedIn: boolean
  user?: { id?: string | number; nickname?: string; avatar?: string }
}

/** 引导动作（纯数据，便于单测） */
export type GithubAction =
  | { type: 'bind' }
  | { type: 'install' }
  | { type: 'setup'; capability: string }
  | { type: 'ready'; owner: string; repo: string }

/** wx-auth 交互失败，kind 用于映射引导/重试动作 */
export class WxAuthError extends Error {
  kind: 'unauthorized' | 'rate_limited' | 'upstream' | 'network' | 'github_action'
  /** 409 时 wx-auth 下发的动作（bind / install / setup / grant） */
  action?: 'bind' | 'install' | 'setup' | 'grant'
  /** 409 action=grant 时下发的 GitHub 授权链接 */
  installUrl?: string

  constructor(
    kind: WxAuthError['kind'],
    message: string,
    action?: WxAuthError['action'],
    installUrl?: string
  ) {
    super(message)
    this.name = 'WxAuthError'
    this.kind = kind
    this.action = action
    this.installUrl = installUrl
  }
}

export function readTokenCookie(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${WXAUTH_TOKEN_COOKIE}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]) : ''
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/** 将非 2xx 响应映射为带引导动作的 WxAuthError */
async function throwForResponse(res: Response, context: string): Promise<never> {
  let payload: { message?: string; data?: { action?: string; installUrl?: string } } = {}
  try {
    payload = await res.json()
  } catch {
    // 非 JSON 响应体，保留状态码语义即可
  }
  const action = payload.data?.action as WxAuthError['action'] | undefined
  const installUrl =
    typeof payload.data?.installUrl === 'string' ? payload.data.installUrl : undefined
  if (res.status === 401) {
    throw new WxAuthError('unauthorized', `${context}: ${payload.message || '登录态失效'}`, action, installUrl)
  }
  if (res.status === 409 && action) {
    throw new WxAuthError('github_action', `${context}: ${payload.message || action}`, action, installUrl)
  }
  if (res.status === 429) {
    throw new WxAuthError('rate_limited', `${context}: 请求过于频繁，请稍后重试`)
  }
  if (res.status >= 502 && res.status <= 503) {
    throw new WxAuthError('upstream', `${context}: wx-auth/GitHub 侧异常，请稍后重试`)
  }
  throw new WxAuthError('upstream', `${context}: ${payload.message || `请求失败 (${res.status})`}`)
}

/**
 * 识别 wx-auth 响应体中的业务错误。
 * 注意：wx-auth 各端点行为不一致——setups 未登录时返回 HTTP 200 + {error:"unauthorized"}，
 * token/setup 未登录时返回 HTTP 401 + {error:true, statusCode:401}，必须按响应体兜底。
 */
function classifyBodyError(body: { error?: unknown; message?: string; statusCode?: number }): WxAuthError | null {
  const err = body?.error
  if (err === 'unauthorized') {
    return new WxAuthError('unauthorized', body.message || '登录态失效，请重新登录')
  }
  if (err === true && body.statusCode === 401) {
    return new WxAuthError('unauthorized', body.message || '登录态失效，请重新登录')
  }
  if (err) {
    return new WxAuthError('upstream', body.message || 'wx-auth 返回错误，请稍后重试')
  }
  return null
}

/** 登录态校验：读 Cookie 后调 /api/auth/check */
export async function checkAuth(token?: string): Promise<AuthCheckResult> {
  const t = token ?? readTokenCookie()
  if (!t) return { loggedIn: false }
  try {
    const res = await fetch(`${WXAUTH_BASE}/api/auth/check`, {
      headers: authHeaders(t),
    })
    if (res.status === 401) return { loggedIn: false }
    if (!res.ok) throw await throwForResponse(res, '登录校验')
    const data = (await res.json()) as { authenticated?: boolean; user?: AuthCheckResult['user'] }
    if (data.authenticated === false) return { loggedIn: false }
    return { loggedIn: true, user: data.user }
  } catch (err) {
    if (err instanceof WxAuthError) throw err
    throw new WxAuthError('network', `登录校验失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/** GET /api/github/setups（原始请求，无缓存） */
export async function fetchGithubSetups(token: string): Promise<GithubSetupsResponse> {
  let res: Response
  try {
    res = await fetch(`${WXAUTH_BASE}/api/github/setups`, { headers: authHeaders(token) })
  } catch (err) {
    throw new WxAuthError('network', `GitHub 状态查询失败: ${err instanceof Error ? err.message : String(err)}`)
  }
  if (!res.ok) await throwForResponse(res, 'GitHub 状态查询')
  const body = (await res.json()) as GithubSetupsResponse & { error?: unknown; message?: string; statusCode?: number }
  const bodyErr = classifyBodyError(body)
  if (bodyErr) throw bodyErr
  return body
}

/** POST /api/github/setup（幂等；未开通时真实建仓，需数秒）。repo 固定传站点域名命名 */
export async function setupCapability(
  token: string,
  capability: string = FIGUREBED_CAPABILITY,
  repo: string = FIGUREBED_REPO
): Promise<SetupResult> {
  let res: Response
  try {
    res = await fetch(`${WXAUTH_BASE}/api/github/setup`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ capability, repo }),
    })
  } catch (err) {
    throw new WxAuthError('network', `开通能力失败: ${err instanceof Error ? err.message : String(err)}`)
  }
  if (!res.ok) await throwForResponse(res, '开通能力')
  const body = (await res.json()) as SetupResult & { error?: unknown; message?: string; statusCode?: number }
  const bodyErr = classifyBodyError(body)
  if (bodyErr) throw bodyErr
  return body
}

/** POST /api/github/token（原始请求，无缓存） */
export async function requestCapabilityToken(
  token: string,
  capability: string = FIGUREBED_CAPABILITY
): Promise<CapabilityToken> {
  let res: Response
  try {
    res = await fetch(`${WXAUTH_BASE}/api/github/token`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ capability }),
    })
  } catch (err) {
    throw new WxAuthError('network', `获取上传凭证失败: ${err instanceof Error ? err.message : String(err)}`)
  }
  if (!res.ok) await throwForResponse(res, '获取上传凭证')
  const body = (await res.json()) as CapabilityToken & { error?: unknown; message?: string; statusCode?: number }
  const bodyErr = classifyBodyError(body)
  if (bodyErr) throw bodyErr
  return body
}

// —— 会话级缓存（仅内存） ——

let setupsCache: { data: GithubSetupsResponse } | null = null
let setupsInFlight: Promise<GithubSetupsResponse> | null = null
let tokenCache: CapabilityToken | null = null
let tokenInFlight: Promise<CapabilityToken> | null = null

export function invalidateGithubStatus(): void {
  setupsCache = null
  setupsInFlight = null
}

export function invalidateCapabilityToken(): void {
  tokenCache = null
  tokenInFlight = null
}

/**
 * setups 按会话缓存；skipCache 用于引导完成后强制重查。
 * 并发去重：多个消费方同时首次调用时共享同一条在途请求，避免重复打接口。
 */
export async function getGithubSetups(token: string, skipCache = false): Promise<GithubSetupsResponse> {
  if (!skipCache && setupsCache) return setupsCache.data
  if (!skipCache && setupsInFlight) return setupsInFlight
  const inFlight = fetchGithubSetups(token)
    .then((data) => {
      debugLog('[WxAuth] setups response:', data)
      setupsCache = { data }
      return data
    })
    .finally(() => {
      if (setupsInFlight === inFlight) setupsInFlight = null
    })
  if (!skipCache) setupsInFlight = inFlight
  return inFlight
}

/** 领取上传凭证（会话内复用，临近过期 <30min 自动重领；并发去重） */
export async function getCapabilityToken(
  token: string,
  capability: string = FIGUREBED_CAPABILITY
): Promise<CapabilityToken> {
  if (tokenCache) {
    const expiresAt = Date.parse(tokenCache.expiresAt)
    if (Number.isFinite(expiresAt) && expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS) {
      return tokenCache
    }
    tokenCache = null
  }
  if (tokenInFlight) return tokenInFlight
  const inFlight = requestCapabilityToken(token, capability)
    .then((fresh) => {
      // 兼容 wx-auth 把 repo 下发为「owner/name」全名的情况
      const parsed = splitOwnerRepo(fresh.repo, fresh.owner)
      tokenCache = { ...fresh, owner: parsed.owner, repo: parsed.repo }
      return tokenCache
    })
    .finally(() => {
      if (tokenInFlight === inFlight) tokenInFlight = null
    })
  tokenInFlight = inFlight
  return inFlight
}

/**
 * wx-auth 下发的 figurebed.repo 是「owner/name」全名（兼容只传 name 的情况），统一拆分。
 * fallbackOwner 用于无斜杠时从 github.login 补齐 owner。
 */
export function splitOwnerRepo(repoFullName: string, fallbackOwner = ''): { owner: string; repo: string } {
  const idx = repoFullName.indexOf('/')
  if (idx > 0 && idx < repoFullName.length - 1) {
    return { owner: repoFullName.slice(0, idx), repo: repoFullName.slice(idx + 1) }
  }
  return { owner: fallbackOwner, repo: repoFullName }
}

/** 纯函数：按 setups 结果判定下一步动作 */
export function resolveGithubAction(setups: GithubSetupsResponse): GithubAction {
  const figurebed = setups.capabilities?.figurebed
  if (!setups.bound || (setups.credentialStatus && setups.credentialStatus !== 'ok')) {
    return { type: 'bind' }
  }
  if (!setups.installation?.installed) {
    return { type: 'install' }
  }
  if (!figurebed || figurebed.status !== 'active') {
    return { type: 'setup', capability: FIGUREBED_CAPABILITY }
  }
  const { owner, repo } = splitOwnerRepo(figurebed.repo ?? '', setups.github?.login ?? '')
  return { type: 'ready', owner, repo }
}

export function buildGithubAuthorizeUrl(token: string): string {
  return `${WXAUTH_BASE}/api/oauth/github/authorize?token=${encodeURIComponent(token)}`
}

export function buildGithubInstallUrl(token: string): string {
  return `${WXAUTH_BASE}/api/oauth/github/install?token=${encodeURIComponent(token)}`
}

/**
 * 打开绑定/安装新窗口，等待完成页 postMessage（github-bound / github-installed）；
 * 拿不到 message 时，用户回到本窗口（focus）也会 resolve，由调用方重查状态。
 */
export function openGithubGuideWindow(url: string): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onMessage)
      window.removeEventListener('focus', onFocus)
      resolve()
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== WXAUTH_BASE) return
      const type = (event.data as { type?: string } | null)?.type
      if (type === 'github-bound' || type === 'github-installed') finish()
    }
    const onFocus = () => finish()
    window.addEventListener('message', onMessage)
    window.addEventListener('focus', onFocus)
    // 不用 noopener：完成页需要通过 window.opener postMessage 回传结果
    window.open(url, '_blank')
  })
}
