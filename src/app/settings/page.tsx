'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Save, FolderGit, FolderOpen, GitBranch, Loader2, ExternalLink } from 'lucide-react'
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
      </PageTransition>
    </div>
  )
}
