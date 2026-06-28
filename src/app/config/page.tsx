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

export default function ConfigPage() {
  const router = useRouter()
  const configStore = useConfigStore()

  const [loading, setLoading] = useState(false)
  const [repos, setRepos] = useState<Array<{ name: string; full_name: string }>>([])
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

  // 获取当前登录用户
  useEffect(() => {
    const fetchUser = async () => {
      const session = await getSession()
      if (session?.user) {
        setCurrentUser((session.user as any).name || session.user.email || '')
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
        const response = await fetch('/api/repos', {
          headers: { Authorization: `token ${(await getSession())?.accessToken}` },
        })

        console.log('Repos API response:', response.status, response.statusText)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Repos API error:', errorData)
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
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
        const response = await fetch(
          `/api/repos/${encodeURIComponent(currentUser)}/${encodeURIComponent(repo)}/branches`,
          { headers: { Authorization: `token ${(await getSession())?.accessToken}` } }
        )

        console.log('Branches API response:', response.status, response.statusText)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Branches API error:', errorData)
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        setBranches(Array.isArray(data) ? data.map((b: any) => b.name) : [])
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
      const createResponse = await fetch('/api/repos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `token ${(await getSession())?.accessToken}`,
        },
        body: JSON.stringify({
          name: repoName,
          description: 'ImgX image host',
          private: false,
        }),
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create repo')
      }

      updateConfig({
        owner: currentUser,
        repo: repoName,
        branch: 'main',
        directory: 'images',
      })

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

    updateConfig({
      owner: currentUser,
      repo,
      branch,
      directory,
    })

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
