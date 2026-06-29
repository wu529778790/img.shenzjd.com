'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { GitHubAPI } from '@/lib/github'
import { useConfigStore } from '@/stores/configStore'
import type { Config } from '@/types/config'
import { debugLog, debugError, debugWarn } from '@/lib/debug'

/**
 * 从 GitHub 文件信息中提取最后修改时间
 */
function getUpdatedAtFromGitHub(file: any): string | null {
  // GitHub API 返回的 commit 信息中有更新时间
  if (file.commit && file.commit.commit && file.commit.commit.committer) {
    return file.commit.commit.committer.date
  }
  return null
}

/**
 * 检测 GitHub 仓库是否已有配置文件
 * 检查 .imgx-config/config.json 是否存在并对比时间戳
 */
export function useDetectExistingConfig() {
  const { data: session } = useSession()
  const configStore = useConfigStore()
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectedConfig, setDetectedConfig] = useState<Partial<Config> | null>(null)

  const detectExistingConfig = useCallback(async () => {
    // 如果已有本地配置，仍然需要检查 GitHub 是否有更新的配置
    const hasLocalConfig = configStore.owner && configStore.repo && configStore.branch
    const localLastSync = configStore.lastSyncAt

    // 未登录，无法检测
    if (!session?.accessToken) {
      return null
    }

    setIsDetecting(true)
    try {
      const token = session.accessToken
      const api = new GitHubAPI(token, '', '')

      // 1. 获取当前用户信息
      const user = await api.getCurrentUser()
      const username = user.login

      // 2. 确定要检查的仓库和分支
      let checkOwner = configStore.owner || username
      let checkRepo = configStore.repo
      let checkBranches: string[] = []

      if (hasLocalConfig && checkRepo) {
        // 有本地配置，只检查当前配置的分支
        checkBranches = [configStore.branch]
      } else {
        // 没有本地配置，查找可能的仓库
        const possibleRepos = ['img.shenzjd.com', 'imgx']
        let foundRepo: string | null = null

        for (const repoName of possibleRepos) {
          try {
            const testApi = new GitHubAPI(token, username, repoName)
            await testApi.getRepo()
            foundRepo = repoName
            break
          } catch (error) {
            continue
          }
        }

        if (!foundRepo) {
          return null
        }

        checkRepo = foundRepo
        // 优先检查的分支列表
        checkBranches = ['master', 'main']
      }

      // 3. 检查每个分支的配置文件
      for (const branch of checkBranches) {
        try {
          const branchApi = new GitHubAPI(token, checkOwner, checkRepo, branch)

          // 尝试读取配置文件（使用 commit API 获取更新时间）
          const configFile = await branchApi.getFile('.imgx-config/config.json', branch)

          if (configFile && configFile.content) {
            // 解析配置内容
            try {
              const configContent = JSON.parse(
                Buffer.from(configFile.content, 'base64').toString('utf-8')
              )

              // 获取远程配置的最后修改时间
              const remoteUpdatedAt = getUpdatedAtFromGitHub(configFile)

              // 如果有本地配置，对比时间戳
              if (hasLocalConfig && localLastSync && remoteUpdatedAt) {
                const localTime = new Date(localLastSync).getTime()
                const remoteTime = new Date(remoteUpdatedAt).getTime()

                // 如果本地配置更新，跳过远程配置
                if (localTime >= remoteTime) {
                  debugLog('[ConfigDetection] Local config is up-to-date, skipping remote')
                  return null
                }
              }

              // 返回配置信息，包含更新时间
              return {
                owner: checkOwner,
                repo: checkRepo,
                branch,
                ...configContent,
                _remoteUpdatedAt: remoteUpdatedAt, // 内部字段，不保存到 store
              } as Partial<Config> & { _remoteUpdatedAt?: string }
            } catch (parseError) {
              debugError('Failed to parse config file:', parseError)
              continue
            }
          }
        } catch (error) {
          // 该分支没有配置文件，尝试下一个
          continue
        }
      }

      return null
    } catch (error) {
      debugError('Failed to detect existing config:', error)
      return null
    } finally {
      setIsDetecting(false)
    }
  }, [session, configStore])

  return {
    detectExistingConfig,
    isDetecting,
    detectedConfig,
  }
}
