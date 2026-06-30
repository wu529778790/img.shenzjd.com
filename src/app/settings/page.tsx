'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Save, FolderGit, FolderOpen, GitBranch, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useConfigStore } from '@/stores/configStore'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { useAuthDialog } from '@/components/auth'

const CARD_CLASSES = 'p-6 rounded-2xl bg-card border shadow-sm'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const configStore = useConfigStore()

  const [repo, setRepo] = useState(configStore.repo || '')
  const [branch, setBranch] = useState(configStore.branch || 'main')
  const [directory, setDirectory] = useState(configStore.directory || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      openLoginDialog()
    }
  }, [status, openLoginDialog])

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="p-12 text-center rounded-2xl bg-card border shadow-sm">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    if (!repo.trim()) {
      toast.error('请填写仓库名')
      return
    }
    if (!branch.trim()) {
      toast.error('请填写分支名')
      return
    }

    setSaving(true)
    configStore.updateConfig({
      repo: repo.trim(),
      branch: branch.trim(),
      directory: directory.trim(),
    })
    toast.success('设置已保存')
    setSaving(false)
  }

  const hasChanges = repo !== (configStore.repo || '') ||
    branch !== (configStore.branch || 'main') ||
    directory !== (configStore.directory || '')

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <PageTransition>
        {/* 图床配置 */}
        <CardAnimation delay={0} className={CARD_CLASSES}>
          <div className="flex items-center gap-2 mb-5 pb-3 border-b">
            <FolderGit className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">图床配置</h2>
          </div>

          <div className="space-y-4">
            {/* 仓库名 */}
            <div>
              <Label htmlFor="repo" className="mb-1.5 block text-sm font-medium">仓库名</Label>
              <div className="relative">
                <FolderGit className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="repo"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="例如：img.shenzjd.com"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                存储图片的 GitHub 仓库名称
              </p>
            </div>

            {/* 分支 */}
            <div>
              <Label htmlFor="branch" className="mb-1.5 block text-sm font-medium">分支</Label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                图片存储的 Git 分支
              </p>
            </div>

            {/* 目录 */}
            <div>
              <Label htmlFor="directory" className="mb-1.5 block text-sm font-medium">目录（可选）</Label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="directory"
                  value={directory}
                  onChange={(e) => setDirectory(e.target.value)}
                  placeholder="例如：images（留空则存储在根目录）"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                图片在仓库中的文件夹路径，留空则存储在根目录
              </p>
            </div>

            {/* 保存按钮 */}
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

        {/* 当前配置信息 */}
        <CardAnimation delay={0.1} className={`${CARD_CLASSES} mt-6`}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">当前配置</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">用户</span>
              <span className="font-mono">{session?.user?.name || session?.user?.email || '-'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">仓库</span>
              <span className="font-mono">{configStore.owner || '-'}/{configStore.repo || '-'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">分支</span>
              <span className="font-mono">{configStore.branch || '-'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">目录</span>
              <span className="font-mono">{configStore.directory || '（根目录）'}</span>
            </div>
          </div>
        </CardAnimation>
      </PageTransition>
    </div>
  )
}
