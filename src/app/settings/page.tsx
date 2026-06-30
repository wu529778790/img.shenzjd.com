'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Save, FolderGit, FolderOpen, GitBranch, Loader2, ExternalLink } from 'lucide-react'
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
import { useAuthDialog } from '@/components/auth'
import { GitHubAPI } from '@/lib/github'

const CARD_CLASSES = 'p-6 rounded-2xl bg-card border shadow-sm'

export default function SettingsPage() {
  const { status } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const configStore = useConfigStore()

  const [repo, setRepo] = useState(configStore.repo)
  const [branch, setBranch] = useState(configStore.branch || 'main')
  const [directory, setDirectory] = useState(configStore.directory)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (configStore.repo && !repo) {
      setRepo(configStore.repo)
      setBranch(configStore.branch || 'main')
      setDirectory(configStore.directory)
    }
  }, [configStore.repo, configStore.branch, configStore.directory, repo])

  useEffect(() => {
    if (status === 'unauthenticated') {
      openLoginDialog()
    }
  }, [status, openLoginDialog])

  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['branches-setting', configStore.owner, configStore.repo],
    queryFn: async () => {
      const token = localStorage.getItem('github_token')
      if (!token || !configStore.owner || !configStore.repo) return []
      const api = new GitHubAPI(token, configStore.owner, configStore.repo)
      try {
        return await api.getBranches()
      } catch {
        return ['main']
      }
    },
    enabled: !!configStore.owner && !!configStore.repo,
  })

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="p-12 text-center rounded-2xl bg-card border shadow-sm">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  const hasChanges = repo !== (configStore.repo || '') ||
    branch !== (configStore.branch || 'main') ||
    directory !== (configStore.directory || '')

  const handleSave = () => {
    if (!repo?.trim()) {
      toast.error('请填写仓库名')
      return
    }
    if (!branch.trim()) {
      toast.error('请选择分支')
      return
    }
    setSaving(true)
    configStore.updateConfig({
      repo: repo.trim(),
      branch: branch.trim(),
      directory: directory?.trim() || '',
    })
    toast.success('设置已保存')
    setSaving(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <PageTransition>
        <CardAnimation delay={0} className={CARD_CLASSES}>
          <div className="flex items-center gap-2 mb-5 pb-3 border-b">
            <FolderGit className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">图床配置</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="repo" className="mb-1.5 block text-sm font-medium">仓库名</Label>
              <div className="relative">
                <FolderGit className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="repo"
                  value={repo || ''}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="例如：img.shenzjd.com"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                存储图片的 GitHub 仓库名称
              </p>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-medium">分支</Label>
              {loadingBranches ? (
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载分支中...
                </div>
              ) : branches.length > 0 ? (
                <Select value={branch} onValueChange={(v) => setBranch(v ?? 'main')}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分支" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="pl-10"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">
                图片存储的 Git 分支
              </p>
            </div>

            <div>
              <Label htmlFor="directory" className="mb-1.5 block text-sm font-medium">目录（可选）</Label>
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
              <p className="text-xs text-muted-foreground mt-1.5">
                上传时自动创建，无需手动在 GitHub 上创建
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                保存设置
              </Button>
              {hasChanges && (
                <span className="ml-3 text-xs text-muted-foreground">有未保存的更改</span>
              )}
            </div>
          </div>
        </CardAnimation>

        {configStore.owner && configStore.repo && (
          <CardAnimation delay={0.1} className={`${CARD_CLASSES} mt-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-1">GitHub 仓库</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {configStore.owner}/{configStore.repo}
                </p>
              </div>
              <a
                href={`https://github.com/${configStore.owner}/${configStore.repo}`}
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
