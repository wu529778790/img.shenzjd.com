'use client'

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GitHubAPI } from '@/lib/github'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'

export interface RepoFolder {
  name: string
  path: string
  type: 'dir'
}

export function useRepoFolders() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || ''
  const config = useConfigStore()

  const fetchFolders = useCallback(async (): Promise<RepoFolder[]> => {
    if (!token) {
      throw new Error('Not authenticated')
    }

    const { owner, repo, branch } = config

    if (!owner || !repo || !branch) {
      return []
    }

    const api = new GitHubAPI(token, owner, repo, branch)
    const contents = await api.listContents('')

    // 过滤出文件夹
    return contents
      .filter((item) => item.type === 'dir')
      .map((item) => ({
        name: item.name,
        path: item.path,
        type: 'dir' as const,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [token, config.owner, config.repo, config.branch])

  return useQuery({
    queryKey: ['repo-folders', config.owner, config.repo, config.branch],
    queryFn: fetchFolders,
    enabled: !!token && !!config.owner && !!config.repo && !!config.branch,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  })
}
