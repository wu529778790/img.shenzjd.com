'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Save, FolderGit, FolderOpen, ExternalLink, LogIn, Loader2, GitBranch } from 'lucide-react'
import { socialLinks } from '@/lib/constants'
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

        {session?.owner && session?.repo && (
          <CardAnimation delay={0.1} className={`${CARD_CLASSES} mt-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-1">GitHub 仓库</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {session.owner}/{session.repo}
                </p>
              </div>
              <a
                href={`https://github.com/${session.owner}/${session.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                查看仓库
              </a>
            </div>
          </CardAnimation>
        )}

        {/* 社交链接 */}
        <CardAnimation delay={0.2} className={`${CARD_CLASSES} mt-6`}>
          <h3 className="text-sm font-medium mb-3">关注我们</h3>
          <div className="flex items-center gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
              >
                <SocialIcon name={link.icon} className="h-4 w-4" />
                {link.name}
              </a>
            ))}
          </div>
        </CardAnimation>
      </PageTransition>
    </div>
  )
}

function SocialIcon({ name, className }: { name: string; className?: string }) {
  if (name === 'telegram') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    )
  }
  if (name === 'github') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    )
  }
  if (name === 'x') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  }
  return null
}
