'use client'

import { useCallback } from 'react'
import { GitHubAPI } from '@/lib/github'
import { useConfigStore } from '@/stores/configStore'
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

  const checkConfig = useCallback(
    async (force: boolean = false): Promise<ConfigCheckResult | null> => {
      const startTime = performance.now()
      console.log('[ConfigCheck] START', { force, cached: !force && !!configStore.configLastCheckedAt })

      if (!force && configStore.configLastCheckedAt && !configStore.needsConfigCheck(5 * 60 * 1000)) {
        console.log('[ConfigCheck] Cached, skipping')
        return null
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('github_token') : null
      if (!token) {
        console.log('[ConfigCheck] No token, returning null')
        return null
      }

      let timedOut = false
      const timeoutHandle = setTimeout(() => {
        timedOut = true
        console.warn('[ConfigCheck] TIMEOUT after 20s')
        configStore.markConfigChecked('img.shenzjd.com', configStore.branch || 'main')
      }, 20000)

      try {
        const api = new GitHubAPI(token, '', '')
        console.log('[ConfigCheck] Fetching current user...')
        const t1 = performance.now()
        const currentUser = await api.getCurrentUser()
        if (timedOut) { console.log('[ConfigCheck] Aborted (timed out user)'); return null }
        console.log('[ConfigCheck] Got user:', currentUser.login, 'in', Math.round(performance.now() - t1), 'ms')
        const username = currentUser.login

        const repoName = 'img.shenzjd.com'
        const configPath = '.imgx-config/config.json'

        const branchesToTry = [
          configStore.branch,
          'main',
          'master',
        ].filter((branch, index, arr) => branch && arr.indexOf(branch) === index)

        console.log('[ConfigCheck] Trying branches:', branchesToTry)

        for (const branch of branchesToTry) {
          if (timedOut) break
          try {
            console.log('[ConfigCheck] Trying branch:', branch)
            const configApi = new GitHubAPI(token, username, repoName, branch)

            const t2 = performance.now()
            const configFile = await configApi.getFile(configPath, branch)
            if (timedOut) { console.log('[ConfigCheck] Aborted (timed out file)'); break }
            console.log('[ConfigCheck] Got file from', branch, 'in', Math.round(performance.now() - t2), 'ms')

            if (!configFile.content) continue
            const content = decodeConfigFromBase64(configFile.content)
            const config: Config = JSON.parse(content)

            const fileUpdatedAt = configFile.commit?.commit?.committer?.date || null
            const localUpdatedAt = configStore.lastSyncAt

            let shouldUseGitHub = true
            if (fileUpdatedAt && localUpdatedAt) {
              const fileTime = new Date(fileUpdatedAt).getTime()
              const localTime = new Date(localUpdatedAt).getTime()
              shouldUseGitHub = fileTime > localTime
            }

            configStore.markConfigChecked(repoName, branch)

            if (shouldUseGitHub) {
              const result: ConfigCheckResult = {
                ...config,
                owner: username,
                repo: repoName,
                branch: config.branch || branch,
              }
              console.log('[ConfigCheck] Using GitHub config from:', branch, 'TOTAL:', Math.round(performance.now() - startTime), 'ms')
              return result
            } else {
              console.log('[ConfigCheck] Using local config (GitHub older)')
              console.log('[ConfigCheck] TOTAL:', Math.round(performance.now() - startTime), 'ms')
              return null
            }
          } catch (err) {
            console.log('[ConfigCheck] Branch', branch, 'failed:', err)
            continue
          }
        }

        console.log('[ConfigCheck] All branches failed/timed out, TOTAL:', Math.round(performance.now() - startTime), 'ms')
        configStore.markConfigChecked(repoName, branchesToTry[0] || 'main')
        return null
      } catch (error) {
        console.error('[ConfigCheck] Failed:', error)
        console.log('[ConfigCheck] TOTAL:', Math.round(performance.now() - startTime), 'ms')
        configStore.markConfigChecked('img.shenzjd.com', configStore.branch || 'main')
        return null
      } finally {
        clearTimeout(timeoutHandle)
      }
    },
    [configStore]
  )

  return { checkConfig }
}
