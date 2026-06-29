'use client'

import { useCallback } from 'react'
import { GitHubAPI } from '@/lib/github'
import { useConfigStore } from '@/stores/configStore'
import { toast } from 'sonner'
import type { Config } from '@/types/config'

interface ConfigCheckResult {
  owner: string
  repo: string
  branch: string
  directory?: string
  [key: string]: any
}

/**
 * Hook: 统一配置检测逻辑
 *
 * 功能：
 * 1. 检查配置缓存是否有效
 * 2. 如果无效，从 GitHub 检测配置
 * 3. 更新缓存
 *
 * 缓存策略：
 * - TTL: 5 分钟
 * - 可以强制刷新
 */
export function useConfigCheck() {
  const configStore = useConfigStore()

  /**
   * 检测 GitHub 配置
   * @param force - 是否强制检测（忽略缓存）
   * @returns 检测到的配置，如果没有则返回 null
   */
  const checkConfig = useCallback(
    async (force: boolean = false): Promise<ConfigCheckResult | null> => {
      // 如果配置已完整，不需要检测（除非强制刷新）
      if (!force && configStore.owner && configStore.repo && configStore.branch) {
        // 如果缓存有效，直接返回
        if (!configStore.needsConfigCheck(5 * 60 * 1000)) {
          return null
        }
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('github_token') : null
      if (!token) {
        return null
      }

      try {
        const api = new GitHubAPI(token, '', '')
        const currentUser = await api.getCurrentUser()
        const username = currentUser.login

        // 使用固定仓库名
        const repoName = 'img.shenzjd.com'
        const configPath = '.imgx-config/config.json'

        // 确定要检查的分支
        const branch = configStore.branch || 'main'
        const configApi = new GitHubAPI(token, username, repoName, branch)

        try {
          // 尝试读取配置文件
          const configFile = await configApi.getFile(configPath, branch)
          const content = decodeURIComponent(escape(atob(configFile.content)))
          const config: Config = JSON.parse(content)

          // 标记检测完成
          configStore.markConfigChecked(repoName, branch)

          // 先展开 config，再覆盖 owner/repo/branch
          const result = {
            ...config,
            owner: username,
            repo: repoName,
            branch: config.branch || branch,
          } as ConfigCheckResult

          return result
        } catch {
          // 配置文件不存在
          // 尝试其他分支（仅当没有本地配置时）
          if (!configStore.owner) {
            const branches = ['master', 'main']
            for (const tryBranch of branches) {
              if (tryBranch === branch) continue // 已经检查过

              try {
                const branchApi = new GitHubAPI(token, username, repoName, tryBranch)
                const configFile = await branchApi.getFile(configPath, tryBranch)
                const content = decodeURIComponent(escape(atob(configFile.content)))
                const config: Config = JSON.parse(content)

                // 标记检测完成
                configStore.markConfigChecked(repoName, tryBranch)

                // 先展开 config，再覆盖 owner/repo/branch
                const result = {
                  ...config,
                  owner: username,
                  repo: repoName,
                  branch: config.branch || tryBranch,
                } as ConfigCheckResult

                return result
              } catch {
                continue // 尝试下一个分支
              }
            }
          }

          // 所有分支都没有找到配置
          // 标记检测完成（避免重复检测）
          configStore.markConfigChecked(repoName, branch)
          return null
        }
      } catch (error) {
        console.error('[ConfigCheck] Failed to check config:', error)
        return null
      }
    },
    [configStore]
  )

  return { checkConfig }
}
