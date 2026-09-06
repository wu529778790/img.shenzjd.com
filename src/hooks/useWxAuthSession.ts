'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { useConfigStore } from '@/stores/configStore'
import { debugLog, debugError, debugWarn } from '@/lib/debug'
import {
  WxAuthError,
  readTokenCookie,
  getGithubSetups,
  resolveGithubAction,
  setupCapability,
  getCapabilityToken,
  invalidateGithubStatus,
  invalidateCapabilityToken,
  buildGithubAuthorizeUrl,
  buildGithubInstallUrl,
  openGithubGuideWindow,
  splitOwnerRepo,
  type GithubAction,
  type GithubSetupsResponse,
  type SetupResult,
} from '@/lib/wxauth'

/**
 * wx-auth UMD 全局 SDK（unpkg @latest 加载，见 layout.tsx），随 wx-auth 升级自动更新
 */
interface WxAuthSDK {
  init(options?: Record<string, unknown>): void
  requireAuth(): Promise<boolean>
  showAuthModal(): Promise<void>
  silentCheck(): Promise<boolean>
}

function getGlobalSDK(): WxAuthSDK | null {
  return (window as unknown as { WxAuth?: WxAuthSDK }).WxAuth ?? null
}

/**
 * 全局只初始化一次（先到先得）：
 * site-navbar / user-avatar / 本站都可能调 WxAuth.init()，谁先执行谁生效，
 * 后来者通过 window.__wxAuthInited 标记检测到已初始化后直接复用，不再重复 init。
 * 我方作为后来者时，登录态刷新由 focus/visibility 重查兜底（不依赖 onVerified 回调）。
 */
function ensureInit(sdk: WxAuthSDK): void {
  const w = window as unknown as { __wxAuthInited?: boolean }
  if (w.__wxAuthInited) {
    debugLog('[WxAuth] already initialized by another consumer, reuse as-is')
    return
  }
  w.__wxAuthInited = true
  sdk.init({
    silent: true,
    required: false,
    onVerified: () => {
      debugLog('[WxAuth] onVerified, refreshing session')
      invalidateGithubStatus()
      verifySession().catch((e) => debugError('[WxAuth] verify after login failed:', e))
    },
    onError: (e: unknown) => debugWarn('[WxAuth] init error:', e),
  })
}

/**
 * wx-auth 登录会话（React 层）
 *
 * - 挂载时 WxAuth.init({ silent, required: false }) 静默校验
 * - 会话状态模块级共享（useSyncExternalStore），多个消费者共用一次查询
 * - ensureReady(): 上传等交互动作的完整就绪流程（登录 → 绑定/安装/开通引导 → 领取凭证）
 * - tryGetCredential(): 非交互获取凭证（列表/配置同步用），未就绪返回 null
 */

export interface WxAuthSession {
  loggedIn: boolean
  github?: { login: string; avatar?: string }
  /** figurebed 就绪时的目标仓库（未开通时为空） */
  owner?: string
  repo?: string
}

export interface CredentialContext {
  /** wx-auth 登录态 token（wxauth-token Cookie 值） */
  wxToken: string
  /** GitHub installation token（短命，只存内存） */
  token: string
  owner: string
  repo: string
}

// —— 模块级会话状态（跨组件共享） ——

let sessionState: WxAuthSession | null = null
let sdkInitialized = false
/** 上次校验失败时间：失败后 30s 内跳过被动重查，避免 focus 时刷屏报错 */
let lastVerifyFailAt = 0
/** 上次校验成功时间：60s 内的 focus/visibility 不重复触发 setups 查询 */
let lastVerifyOkAt = 0
const listeners = new Set<() => void>()

function emit(): void {
  listeners.forEach((l) => l())
}

/** 等待 unpkg 的 wx-auth UMD 脚本加载完成（最长 15s） */
function loadSdk(): Promise<WxAuthSDK> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const poll = () => {
      const sdk = getGlobalSDK()
      if (sdk) return resolve(sdk)
      if (Date.now() - started > 15000) {
        reject(new WxAuthError('network', 'wx-auth SDK 加载超时，请检查网络后刷新重试'))
        return
      }
      setTimeout(poll, 100)
    }
    poll()
  })
}

/** owner/repo 同步进 configStore（仅在变化时，供列表/链接生成复用） */
function syncOwnerRepoToConfig(owner: string, repo: string): void {
  const cfg = useConfigStore.getState()
  if (owner && repo && (cfg.owner !== owner || cfg.repo !== repo)) {
    cfg.updateConfig({ owner, repo })
  }
}

/** 登出清理：清除本地配置与凭证缓存；从已登录态翻转为未登录时刷新页面 */
function applyLoggedOut(): void {
  invalidateGithubStatus()
  invalidateCapabilityToken()
  if (sessionState?.loggedIn) {
    sessionState = { loggedIn: false }
    emit()
    localStorage.removeItem('config-storage')
    window.location.reload()
  } else if (!sessionState) {
    sessionState = { loggedIn: false }
    emit()
  }
}

/** 拉取 setups 并更新共享会话状态（并发去重：同时触发的多个消费方共享同一次校验） */
function verifySession(): Promise<WxAuthSession> {
  if (verifyInFlight) return verifyInFlight
  verifyInFlight = doVerifySession().finally(() => {
    verifyInFlight = null
  })
  return verifyInFlight
}

let verifyInFlight: Promise<WxAuthSession> | null = null

async function doVerifySession(): Promise<WxAuthSession> {
  const wxToken = readTokenCookie()
  if (!wxToken) {
    applyLoggedOut()
    return sessionState!
  }
  try {
    const setups = await getGithubSetups(wxToken)
    const figurebed = setups.capabilities?.figurebed
    // figurebed.repo 是「owner/name」全名，统一拆分后入库
    const parsed = figurebed?.status === 'active' && figurebed.repo
      ? splitOwnerRepo(figurebed.repo, setups.github?.login ?? '')
      : null
    const next: WxAuthSession = {
      loggedIn: true,
      github: setups.github,
      owner: parsed?.owner ?? setups.github?.login,
      repo: parsed?.repo,
    }
    sessionState = next
    emit()
    lastVerifyFailAt = 0
    lastVerifyOkAt = Date.now()
    if (next.owner && next.repo) {
      syncOwnerRepoToConfig(next.owner, next.repo)
    }
    return next
  } catch (err) {
    if (err instanceof WxAuthError && err.kind === 'unauthorized') {
      applyLoggedOut()
      return sessionState!
    }
    // wx-auth/GitHub 侧临时异常（5xx/网络）：保留现有会话状态，等待下次 focus/onVerified 重查
    lastVerifyFailAt = Date.now()
    debugWarn('[WxAuth] verify session failed (will retry on next check):', err)
    return sessionState ?? { loggedIn: false }
  }
}

function runGuide(
  action: 'bind' | 'install' | 'grant',
  wxToken: string,
  opts: { installUrl?: string; message?: string } = {}
): Promise<void> {
  if (action === 'bind') {
    toast.info('需要绑定 GitHub 账号', {
      description: '正在打开授权页面，请在新窗口完成授权',
    })
    return openGithubGuideWindow(buildGithubAuthorizeUrl(wxToken))
  }
  if (action === 'install' || action === 'grant') {
    toast.info(opts.message || (action === 'grant' ? '需要 GitHub 仓库授权' : '需要安装 GitHub App'), {
      description: action === 'grant'
        ? '正在打开 GitHub 授权页面，勾选仓库后回到本页'
        : '在新窗口安装时选择 All repositories 最省事，完成后回到本页',
    })
    return openGithubGuideWindow(opts.installUrl ?? buildGithubInstallUrl(wxToken))
  }
  return Promise.resolve()
}

const SETUP_RETRY_DELAY_MS = 1500
const SETUP_MAX_ROUNDS = 10

/**
 * 开通图床能力（setup 规范流程）：
 * - status: 'active' → 完成
 * - status: 'pending_grant' → 不自动重试，弹出 installUrl 让用户去 GitHub 完成仓库授权，
 *   用户授权回来后重新调 setup，直到 active（避免空转打满限流 10 次/分）
 * - 409 + data.action === 'grant' → 用 data.installUrl 引导，同理
 */
async function runSetupFlow(wxToken: string): Promise<void> {
  toast.loading('首次使用，正在为你初始化仓库…', { id: 'wxauth-setup', duration: 20000 })
  try {
    for (let round = 0; ; round++) {
      if (round >= SETUP_MAX_ROUNDS) {
        throw new WxAuthError('github_action', 'GitHub 仓库授权未完成，请稍后重试')
      }

      let result: SetupResult
      try {
        result = await setupCapability(wxToken)
      } catch (err) {
        if (err instanceof WxAuthError && err.kind === 'github_action' && err.action === 'grant' && err.installUrl) {
          toast.dismiss('wxauth-setup')
          await runGuide('grant', wxToken, { installUrl: err.installUrl, message: err.message })
          toast.loading('正在确认仓库授权结果…', { id: 'wxauth-setup', duration: 20000 })
          await new Promise((resolve) => setTimeout(resolve, SETUP_RETRY_DELAY_MS))
          continue
        }
        throw err
      }

      if (result.status === 'active') {
        debugLog('[WxAuth] setup active:', result)
        toast.success('图床仓库已就绪', { id: 'wxauth-setup' })
        return
      }

      if (result.status === 'pending_grant') {
        if (!result.installUrl) {
          throw new WxAuthError('upstream', result.message || '需要 GitHub 仓库授权，但未返回授权链接')
        }
        toast.dismiss('wxauth-setup')
        // 展示提示 + 「去 GitHub 授权」（新窗口），用户完成勾选回来后重新 setup
        await runGuide('grant', wxToken, { installUrl: result.installUrl, message: result.message })
        toast.loading('正在确认仓库授权结果…', { id: 'wxauth-setup', duration: 20000 })
        await new Promise((resolve) => setTimeout(resolve, SETUP_RETRY_DELAY_MS))
        continue
      }

      // 其他状态：无法继续引导，透出服务端信息（含 repo），避免无意义转圈
      debugWarn('[WxAuth] setup returned unexpected status:', result)
      toast.dismiss('wxauth-setup')
      throw new WxAuthError(
        'upstream',
        result.message || `开通返回未识别状态「${result.status}」${result.repo ? `（repo: ${result.repo}）` : ''}，请截图反馈`
      )
    }
  } catch (err) {
    toast.dismiss('wxauth-setup')
    throw err
  }
}

/**
 * 上传会话就绪流程（可交互：会弹登录/引导窗口）。
 * 每次上传会话调用一次即可，返回的凭证在内部按会话缓存。
 */
export async function ensureReady(): Promise<CredentialContext> {
  const WxAuth = await loadSdk()

  // 1. 登录态：无 Cookie 时手动弹出登录
  let wxToken = readTokenCookie()
  if (!wxToken) {
    toast.info('请先登录')
    const ok = await WxAuth.requireAuth()
    wxToken = readTokenCookie()
    if (!ok || !wxToken) {
      throw new WxAuthError('unauthorized', '需要登录后才能上传')
    }
  }

  // 2. GitHub 就绪循环：判定 → 引导 → 重查（最多 5 轮防死循环）
  // 同一动作的引导窗口在一次流程内只开一次：若引导回来后状态仍未同步，
  // 说明 wx-auth 侧判定与 GitHub 实际状态不一致，重开窗口只会循环骚扰用户。
  const guidedActions = new Set<string>()
  for (let attempt = 0; attempt < 5; attempt++) {
    let setups: GithubSetupsResponse
    try {
      setups = await getGithubSetups(wxToken, attempt > 0)
    } catch (err) {
      if (err instanceof WxAuthError && err.kind === 'unauthorized') {
        invalidateGithubStatus()
        const ok = await WxAuth.requireAuth()
        wxToken = readTokenCookie()
        if (!ok || !wxToken) throw err
        continue
      }
      if (
        err instanceof WxAuthError &&
        (err.kind === 'upstream' || err.kind === 'network') &&
        attempt === 0
      ) {
        // setups 查询失败（wx-auth/GitHub 侧异常，常见于未绑定账号的 5xx）：
        // 降级为直接打开绑定/授权页——该页只依赖登录态 token，不依赖 setups 结果
        debugWarn('[WxAuth] setups unavailable, falling back to bind window:', err)
        toast.info('GitHub 状态查询失败，正在打开绑定页面…')
        await openGithubGuideWindow(buildGithubAuthorizeUrl(wxToken))
        invalidateGithubStatus()
        continue
      }
      throw err
    }

    const action: GithubAction = resolveGithubAction(setups)

    if (action.type === 'ready') {
      try {
        const cred = await getCapabilityToken(wxToken)
        syncOwnerRepoToConfig(cred.owner, cred.repo)
        return { wxToken, token: cred.token, owner: cred.owner, repo: cred.repo }
      } catch (err) {
        if (err instanceof WxAuthError && err.kind === 'github_action' && err.action) {
          if (err.action === 'setup') {
            // 409 要求走开通流程 → 交给下一轮 setups 判定后进 runSetupFlow
            invalidateGithubStatus()
            continue
          }
          // 409 + action（bind / install / grant，grant 带 installUrl）
          await runGuide(err.action, wxToken, { installUrl: err.installUrl, message: err.message })
          invalidateGithubStatus()
          continue
        }
        if (err instanceof WxAuthError && err.kind === 'unauthorized') {
          invalidateGithubStatus()
          invalidateCapabilityToken()
          const ok = await WxAuth.requireAuth()
          wxToken = readTokenCookie()
          if (!ok || !wxToken) throw err
          continue
        }
        throw err
      }
    }

    if (action.type === 'setup') {
      await runSetupFlow(wxToken)
    } else {
      if (guidedActions.has(action.type)) {
        invalidateGithubStatus()
        throw new WxAuthError(
          'github_action',
          action.type === 'install'
            ? 'GitHub 侧显示 App 已安装，但 wx-auth 仍未识别到安装记录，请稍后重试；若持续出现请联系管理员'
            : 'GitHub 绑定状态未同步，请稍后重试'
        )
      }
      guidedActions.add(action.type)
      await runGuide(action.type, wxToken)
    }
    invalidateGithubStatus()
  }

  throw new WxAuthError('github_action', '初始化未完成（已自动重试多次），请稍后重试；若持续失败请联系管理员')
}

/** 非交互获取凭证（不弹窗）：未登录/未就绪返回 null */
export async function tryGetCredential(): Promise<CredentialContext | null> {
  const wxToken = readTokenCookie()
  if (!wxToken) return null
  try {
    const setups = await getGithubSetups(wxToken)
    if (resolveGithubAction(setups).type !== 'ready') return null
    const cred = await getCapabilityToken(wxToken)
    syncOwnerRepoToConfig(cred.owner, cred.repo)
    return { wxToken, token: cred.token, owner: cred.owner, repo: cred.repo }
  } catch (err) {
    debugWarn('[WxAuth] tryGetCredential failed:', err)
    return null
  }
}

export function useWxAuthSession() {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  }, [])
  const session = useSyncExternalStore(
    subscribe,
    () => sessionState,
    () => null
  )

  useEffect(() => {
    // 静默初始化 + 首次会话校验（模块级只执行一次）
    if (!sdkInitialized) {
      sdkInitialized = true
      loadSdk()
        .then((WxAuth) => {
          ensureInit(WxAuth)
        })
        .catch((e) => debugError('[WxAuth] SDK load failed:', e))
      verifySession().catch((e) => debugError('[WxAuth] initial verify failed:', e))
    }

    // 回到页面时重查登录态（site-navbar 退出后 Cookie 消失 → 清理本地状态）
    // 节流：成功后 60s、失败后 30s 内跳过，避免 setups 被反复触发
    const reverify = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      if (Date.now() - lastVerifyFailAt < 30_000) return
      if (Date.now() - lastVerifyOkAt < 60_000) return
      verifySession().catch((e) => debugWarn('[WxAuth] reverify failed:', e))
    }
    window.addEventListener('focus', reverify)
    document.addEventListener('visibilitychange', reverify)
    return () => {
      window.removeEventListener('focus', reverify)
      document.removeEventListener('visibilitychange', reverify)
    }
  }, [])

  return { session, ensureReady, tryGetCredential, refreshSession: verifySession }
}
