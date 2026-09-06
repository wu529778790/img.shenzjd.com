import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  resolveGithubAction,
  getGithubSetups,
  getCapabilityToken,
  requestCapabilityToken,
  setupCapability,
  invalidateGithubStatus,
  invalidateCapabilityToken,
  splitOwnerRepo,
  WxAuthError,
  type GithubSetupsResponse,
} from './wxauth'

const activeSetups = (overrides: Partial<GithubSetupsResponse> = {}): GithubSetupsResponse => ({
  bound: true,
  github: { login: 'wu529778790', avatar: 'https://avatar' },
  installation: { installed: true, installationId: 123 },
  credentialStatus: 'ok',
  capabilities: {
    figurebed: { label: '图床', status: 'active', repo: 'wu529778790/images' },
  },
  ...overrides,
})

describe('resolveGithubAction', () => {
  it('未绑定 GitHub → bind', () => {
    expect(resolveGithubAction({ bound: false })).toEqual({ type: 'bind' })
  })

  it('凭证失效（refresh_invalid）→ bind 重新授权', () => {
    const setups = activeSetups({ credentialStatus: 'refresh_invalid' })
    expect(resolveGithubAction(setups)).toEqual({ type: 'bind' })
  })

  it('App 已卸载 → bind 重新授权', () => {
    const setups = activeSetups({ credentialStatus: 'uninstalled' })
    expect(resolveGithubAction(setups)).toEqual({ type: 'bind' })
  })

  it('未安装 GitHub App → install', () => {
    const setups = activeSetups({ installation: { installed: false } })
    expect(resolveGithubAction(setups)).toEqual({ type: 'install' })
  })

  it('figurebed 未开通 → setup', () => {
    const setups = activeSetups({
      capabilities: { figurebed: { label: '图床', status: 'not_setup' } },
    })
    expect(resolveGithubAction(setups)).toEqual({ type: 'setup', capability: 'figurebed' })
  })

  it('缺少 capabilities → setup', () => {
    const setups = activeSetups({ capabilities: {} })
    expect(resolveGithubAction(setups)).toEqual({ type: 'setup', capability: 'figurebed' })
  })

  it('全部就绪 → ready，owner/repo 来自 setups（repo 全名拆分）', () => {
    expect(resolveGithubAction(activeSetups())).toEqual({
      type: 'ready',
      owner: 'wu529778790',
      repo: 'images',
    })
  })
})

describe('splitOwnerRepo（wx-auth 下发 owner/name 全名）', () => {
  it('全名拆分为 owner + repo', () => {
    expect(splitOwnerRepo('wu529778790/img.shenzjd.com')).toEqual({
      owner: 'wu529778790',
      repo: 'img.shenzjd.com',
    })
  })

  it('仅仓库名时用 fallbackOwner 补齐', () => {
    expect(splitOwnerRepo('images', 'wu529778790')).toEqual({
      owner: 'wu529778790',
      repo: 'images',
    })
  })

  it('含域名的仓库名只按第一个斜杠拆分', () => {
    expect(splitOwnerRepo('wu529778790/img.shenzjd.com', 'someone')).toEqual({
      owner: 'wu529778790',
      repo: 'img.shenzjd.com',
    })
  })

  it('getCapabilityToken 对全名 repo 做同样归一化', async () => {
    invalidateCapabilityToken()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        token: 'ghs_x',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        owner: 'wu529778790',
        repo: 'wu529778790/img.shenzjd.com',
      }), { status: 200 })
    ))
    const cred = await getCapabilityToken('wx-token')
    expect(cred.owner).toBe('wu529778790')
    expect(cred.repo).toBe('img.shenzjd.com')
    invalidateCapabilityToken()
    vi.unstubAllGlobals()
  })
})

describe('并发去重（in-flight 共享）', () => {
  beforeEach(() => {
    invalidateGithubStatus()
    invalidateCapabilityToken()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('多个消费方同时调 getGithubSetups 只发一条请求', async () => {
    let resolveFetch!: (v: Response) => void
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve })
    )
    vi.stubGlobal('fetch', fetchMock)

    const all = Promise.all([
      getGithubSetups('wx-token'),
      getGithubSetups('wx-token'),
      getGithubSetups('wx-token'),
    ])
    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolveFetch(new Response(JSON.stringify(activeSetups()), { status: 200 }))
    const [a, b, c] = await all
    expect(b).toBe(a)
    expect(c).toBe(a)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('skipCache 不复用在途请求（引导完成后强制重查）', async () => {
    let resolveFetch!: (v: Response) => void
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve })
    )
    vi.stubGlobal('fetch', fetchMock)

    void getGithubSetups('wx-token')
    void getGithubSetups('wx-token', true)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    resolveFetch(new Response(JSON.stringify(activeSetups()), { status: 200 }))
    invalidateGithubStatus()
  })
})

describe('getGithubSetups 会话缓存', () => {
  beforeEach(() => {
    invalidateGithubStatus()
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('第二次调用命中缓存，引导后 invalidate 强制重查', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(activeSetups()), { status: 200 }))
    )
    vi.stubGlobal('fetch', fetchMock)

    const first = await getGithubSetups('wx-token')
    const second = await getGithubSetups('wx-token')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toEqual(first)

    invalidateGithubStatus()
    await getGithubSetups('wx-token', false)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    vi.unstubAllGlobals()
  })
})

describe('requestCapabilityToken 错误口径', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('401 → unauthorized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'unauthorized' }), { status: 401 })
    ))
    await expect(requestCapabilityToken('wx-token')).rejects.toMatchObject({
      kind: 'unauthorized',
    })
  })

  it('409 + action: install → github_action 且带引导动作', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'not installed', data: { action: 'install' } }), { status: 409 })
    ))
    const err = await requestCapabilityToken('wx-token').catch((e) => e)
    expect(err).toBeInstanceOf(WxAuthError)
    expect(err.kind).toBe('github_action')
    expect(err.action).toBe('install')
  })

  it('429 → rate_limited', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 429 })
    ))
    await expect(requestCapabilityToken('wx-token')).rejects.toMatchObject({
      kind: 'rate_limited',
    })
  })

  it('502 → upstream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 502 })
    ))
    await expect(requestCapabilityToken('wx-token')).rejects.toMatchObject({
      kind: 'upstream',
    })
  })
})

describe('wx-auth 响应体业务错误（HTTP 200 + error 字段）', () => {
  beforeEach(() => {
    invalidateGithubStatus()
    invalidateCapabilityToken()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('setups 返回 200 + {error:"unauthorized"} → unauthorized（wx-auth 未登录时的实际行为）', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'unauthorized', message: '请先完成微信认证' }), { status: 200 })
    ))
    const err = await getGithubSetups('wx-token').catch((e) => e)
    expect(err).toBeInstanceOf(WxAuthError)
    expect(err.kind).toBe('unauthorized')
  })

  it('token 返回 200 + {error:true, statusCode:401} → unauthorized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: true, statusCode: 401, message: '请先完成微信认证' }), { status: 200 })
    ))
    const err = await getCapabilityToken('wx-token').catch((e) => e)
    expect(err).toBeInstanceOf(WxAuthError)
    expect(err.kind).toBe('unauthorized')
  })

  it('setups 返回 200 + 其他 error → upstream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'github_upstream', message: 'GitHub 服务异常' }), { status: 200 })
    ))
    await expect(getGithubSetups('wx-token')).rejects.toMatchObject({ kind: 'upstream' })
  })
})

describe('pending_grant / grant 分支', () => {
  beforeEach(() => {
    invalidateCapabilityToken()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('setup 409 + data.action=grant + installUrl → github_action 且带授权链接', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        message: '需要仓库授权',
        data: { action: 'grant', installUrl: 'https://github.com/apps/imgx/installations/new' },
      }), { status: 409 })
    ))
    const err = await setupCapability('wx-token').catch((e) => e)
    expect(err).toBeInstanceOf(WxAuthError)
    expect(err.kind).toBe('github_action')
    expect(err.action).toBe('grant')
    expect(err.installUrl).toBe('https://github.com/apps/imgx/installations/new')
  })

  it('setup 请求体携带 repo=img.shenzjd.com（域名命名，固定值不换名）', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ capability: 'figurebed', status: 'active', repo: 'img.shenzjd.com' }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)
    await setupCapability('wx-token')
    const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }]
    expect(url).toBe('https://wx-auth.shenzjd.com/api/github/setup')
    expect(JSON.parse(init.body)).toEqual({ capability: 'figurebed', repo: 'img.shenzjd.com' })
  })

  it('setup 200 + status=pending_grant → 正常返回（由调用方弹授权，不得当作失败）', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        capability: 'figurebed',
        status: 'pending_grant',
        installUrl: 'https://github.com/apps/imgx/installations/new',
        message: '请完成 GitHub 仓库授权',
      }), { status: 200 })
    ))
    const result = await setupCapability('wx-token')
    expect(result.status).toBe('pending_grant')
    expect(result.installUrl).toBe('https://github.com/apps/imgx/installations/new')
    expect(result.message).toBe('请完成 GitHub 仓库授权')
  })

  it('token 409 + action=grant → 携带 installUrl（ensureReady 据此弹授权窗）', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        message: '需要仓库授权',
        data: { action: 'grant', installUrl: 'https://github.com/apps/imgx/installations/new' },
      }), { status: 409 })
    ))
    const err = await getCapabilityToken('wx-token').catch((e) => e)
    expect(err.kind).toBe('github_action')
    expect(err.action).toBe('grant')
    expect(err.installUrl).toBe('https://github.com/apps/imgx/installations/new')
  })
})

describe('getCapabilityToken 过期策略', () => {
  beforeEach(() => {
    invalidateCapabilityToken()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('有效期内复用缓存，剩余 <30min 自动重领', async () => {
    const longLived = {
      token: 'ghs_long',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      owner: 'wu529778790',
      repo: 'images',
    }
    const shortLived = {
      token: 'ghs_short',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      owner: 'wu529778790',
      repo: 'images',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(longLived), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(shortLived), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(shortLived), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    // 首次领取 + 命中缓存
    const first = await getCapabilityToken('wx-token')
    const cached = await getCapabilityToken('wx-token')
    expect(cached.token).toBe(first.token)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // 缓存失效后重领（返回剩余 10 分钟的短命 token）
    invalidateCapabilityToken()
    const short = await getCapabilityToken('wx-token')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(short.token).toBe('ghs_short')

    // 剩余 10 分钟 < 30 分钟阈值 → 下一次调用必须重新领取，而不是复用缓存
    await getCapabilityToken('wx-token')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
