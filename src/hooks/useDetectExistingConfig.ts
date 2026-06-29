'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { GitHubAPI } from '@/lib/github'
import { useConfigStore } from '@/stores/configStore'
import type { Config } from '@/types/config'

/**
 * 检测 GitHub 仓库是否已有配置文件
 * 检查 .imgx-config/config.json 是否存在并读取配置
 */
export function useDetectExistingConfig() {
  const { data: session } = useSession()
  const configStore = useConfigStore()
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectedConfig, setDetectedConfig] = useState<Partial<Config> | null>(null)

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

      // 1. 获取当前用户信息
      const user = await api.getCurrentUser()
      const username = user.login

      // 2. 查找可能的仓库
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

      // 3. 优先检查的分支列表
      // master: 老用户使用习惯
      // main: GitHub 默认分支（新用户）
      const priorityBranches = ['master', 'main']

      // 4. 检查每个分支是否有配置文件
      for (const branch of priorityBranches) {
        try {
          const branchApi = new GitHubAPI(token, username, foundRepo, branch)

          // 尝试读取配置文件
          const configFile = await branchApi.getFile('.imgx-config/config.json', branch)

          if (configFile && configFile.content) {
            // 找到了配置文件，解析内容
            try {
              const configContent = JSON.parse(
                Buffer.from(configFile.content, 'base64').toString('utf-8')
              )

              // 返回完整的配置信息
              return {
                owner: username,
                repo: foundRepo,
                branch,
                ...configContent,
              } as Partial<Config>
            } catch (parseError) {
              console.error('Failed to parse config file:', parseError)
              // 配置文件存在但解析失败，继续检查下一个分支
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
