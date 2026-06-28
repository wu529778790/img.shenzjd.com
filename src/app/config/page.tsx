'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'
import { Settings, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useConfigStore } from '@/stores/configStore'
import { useQueryClient } from '@tanstack/react-query'
import { GitHubAPI, GitHubRepo } from '@/lib/github'

export default function ConfigPage() {
  const router = useRouter()
  const configStore = useConfigStore()
  const queryClient = useQueryClient()

  const [loading, setLoading] = useState(false)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [branches, setBranches] = useState<string[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [currentUser, setCurrentUser] = useState<string>('')

  // 从 configStore 获取属性
  const {
    owner,
    repo,
    branch,
    directory,
    updateConfig,
  } = configStore

  // 获取当前登录用户的 GitHub username
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await getSession()
        if (session?.user) {
          // 优先使用 GitHub username (login)，如果没有则使用 name 或 email
          const username = (session.user as any).githubUsername || session.user.name || session.user.email
          // 提取 @ 前的部分作为 username（如果是 email）
          const cleanUsername = username.includes('@') ? username.split('@')[0] : username
          setCurrentUser(cleanUsername)

        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }
    fetchUser()
  }, [])

  // 获取用户仓库列表
  useEffect(() => {
    if (!currentUser) return

    const fetchRepos = async () => {
      setLoadingRepos(true)
      try {
        const session = await getSession()
        const token = session?.accessToken as string | undefined
        if (!token) throw new Error('Not authenticated')

        const api = new GitHubAPI(token, currentUser, '')
        const data = await api.listRepos()
        setRepos(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch repos:', error)
        toast.error('获取仓库列表失败')
        setRepos([])
      } finally {
        setLoadingRepos(false)
      }
    }

    fetchRepos()
  }, [currentUser])

  // 当选择仓库时，获取分支列表
  useEffect(() => {
    if (!repo || !currentUser) return

    const fetchBranches = async () => {
      setLoadingBranches(true)
      try {
        const session = await getSession()
        const token = session?.accessToken as string | undefined
        if (!token) throw new Error('Not authenticated')

        const api = new GitHubAPI(token, currentUser, repo)
        const data = await api.getRepo()
        const defaultBranch = data.default_branch

        // GitHub API 默认分支通常就是 main/master，暂时用默认分支
        setBranches([defaultBranch])
      } catch (error) {
        console.error('Failed to fetch branches:', error)
        toast.error(`获取分支列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
        setBranches([])
      } finally {
        setLoadingBranches(false)
      }
    }

    fetchBranches()
  }, [repo, currentUser])

  const handleAutoConfig = async () => {
    if (!currentUser) {
      toast.error('请先登录')
      return
    }

    setLoading(true)
    try {
      const repoName = `${currentUser.toLowerCase()}-imgx`

      // 创建新仓库
      const session = await getSession()
      const token = session?.accessToken as string | undefined
      if (!token) throw new Error('Not authenticated')

      const api = new GitHubAPI(token, currentUser, '')
      await api.createRepo(repoName, 'ImgX image host', false)

      updateConfig(
        {
          owner: currentUser,
          repo: repoName,
          branch: 'main',
          directory: 'images',
        },
        () => {
          // 配置更新后 invalidate 相关 queries
          queryClient.invalidateQueries({ queryKey: ['images'] })
          queryClient.invalidateQueries({ queryKey: ['repo-folders'] })
        }
      )

      toast.success('图床配置成功！')
      router.push('/upload')
    } catch (error) {
      console.error('Auto config failed:', error)
      toast.error('配置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleManualConfig = () => {
    if (!currentUser || !repo || !branch) {
      toast.error('请填写完整的配置信息')
      return
    }

    updateConfig(
      {
        owner: currentUser,
        repo,
        branch,
        directory,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['images'] })
        queryClient.invalidateQueries({ queryKey: ['repo-folders'] })
      }
    )

    toast.success('配置已保存')
    router.push('/upload')
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          图床配置
        </h1>
        <p className="text-gray-500 mt-2">配置您的 GitHub 图床仓库</p>
      </div>

      <div className="space-y-6">
        {/* 一键配置 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">一键配置</h2>
          <p className="text-gray-500 mb-4">
            自动创建图床仓库并完成基础配置
          </p>
          <Button onClick={handleAutoConfig} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                配置中...
              </>
            ) : (
              '一键配置'
            )}
          </Button>
        </Card>

        {/* 手动配置 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">手动配置</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="repo">仓库名</Label>
              {loadingRepos ? (
                <div className="flex items-center mt-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">加载中...</span>
                </div>
              ) : (
                <select
                  id="repo"
                  value={repo}
                  onChange={(e) => updateConfig({ repo: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="">选择仓库</option>
                  {repos.map((repoItem) => (
                    <option key={repoItem.full_name} value={repoItem.name}>
                      {repoItem.full_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <Label htmlFor="branch">分支</Label>
              {loadingBranches ? (
                <div className="flex items-center mt-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">加载中...</span>
                </div>
              ) : (
                <select
                  id="branch"
                  value={branch}
                  onChange={(e) => updateConfig({ branch: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                >
                  {branches.length > 0 ? (
                    branches.map((branchItem) => (
                      <option key={branchItem} value={branchItem}>
                        {branchItem}
                      </option>
                    ))
                  ) : (
                    <option value="main">main</option>
                  )}
                </select>
              )}
            </div>

            <div>
              <Label htmlFor="directory">图片目录</Label>
              <Input
                id="directory"
                value={directory}
                onChange={(e) => updateConfig({ directory: e.target.value })}
                placeholder="images"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                留空表示上传到仓库根目录
              </p>
            </div>
          </div>

          <Button onClick={handleManualConfig} className="w-full mt-6">
            保存配置
          </Button>
        </Card>
      </div>
    </div>
  )
}
