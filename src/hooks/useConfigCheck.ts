'use client'

import { useCallback, useEffect, useRef } from 'react'
import { GitHubAPI } from '@/lib/github'
import { useConfigStore } from '@/stores/configStore'
import { CONFIG_BRANCH } from '@/hooks/useConfigSync'
import { debugLog, debugError } from '@/lib/debug'
import type { Config } from '@/types/config'

function decodeConfigFromBase64(base64: string): string {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

interface ConfigCheckResult extends Config {
  _remoteUpdatedAt?: string
}

export function useConfigCheck() {
  const configStore = useConfigStore()
  const configStoreRef = useRef(configStore)

  // ✅ 在 effect 中更新 ref，不在 render 中更新
  useEffect(() => {
    configStoreRef.current = configStore
  }, [configStore])

  const checkConfig = useCallback(
    async (token?: string, force: boolean = false): Promise<ConfigCheckResult | null> => {
      const store = configStoreRef.current

      if (!force && store.configLastCheckedAt && !store.needsConfigCheck(5 * 60 * 1000)) {
        return null
      }

      if (!token) return null

      // owner/repo 由 wx-auth 下发（figurebed 能力仓库），branch 固定走 main 兜底
      const owner = store.owner
      const repoName = store.repo
      if (!owner || !repoName) return null

      try {
        // 配置文件固定存放在 main 分支（与数据分支解耦，见 useConfigSync.CONFIG_BRANCH）
        const configApi = new GitHubAPI(token, owner, repoName, CONFIG_BRANCH)
        const configFile = await configApi.getFile(store.configPath || '.img.shenzjd.com/config.json', CONFIG_BRANCH)

        if (!configFile.content) {
          store.markConfigChecked(repoName, CONFIG_BRANCH)
          return null
        }
        const content = decodeConfigFromBase64(configFile.content)
        const config: Config = JSON.parse(content)

        const fileUpdatedAt = configFile.commit?.commit?.committer?.date || null
        const localUpdatedAt = store.lastSyncAt

        let shouldUseGitHub = true
        if (fileUpdatedAt && localUpdatedAt) {
          const fileTime = new Date(fileUpdatedAt).getTime()
          const localTime = new Date(localUpdatedAt).getTime()
          shouldUseGitHub = fileTime > localTime
        }

        store.markConfigChecked(repoName, CONFIG_BRANCH)

        if (shouldUseGitHub) {
          const result: ConfigCheckResult = {
            ...config,
            owner,
            repo: repoName,
            branch: config.branch || store.branch || 'main',
          }
          return result
        }
        return null
      } catch (error) {
        // 404 = 新路径下还没有配置文件（首次使用/尚未保存过设置），属正常情况
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          debugLog('[ConfigCheck] 配置文件不存在（首次使用，保存设置后自动生成）')
        } else {
          debugError('[ConfigCheck] Failed:', error)
        }
        store.markConfigChecked(repoName, CONFIG_BRANCH)
        return null
      }
    },
    [] // ✅ 空依赖数组：通过 ref 获取最新 configStore，避免每次 render 都重新创建
  )

  return { checkConfig }
}
