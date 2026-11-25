import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  pickUsableBranch,
  loadRepoBranches,
  ensureUsableBranch,
  invalidateBranchCache,
  notifyBranchCorrectionOnce,
} from './branchGuard'
import type { GitHubAPI } from './github'

interface FakeOptions {
  branches?: string[]
  defaultBranch?: string
  failRepo?: boolean
}

function fakeApi(options: FakeOptions = {}) {
  const getRepo = vi.fn(async () => {
    if (options.failRepo) throw new Error('Not Found')
    return { default_branch: options.defaultBranch ?? 'main' } as never
  })
  const getBranches = vi.fn(async () => options.branches ?? ['main'])
  return {
    owner: 'meta-cosmos',
    repo: 'img.shenzjd.com',
    getRepo,
    getBranches,
  } as unknown as GitHubAPI & { getRepo: typeof getRepo; getBranches: typeof getBranches }
}

describe('pickUsableBranch', () => {
  it('首选分支存在时原样返回', () => {
    expect(pickUsableBranch('master', ['main', 'master'], 'main')).toBe('master')
  })

  it('首选分支不存在时回退仓库默认分支', () => {
    expect(pickUsableBranch('master', ['main'], 'main')).toBe('main')
  })

  it('没有默认分支时按 main 兜底', () => {
    expect(pickUsableBranch('master', ['dev', 'main'], '')).toBe('main')
  })

  it('没有 main 时按 master 兜底', () => {
    expect(pickUsableBranch('release', ['dev', 'master'], '')).toBe('master')
  })

  it('分支列表拿不到时 fail-open 返回首选分支', () => {
    expect(pickUsableBranch('master', [], '')).toBe('master')
  })

  it('首选为空时用默认分支', () => {
    expect(pickUsableBranch('', ['main'], 'main')).toBe('main')
  })
})

describe('ensureUsableBranch', () => {
  beforeEach(() => {
    invalidateBranchCache()
  })

  it('旧账号的 master 在新仓库自动纠正为 main', async () => {
    const api = fakeApi({ branches: ['main'], defaultBranch: 'main' })
    const result = await ensureUsableBranch(api, 'master')
    expect(result).toEqual({ branch: 'main', corrected: true, available: ['main'] })
  })

  it('分支存在时不纠正', async () => {
    const api = fakeApi({ branches: ['main', 'master'], defaultBranch: 'main' })
    const result = await ensureUsableBranch(api, 'master')
    expect(result).toEqual({ branch: 'master', corrected: false, available: ['main', 'master'] })
  })

  it('仓库探测失败时 fail-open 沿用首选分支（不阻塞上传）', async () => {
    const api = fakeApi({ failRepo: true })
    const result = await ensureUsableBranch(api, 'master')
    expect(result).toEqual({ branch: 'master', corrected: false, available: [] })
  })

  it('分支信息在会话内缓存，重复调用不再请求 GitHub', async () => {
    const api = fakeApi({ branches: ['main'], defaultBranch: 'main' })
    await loadRepoBranches(api)
    await loadRepoBranches(api)
    expect(api.getRepo).toHaveBeenCalledTimes(1)
    expect(api.getBranches).toHaveBeenCalledTimes(1)
  })

  it('force 跳过多余缓存', async () => {
    const api = fakeApi({ branches: ['main'], defaultBranch: 'main' })
    await loadRepoBranches(api)
    await loadRepoBranches(api, true)
    expect(api.getRepo).toHaveBeenCalledTimes(2)
  })
})

describe('notifyBranchCorrectionOnce', () => {
  it('同一仓库同一纠正只提示一次，不同仓库互不影响', () => {
    expect(notifyBranchCorrectionOnce('a', 'repo', 'master', 'main')).toBe(true)
    expect(notifyBranchCorrectionOnce('a', 'repo', 'master', 'main')).toBe(false)
    expect(notifyBranchCorrectionOnce('b', 'repo', 'master', 'main')).toBe(true)
  })
})
