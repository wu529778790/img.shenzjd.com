'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { GitHubAPI } from '@/lib/github'
import { useConfigStore } from '@/stores/configStore'

/**
 * 检测 GitHub 仓库是否已被使用
 * 检查常见分支（data、master、main）是否有图片
 */
export function useDetectExistingConfig() {
  const { data: session } = useSession()
  const configStore = useConfigStore()
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectedConfig, setDetectedConfig] = useState<{
    owner: string
    repo: string
    branch: string
  } | null>(null)

  const detectExistingConfig = useCallback(async () => {
    // 如果已有本地配置，无需检测
    if (configStore.owner && configStore.repo && configStore.branch) {
      return null
    }

    // 未登录，无法检测
    if (!session?.accessToken) {
      return null
    }

    setIsDetecting(true)
    try {
      const token = session.accessToken
      const api = new GitHubAPI(token, '', '')

      // 1. 获取当前用户的仓库列表
      const user = await api.getCurrentUser()
      const username = user.login

      // 2. 查找 img.shenzjd.com 仓库
      let repoName = 'img.shenzjd.com'
      let repoExists = false

      try {
        await api.getRepo()
        repoExists = true
      } catch (error) {
        // 仓库不存在，尝试用 imgx 作为默认仓库名
        try {
          await new GitHubAPI(token, username, 'imgx').getRepo()
          repoName = 'imgx'
          repoExists = true
        } catch (e) {
          // 仓库不存在，无法检测
          return null
        }
      }

      if (!repoExists) {
        return null
      }

      // 3. 获取仓库的分支列表
      const repoApi = new GitHubAPI(token, username, repoName)
      let branches: string[] = []

      try {
        branches = await repoApi.getBranches()
      } catch (error) {
        // 获取分支失败，使用默认分支
        try {
          const repoInfo = await repoApi.getRepo()
          branches = [repoInfo.default_branch]
        } catch (e) {
          return null
        }
      }

      // 4. 优先检查的分支列表
      const priorityBranches = ['data', 'master', 'main', 'master']

      // 5. 检查每个分支是否有图片
      for (const branch of priorityBranches) {
        if (!branches.includes(branch)) continue

        try {
          // 创建带有特定分支的 API 实例
          const branchApi = new GitHubAPI(token, username, repoName, branch)
          const files = await branchApi.listAllFilesWithTree()
          const hasImages = files.some(file =>
            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name)
          )

          if (hasImages) {
            return {
              owner: username,
              repo: repoName,
              branch,
            }
          }
        } catch (error) {
          // 该分支获取文件失败，尝试下一个
          continue
        }
      }

      // 6. 检查其他分支（如果前面的都没有图片）
      for (const branch of branches) {
        if (priorityBranches.includes(branch)) continue

        try {
          // 创建带有特定分支的 API 实例
          const branchApi = new GitHubAPI(token, username, repoName, branch)
          const files = await branchApi.listAllFilesWithTree()
          const hasImages = files.some(file =>
            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name)
          )

          if (hasImages) {
            return {
              owner: username,
              repo: repoName,
              branch,
            }
          }
        } catch (error) {
          continue
        }
      }

      return null
    } catch (error) {
      console.error('Failed to detect existing config:', error)
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
