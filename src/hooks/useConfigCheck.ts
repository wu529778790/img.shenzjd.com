'use client'

import { useCallback } from 'react'
import { GitHubAPI } from '@/lib/github'
import { useConfigStore } from '@/stores/configStore'
import type { Config } from '@/types/config'
import { debugLog, debugError } from '@/lib/debug'

/**
 * 使用 TextDecoder 进行 UTF-8 安全的 base64 解码
 */
function decodeConfigFromBase64(base64: string): string {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

interface ConfigCheckResult extends Config {
  _remoteUpdatedAt?: string
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
      // 如果已检测过且在缓存期内，不再请求
      // - 配置完整：使用现有配置
      // - 配置为空：GitHub 上也没有，无需重试
      if (!force && configStore.configLastCheckedAt && !configStore.needsConfigCheck(5 * 60 * 1000)) {
        debugLog('[ConfigCheck] Checked recently, using cached result')
        return null
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

        // 优先使用配置的分支，否则按优先级尝试多个分支
        const branchesToTry = [
          configStore.branch,  // 当前配置的分支（如果有）
          'main',             // 然后是 main
          'master',           // 最后是 master
        ].filter((branch, index, arr) => branch && arr.indexOf(branch) === index) // 去重

        // 依次尝试每个分支
        for (const branch of branchesToTry) {
          try {
            debugLog('[ConfigCheck] Trying branch:', branch)
            const configApi = new GitHubAPI(token, username, repoName, branch)

            // 只请求这一个配置文件
            const configFile = await configApi.getFile(configPath, branch)

            // 解析配置
            if (!configFile.content) continue
            const content = decodeConfigFromBase64(configFile.content)
            const config: Config = JSON.parse(content)

            // 获取文件的最后修改时间
            const fileUpdatedAt = configFile.commit?.commit?.committer?.date || null
            const localUpdatedAt = configStore.lastSyncAt

            // 对比时间戳：哪个新用哪个
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

            // 标记检测完成
            configStore.markConfigChecked(repoName, branch)

            if (shouldUseGitHub) {
              // 使用 GitHub 配置
              const result: ConfigCheckResult = {
                ...config,
                owner: username,
                repo: repoName,
                branch: config.branch || branch,
              }

              debugLog('[ConfigCheck] Using GitHub config from branch:', branch)
              return result
            } else {
              // 使用本地配置
              debugLog('[ConfigCheck] Using local config (GitHub config is older)')
              return null
            }
          } catch (err) {
            // 当前分支失败，尝试下一个分支
            debugLog('[ConfigCheck] Branch', branch, 'failed:', err)
            continue
          }
        }

        // 所有分支都失败
        debugLog('[ConfigCheck] All branches failed, no config found')
        configStore.markConfigChecked(repoName, branchesToTry[0] || 'main')
        return null
      } catch (error) {
        debugError('[ConfigCheck] Failed:', error)
        // 发生错误也标记检测完成，避免频繁重试
        configStore.markConfigChecked('img.shenzjd.com', configStore.branch || 'main')
        return null
      }
    },
    [configStore]
  )

  return { checkConfig }
}
