/**
 * 分支守卫：保证「读/写文件用的分支」在目标仓库里真实存在。
 *
 * 背景：远程配置里的 branch 属于用户偏好，会随配置同步往返。换 GitHub 账号 / 换仓库后，
 * 旧配置里的 master 在新仓库可能并不存在，而 GitHub 对「分支不存在」同样返回 404，
 * 前端若不校验，就会把 404 误判成「图床仓库已被删除」（甚至把本地配置清空）。
 *
 * 策略：拿凭证后先确认分支存在，不存在则回退到仓库默认分支并纠正本地配置（fail-open，
 * 判定失败时沿用原分支，绝不因校验本身阻塞上传/列表）。
 */

import { toast } from 'sonner'
import type { GitHubAPI } from './github'
import { debugLog, debugWarn } from './debug'
import { useConfigStore } from '@/stores/configStore'

interface RepoBranchInfo {
  branches: string[]
  defaultBranch: string
  at: number
}

export interface BranchResolution {
  /** 实际可用的分支 */
  branch: string
  /** 是否发生了纠正（配置里的分支不可用） */
  corrected: boolean
  /** 仓库真实分支列表（拿不到时为空数组） */
  available: string[]
}

const BRANCH_CACHE_TTL = 10 * 60 * 1000
const branchCache = new Map<string, RepoBranchInfo>()
const notifiedCorrections = new Set<string>()

/**
 * 纯函数：在候选分支里挑一个确定可用的分支。
 * - 首选命中直接用
 * - 否则用仓库默认分支
 * - 再否则按 main→master→首个分支的顺序兜底
 * - 分支列表拿不到时 fail-open 返回首选（不阻塞主流程）
 */
export function pickUsableBranch(
  preferred: string,
  branches: string[],
  defaultBranch = ''
): string {
  const pref = (preferred || '').trim()
  const list = (branches || []).filter(Boolean)
  if (pref && list.includes(pref)) return pref
  if (defaultBranch && list.includes(defaultBranch)) return defaultBranch
  if (list.includes('main')) return 'main'
  if (list.includes('master')) return 'master'
  if (list.length > 0) return list[0]
  return pref || defaultBranch || 'main'
}

function cacheKey(api: GitHubAPI): string {
  return `${api.owner}/${api.repo}`.toLowerCase()
}

/** 清空分支缓存（切换账号/仓库、或怀疑缓存过期时调用） */
export function invalidateBranchCache(): void {
  branchCache.clear()
}

/**
 * 读取仓库分支信息（会话内缓存 10 分钟）。
 * 仓库本体请求失败会抛错，由调用方决定 fail-open 还是提示。
 */
export async function loadRepoBranches(api: GitHubAPI, force = false): Promise<RepoBranchInfo> {
  const key = cacheKey(api)
  const cached = branchCache.get(key)
  if (!force && cached && Date.now() - cached.at < BRANCH_CACHE_TTL) return cached

  const repo = await api.getRepo()
  // getBranches 内部已有兜底（失败时回退默认分支），不会抛错
  const branches = await api.getBranches().catch(() => [] as string[])
  const info: RepoBranchInfo = {
    branches,
    defaultBranch: repo?.default_branch || '',
    at: Date.now(),
  }
  branchCache.set(key, info)
  debugLog('[BranchGuard] 仓库分支:', { key, ...info })
  return info
}

/**
 * 确保分支可用：优先用配置里的分支，不在仓库里则回退默认分支。
 * 任何异常都 fail-open 返回首选分支（不因校验失败而影响上传）。
 */
export async function ensureUsableBranch(
  api: GitHubAPI,
  preferred: string,
  force = false
): Promise<BranchResolution> {
  const pref = (preferred || '').trim()
  try {
    const info = await loadRepoBranches(api, force)
    const branch = pickUsableBranch(pref, info.branches, info.defaultBranch)
    return {
      branch,
      corrected: !!pref && branch !== pref,
      available: info.branches,
    }
  } catch (err) {
    debugWarn('[BranchGuard] 分支校验失败，沿用当前分支:', err)
    return { branch: pref || 'main', corrected: false, available: [] }
  }
}

/**
 * 应用分支纠正：写回本地配置（触发配置自动同步，远端配置也会被修正）+ 提示用户一次。
 * 并发上传多个文件时只会提示一次。
 */
export function applyBranchCorrection(
  owner: string,
  repo: string,
  from: string,
  to: string
): void {
  if (!to || to === from) return
  useConfigStore.getState().updateConfig({ branch: to })
  if (notifyBranchCorrectionOnce(owner, repo, from, to)) {
    toast.warning(`分支「${from}」在仓库里不存在，已自动切换到「${to}」`, {
      description: '设置已同步更新，如不正确可到设置页重新选择分支',
      duration: 6000,
    })
  }
}

/**
 * 分支纠正提示去重：同一仓库 + 同一目标分支只提示一次，避免并发上传时刷屏。
 * 返回 true 表示本次应该提示。
 */
export function notifyBranchCorrectionOnce(
  owner: string,
  repo: string,
  from: string,
  to: string
): boolean {
  const key = `${owner}/${repo}:${from}->${to}`
  if (notifiedCorrections.has(key)) return false
  notifiedCorrections.add(key)
  return true
}
