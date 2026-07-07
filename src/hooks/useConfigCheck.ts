'use client'

import { useCallback, useEffect, useRef } from 'react'
import { GitHubAPI } from '@/lib/github'
import { useConfigStore } from '@/stores/configStore'
import { debugError } from '@/lib/debug'
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

      let timedOut = false
      const timeoutHandle = setTimeout(() => {
        timedOut = true
        store.markConfigChecked('img.shenzjd.com', store.branch || 'main')
      }, 20000)

      try {
        const api = new GitHubAPI(token, '', '')
        const currentUser = await api.getCurrentUser()
        if (timedOut) return null
        const username = currentUser.login

        const repoName = 'img.shenzjd.com'
        const configPath = '.imgx-config/config.json'

        const branchesToTry = [
          store.branch,
          'main',
          'master',
        ].filter((branch, index, arr) => branch && arr.indexOf(branch) === index)

        for (const branch of branchesToTry) {
          if (timedOut) break
          try {
            const configApi = new GitHubAPI(token, username, repoName, branch)

            const configFile = await configApi.getFile(configPath, branch)
            if (timedOut) break

            if (!configFile.content) continue
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

            store.markConfigChecked(repoName, branch)

            if (shouldUseGitHub) {
              const result: ConfigCheckResult = {
                ...config,
                owner: username,
                repo: repoName,
                branch: config.branch || branch,
              }
              return result
            } else {
              return null
            }
          } catch {
            continue
          }
        }

        store.markConfigChecked(repoName, branchesToTry[0] || 'main')
        return null
      } catch (error) {
        debugError('[ConfigCheck] Failed:', error)
        store.markConfigChecked('img.shenzjd.com', store.branch || 'main')
        return null
      } finally {
        clearTimeout(timeoutHandle)
      }
    },
    [] // ✅ 空依赖数组：通过 ref 获取最新 configStore，避免每次 render 都重新创建
  )

  return { checkConfig }
}
