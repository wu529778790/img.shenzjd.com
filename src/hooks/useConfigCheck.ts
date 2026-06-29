'use client'

import { useCallback } from 'react'
import { GitHubAPI } from '@/lib/github'
import { useConfigStore } from '@/stores/configStore'
import { toast } from 'sonner'
import type { Config } from '@/types/config'
import { debugLog, debugError, debugWarn } from '@/lib/debug'

interface ConfigCheckResult {
  owner: string
  repo: string
  branch: string
  [key: string]: any
}

/**
 * Hook: 统一配置检测逻辑
 *
 * 功能：
 * 1. 只请求 .imgx-config/config.json 一个文件
 * 2. 对比文件的 commit 时间和本地 lastSyncAt
 * 3. 哪个新用哪个
 * 4. 更新 configStore
 *
 * 优化：
 * - 只发起 1 个 GitHub API 请求
 * - 5 分钟 TTL 缓存
 * - 支持强制刷新
 */
export function useConfigCheck() {
  const configStore = useConfigStore()

  /**
   * 检测并加载配置
   * @param force - 是否强制检测（忽略缓存）
   * @returns 检测到的配置，如果没有则返回 null
   */
  const checkConfig = useCallback(
    async (force: boolean = false): Promise<ConfigCheckResult | null> => {
      // 如果配置已完整且缓存有效，直接返回
      if (!force && configStore.owner && configStore.repo && configStore.branch) {
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

        // 固定仓库和配置路径
        const repoName = 'img.shenzjd.com'
        const configPath = '.imgx-config/config.json'

        // 使用当前配置的分支或默认 main
        const branch = configStore.branch || 'main'
        const configApi = new GitHubAPI(token, username, repoName, branch)

        try {
          // 1. 只请求这一个配置文件
          const configFile = await configApi.getFile(configPath, branch)

          // 2. 解析配置
          const content = decodeURIComponent(escape(atob(configFile.content)))
          const config: Config = JSON.parse(content)

          // 3. 获取文件的最后修改时间（从 commit 信息中提取）
          const fileUpdatedAt = configFile.commit?.commit?.committer?.date || null
          const localUpdatedAt = configStore.lastSyncAt

          // 4. 对比时间戳：哪个新用哪个
          let shouldUseGitHub = true
          if (fileUpdatedAt && localUpdatedAt) {
            const fileTime = new Date(fileUpdatedAt).getTime()
            const localTime = new Date(localUpdatedAt).getTime()
            shouldUseGitHub = fileTime > localTime
            debugLog('[ConfigCheck] Timestamp comparison:', {
              fileUpdatedAt,
              localUpdatedAt,
              shouldUseGitHub,
            })
          }

          // 5. 标记检测完成
          configStore.markConfigChecked(repoName, branch)

          if (shouldUseGitHub) {
            // 使用 GitHub 配置
            const result: ConfigCheckResult = {
              ...config,
              owner: username,
              repo: repoName,
              branch: config.branch || branch,
            }

            debugLog('[ConfigCheck] Using GitHub config')
            return result
          } else {
            // 使用本地配置
            debugLog('[ConfigCheck] Using local config')
            return null
          }
        } catch {
          // 配置文件不存在或读取失败
          debugLog('[ConfigCheck] Config file not found on branch:', branch)
          configStore.markConfigChecked(repoName, branch)
          return null
        }
      } catch (error) {
        debugError('[ConfigCheck] Failed:', error)
        return null
      }
    },
    [configStore]
  )

  return { checkConfig }
}
