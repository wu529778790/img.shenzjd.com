'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Save, FolderGit, FolderOpen, ExternalLink, LogIn, Loader2, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useConfigStore } from '@/stores/configStore'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { useWxAuthSession, ensureReady, tryGetCredential } from '@/hooks/useWxAuthSession'
import { GitHubAPI } from '@/lib/github'
import { ManagementSkeleton } from '@/components/loading/Skeleton'

const CARD_CLASSES = 'p-6 rounded-2xl bg-card border shadow-sm'

export default function SettingsPage() {
  const { session, refreshSession } = useWxAuthSession()
  const configStore = useConfigStore()

  const [directory, setDirectory] = useState(configStore.directory)
  const [creatingDir, setCreatingDir] = useState(false)
  const [branch, setBranch] = useState(configStore.branch || 'main')
  const [saving, setSaving] = useState(false)

  const loggedIn = !!session?.loggedIn

  useEffect(() => {
    if (configStore.directory) {
      setDirectory(configStore.directory)
    }
  }, [configStore.directory])

  useEffect(() => {
    if (configStore.branch) {
      setBranch(configStore.branch)
    }
  }, [configStore.branch])

  // 从 GitHub 拉取仓库实际分支列表（installation token 只覆盖授权仓库，读取分支足够）
  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['branches-setting', session?.owner, session?.repo],
    queryFn: async () => {
      const cred = await tryGetCredential()
      if (!cred || !cred.owner || !cred.repo) return []
      const api = new GitHubAPI(cred.token, cred.owner, cred.repo)
      try {
        return await api.getBranches()
      } catch {
        return ['main', 'master']
      }
    },
    enabled: loggedIn && !!session?.owner && !!session?.repo,
    staleTime: 60 * 1000,
    retry: false,
  })

  // 从 GitHub 拉取仓库实际目录列表（Git Trees API，按当前数据分支）
  const { data: directories = [], isLoading: loadingDirs } = useQuery({
    queryKey: ['directories-setting', session?.owner, session?.repo, branch],
    queryFn: async () => {
      const cred = await tryGetCredential()
      if (!cred || !cred.owner || !cred.repo) return []
      const api = new GitHubAPI(cred.token, cred.owner, cred.repo, branch)
      try {
        const files = await api.listAllFilesWithTree()
        const dirs = new Set<string>()
        for (const file of files) {
          const parts = file.path.split('/')
          // 多级目录逐级收录（a/b/c.txt → a、a/b）
          for (let i = 1; i < parts.length; i++) {
            dirs.add(parts.slice(0, i).join('/'))
          }
        }
        dirs.delete('.img.shenzjd.com') // 配置目录不作为上传目录候选
        return [...dirs].sort()
      } catch {
        return []
      }
    },
    enabled: loggedIn && !!session?.owner && !!session?.repo,
    staleTime: 60 * 1000,
    retry: false,
  })

  // 已保存的分支必须在选项里（例如远端列表拉取失败时手动输入过的值）
  const branchOptions = branches.includes(branch || 'main')
    ? branches
    : [...branches, branch || 'main'].filter(Boolean)

  // 目录下拉候选：仓库实际目录 + 当前已保存值；空值用哨兵（Select 不支持空字符串 value）
  const ROOT_DIR = '__root__'
  const NEW_DIR = '__new__'
  const dirOptions = directories.includes(directory || '')
    ? directories
    : directory
      ? [...directories, directory].sort()
      : directories

  const handleSave = () => {
    const trimmedBranch = branch?.trim() || 'main'
    if (/\s/.test(trimmedBranch)) {
      toast.error('分支名不能包含空格')
      return
    }
    setSaving(true)
    configStore.updateConfig({
      directory: directory?.trim() || '',
      branch: trimmedBranch,
    })
    toast.success('设置已保存')
    setSaving(false)
  }

  // 未登录时展示登录引导（wx-auth 弹出登录，成功后刷新会话）
  const handleLogin = useCallback(async () => {
    try {
      await ensureReady()
      await refreshSession()
    } catch {
      // 用户取消登录或引导未完成，保持当前页面状态
    }
  }, [refreshSession])

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <ManagementSkeleton />
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <FolderGit className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">请先登录</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">登录后即可管理图床设置</p>
          <Button onClick={handleLogin} className="gap-2">
            <LogIn className="h-4 w-4" />
            立即登录
          </Button>
        </div>
      </div>
    )
  }

  // 已登录但 GitHub 未绑定/未开通 → 引导卡片（ensureReady 会依次弹出绑定/安装/开通引导）
  const needsGithubBinding = loggedIn && !session?.repo

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <PageTransition>
        {needsGithubBinding && (
          <CardAnimation delay={0} className={`${CARD_CLASSES} mb-6 border-primary/40`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1">还没有绑定 GitHub</h3>
                <p className="text-xs text-muted-foreground">
                  绑定 GitHub 账号、安装 GitHub App 并初始化图床仓库后即可使用（首次开通会自动创建仓库，需要几秒）
                </p>
              </div>
              <Button onClick={handleLogin} className="gap-2 shrink-0">
                <FolderGit className="h-4 w-4" />
                绑定 GitHub
              </Button>
            </div>
          </CardAnimation>
        )}

        <CardAnimation delay={0} className={CARD_CLASSES}>
          <div className="flex items-center gap-2 mb-5 pb-3 border-b">
            <FolderGit className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">图床配置</h2>
          </div>

          <div className="space-y-4">
            {/* 仓库：wx-auth 托管，只读展示；分支/目录均隶属于该仓库 */}
            {session?.owner && session?.repo && (
              <div>
                <Label className="mb-1.5 block text-sm font-medium">仓库</Label>
                <div className="flex items-center justify-between gap-3 w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-muted/40">
                  <span className="text-sm font-mono text-foreground truncate">
                    {session.owner}/{session.repo}
                  </span>
                  <a
                    href={`https://github.com/${session.owner}/${session.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary shrink-0 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    查看仓库
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  由 wx-auth 统一创建与管理，不可修改
                </p>
              </div>
            )}

            <div>
              <Label className="mb-1.5 block text-sm font-medium">分支</Label>
              {loadingBranches ? (
                <div className="flex items-center gap-2 w-full h-10 px-3 rounded-md border text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载分支中...
                </div>
              ) : branchOptions.length > 0 ? (
                <Select value={branch || 'main'} onValueChange={(v) => setBranch(v ?? 'main')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择分支" />
                  </SelectTrigger>
                  <SelectContent>
                    {branchOptions.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={branch || ''}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="pl-10"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">
                图片上传与列表读取的分支；存量数据在 master 的仓库请选择 master
              </p>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-medium">目录（可选）</Label>
              {loadingDirs ? (
                <div className="flex items-center gap-2 w-full h-10 px-3 rounded-md border text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载目录中...
                </div>
              ) : creatingDir ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      value={directory || ''}
                      onChange={(e) => setDirectory(e.target.value)}
                      placeholder="输入新目录名，如 images 或 blog/2026"
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0"
                    onClick={() => setCreatingDir(false)}
                  >
                    完成
                  </Button>
                </div>
              ) : dirOptions.length > 0 ? (
                <Select
                  value={directory || ROOT_DIR}
                  onValueChange={(v) => {
                    if (v === NEW_DIR) {
                      setCreatingDir(true)
                    } else {
                      setDirectory(v === ROOT_DIR || !v ? '' : v)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="根目录（不使用子目录）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT_DIR}>根目录（不使用子目录）</SelectItem>
                    {dirOptions.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                    <SelectItem value={NEW_DIR}>＋ 新建目录…</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="directory"
                    value={directory || ''}
                    onChange={(e) => setDirectory(e.target.value)}
                    placeholder="例如：images（留空则存储在根目录）"
                    className="pl-10"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">
                上传时自动创建，无需手动在 GitHub 上创建
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                保存设置
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              仓库由 wx-auth 统一创建与管理，如需更换仓库请在 wx-auth 中调整 GitHub App 安装范围。
            </p>
          </div>
        </CardAnimation>

      </PageTransition>
    </div>
  )
}
