'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Trash2, Link2, Globe, Image, Info, RefreshCw, Check, FolderGit, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useConfigStore, type ConfigState } from '@/stores/configStore'
import { useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { useSaveConfigToGitHub } from '@/hooks/useConfigSync'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { motion, AnimatePresence } from 'framer-motion'
import { debugLog, debugError } from '@/lib/debug'
import { useAuthDialog } from '@/components/auth'
import { cn } from '@/lib/utils'
import { GitHubAPI } from '@/lib/github'

// ── 统一样式常量 ───────────────────────────────────────────────────────────────

const CARD_BASE_CLASSES = 'p-6 rounded-2xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 shadow-modern-sm'
const SECTION_HEADER_CLASSES = 'flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/80 dark:border-gray-700/50'
const SECTION_TITLE_CLASSES = 'text-xl font-semibold'
const SUBSECTION_HEADER_CLASSES = 'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3'
const ROW_CLASSES = 'flex items-center justify-between gap-4 py-2'
const ROW_CONTENT_CLASSES = 'flex-1 mr-4'
const ROW_LABEL_CLASSES = 'font-medium text-sm'
const ROW_DESCRIPTION_CLASSES = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5'
const INPUT_CLASSES = 'w-full px-3 py-2 text-sm font-mono rounded-lg border border-gray-200/80 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary/20'

// ── 可复用子组件 ───────────────────────────────────────────────────────────────

/**
 * Toggle 开关组件 - 统一开关样式
 */
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={cn('relative inline-flex items-center cursor-pointer', disabled && 'cursor-not-allowed opacity-50')}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:cursor-not-allowed"></div>
    </label>
  )
}

// ── Section components (defined outside SettingsPage for stable identity) ─────

function ImageProcessingSection({ configStore }: { configStore: ConfigState }) {
  const { updateConfig } = configStore

  return (
    <CardAnimation delay={0} className={CARD_BASE_CLASSES}>
      <div className={SECTION_HEADER_CLASSES}>
        {/* Lucide SVG icon, not an HTML <img> */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className={SECTION_TITLE_CLASSES}>图片处理</h2>
      </div>

      <div className="space-y-6">
        {/* 压缩设置 */}
        <div className="space-y-3">
          <h3 className={SUBSECTION_HEADER_CLASSES}>压缩设置</h3>

          {/* 压缩质量 */}
          <div className="flex items-start sm:items-center justify-between gap-4 py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
            <div className="flex-1 mr-4">
              <p className={ROW_LABEL_CLASSES}>默认压缩质量</p>
              <p className={ROW_DESCRIPTION_CLASSES}>
                当前: <span className="font-mono font-semibold text-primary">{configStore.compressionQuality}%</span>
              </p>
            </div>
            <div className="w-full sm:w-48 flex-shrink-0 mt-3 sm:mt-0 py-2">
              <Slider
                min={10}
                max={100}
                step={10}
                value={[configStore.compressionQuality]}
                onValueChange={(value) => updateConfig({ compressionQuality: (value as number[])[0] })}
              />
            </div>
          </div>

          {/* 自动压缩 */}
          <div className={ROW_CLASSES}>
            <div className={ROW_CONTENT_CLASSES}>
              <p className={ROW_LABEL_CLASSES}>自动压缩</p>
              <p className={ROW_DESCRIPTION_CLASSES}>
                上传时自动压缩图片以节省空间
              </p>
            </div>
            <Toggle
              checked={configStore.compressionEnabled}
              onChange={(checked) => updateConfig({ compressionEnabled: checked })}
            />
          </div>
        </div>

        {/* 水印设置 */}
        <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-gray-700/50">
          <h3 className={SUBSECTION_HEADER_CLASSES}>水印设置</h3>

          {/* 默认水印 */}
          <div className={ROW_CLASSES}>
            <div className={ROW_CONTENT_CLASSES}>
              <p className={ROW_LABEL_CLASSES}>默认水印</p>
              <p className={ROW_DESCRIPTION_CLASSES}>
                {configStore.watermarkText || '未设置'}
              </p>
            </div>
            <Toggle
              checked={configStore.watermarkEnabled}
              onChange={(checked) => updateConfig({ watermarkEnabled: checked })}
            />
          </div>
        </div>

        {/* 文件名设置 */}
        <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-gray-700/50">
          <h3 className={SUBSECTION_HEADER_CLASSES}>文件名设置</h3>

          {/* 使用原始文件名 */}
          <div className={ROW_CLASSES}>
            <div className={ROW_CONTENT_CLASSES}>
              <p className={ROW_LABEL_CLASSES}>保留原始文件名</p>
              <p className={ROW_DESCRIPTION_CLASSES}>
                关闭时自动使用时间戳命名（推荐）
              </p>
            </div>
            <Toggle
              checked={configStore.useOriginalFileName}
              onChange={(checked) => updateConfig({ useOriginalFileName: checked })}
            />
          </div>
        </div>

        {/* 复制链接设置 */}
        <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-gray-700/50">
          <h3 className={SUBSECTION_HEADER_CLASSES}>复制链接</h3>

          {/* 自动复制开关 */}
          <div className={ROW_CLASSES}>
            <div className={ROW_CONTENT_CLASSES}>
              <p className={ROW_LABEL_CLASSES}>上传后自动复制</p>
              <p className={ROW_DESCRIPTION_CLASSES}>
                上传成功后自动复制链接到剪贴板
              </p>
            </div>
            <Toggle
              checked={configStore.autoCopyAfterUpload}
              onChange={(checked) => updateConfig({ autoCopyAfterUpload: checked })}
            />
          </div>

          {/* 复制格式 */}
          <div className={ROW_CLASSES}>
            <div className={ROW_CONTENT_CLASSES}>
              <p className={ROW_LABEL_CLASSES}>复制格式</p>
              <p className={ROW_DESCRIPTION_CLASSES}>
                选择复制到剪贴板的链接格式
              </p>
            </div>
            <Select
              value={configStore.copyFormat}
              onValueChange={(value) => updateConfig({ copyFormat: value as 'markdown' | 'html' | 'bbcode' | 'url' })}
            >
              <SelectTrigger className="w-[160px] h-9 rounded-lg">
                <SelectValue placeholder="选择格式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="url">纯链接</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="bbcode">BBCode</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </CardAnimation>
  )
}

function ConfigSyncSection({ configStore }: { configStore: ConfigState }) {
  const saveMutation = useSaveConfigToGitHub()
  const [configPath, setConfigPath] = useState(configStore.configPath || '.imgx-config/config.json')
  const { updateConfig } = configStore

  const handleSyncToGitHub = async () => {
    try {
      const result = await saveMutation.mutateAsync()
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('同步失败')
    }
  }

  const handleConfigPathChange = (value: string) => {
    setConfigPath(value)
    updateConfig({ configPath: value })
  }

  return (
    <CardAnimation delay={0} className={CARD_BASE_CLASSES}>
      <div className={SECTION_HEADER_CLASSES}>
        <RefreshCw className="h-5 w-5 text-primary" />
        <h2 className={SECTION_TITLE_CLASSES}>配置同步</h2>
      </div>

      <div className="space-y-6">
        {/* 配置路径 */}
        <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl -mx-2 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
          <div className="flex-1">
            <p className={ROW_LABEL_CLASSES}>配置路径</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              配置将保存到 GitHub 仓库的此路径下
            </p>
          </div>
          <div className="w-full sm:w-64 flex-shrink-0 mt-2 sm:mt-0">
            <input
              type="text"
              value={configPath}
              onChange={(e) => handleConfigPathChange(e.target.value)}
              className={INPUT_CLASSES}
              placeholder=".imgx-config/config.json"
            />
          </div>
        </div>

        {/* 自动同步开关 */}
        <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl -mx-2 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
          <div className="flex-1">
            <p className={ROW_LABEL_CLASSES}>自动同步</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              配置变更时自动同步到 GitHub
            </p>
          </div>
          <Toggle
            checked={configStore.autoSync ?? true}
            onChange={(checked) => updateConfig({ autoSync: checked })}
          />
        </div>

        {/* 上次同步时间 */}
        {configStore.lastSyncAt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30"
          >
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-600 dark:text-green-400">已同步</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                上次同步: {new Date(configStore.lastSyncAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </motion.div>
        )}

        {/* 手动同步按钮 */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
          <Button
            onClick={handleSyncToGitHub}
            disabled={saveMutation.isPending || !configStore.owner || !configStore.repo}
            className="w-full"
            variant="default"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', saveMutation.isPending && 'animate-spin')} />
            {saveMutation.isPending ? '同步中...' : '立即同步配置到 GitHub'}
          </Button>
          {(!configStore.owner || !configStore.repo) && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              请先在&quot;图床配置&quot;中配置 GitHub 仓库
            </p>
          )}
        </div>
      </div>
    </CardAnimation>
  )
}

function NetworkSection({
  configStore,
  onCdnChange,
}: {
  configStore: ConfigState
  onCdnChange: (value: string | null) => void
}) {
  return (
    <CardAnimation delay={0} className={CARD_BASE_CLASSES}>
      <div className={SECTION_HEADER_CLASSES}>
        <Globe className="h-5 w-5 text-primary" />
        <h2 className={SECTION_TITLE_CLASSES}>CDN 服务</h2>
      </div>

      <div className="space-y-3">
        <Label htmlFor="cdn" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          CDN 服务
        </Label>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
          选择用于加速图片访问的 CDN 服务
        </p>
        <Select
          value={configStore.cdn}
          onValueChange={onCdnChange}
        >
          <SelectTrigger id="cdn" className="w-full h-11 rounded-xl">
            <SelectValue placeholder="选择 CDN" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="github">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>GitHub 原始链接</span>
              </div>
            </SelectItem>
            <SelectItem value="jsdelivr">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>jsDelivr CDN</span>
              </div>
            </SelectItem>
            <SelectItem value="jsdmirror">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>jsDMirror CDN（国内推荐）</span>
              </div>
            </SelectItem>
            <SelectItem value="github-pages">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span>GitHub Pages</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {configStore.cdn === 'github' && '使用 GitHub 原始链接，直接从 GitHub 服务器加载'}
            {configStore.cdn === 'jsdelivr' && '使用 jsDelivr CDN，全球加速访问'}
            {configStore.cdn === 'jsdmirror' && '使用 jsDMirror CDN，国内加速访问（推荐国内用户）'}
            {configStore.cdn === 'github-pages' && '使用 GitHub Pages 托管（需要启用 Pages）'}
          </p>
        </div>

        {/* 使用 raw 链接 */}
        {configStore.cdn === 'github' && (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl -mx-2 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/20"
              style={{ minHeight: 80 }}
            >
              <div className="flex-1">
                <p className={ROW_LABEL_CLASSES}>使用 Raw 链接</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  使用 raw.githubusercontent.com 而非 github.com
                </p>
              </div>
              <Toggle
                checked={configStore.useRaw}
                onChange={(checked) => onCdnChange(checked ? 'github' : null)}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </CardAnimation>
  )
}

function AboutSection() {
  const infoItems = [
    { label: '版本', value: '1.0.0', isCode: true },
    { label: '描述', value: '基于 GitHub 的现代化图床服务', isCode: false },
    { label: '技术栈', value: 'Next.js + TypeScript + Tailwind CSS', isCode: true },
  ]

  return (
    <CardAnimation delay={0} className={CARD_BASE_CLASSES}>
      <div className={SECTION_HEADER_CLASSES}>
        <Info className="h-5 w-5 text-primary" />
        <h2 className={SECTION_TITLE_CLASSES}>关于</h2>
      </div>
      <div className="space-y-3 text-sm">
        {infoItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3"
          >
            <span className="text-gray-500 dark:text-gray-400 min-w-[4rem] flex-shrink-0">{item.label}</span>
            {item.isCode ? (
              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded break-all">
                {item.value}
              </span>
            ) : (
              <span className="break-all">{item.value}</span>
            )}
          </motion.div>
        ))}
      </div>
    </CardAnimation>
  )
}

// ── Config Section (moved from /config page) ────────────────────────────────────

function GitHubRepoSelect({ currentUser, value, onRepoChange }: { currentUser: string, value: string, onRepoChange: (repo: string) => void }) {
  const { data: session, status } = useSession()

  // 直接从 session 派生 token，避免在 effect 中调用 setState
  const token = status === 'authenticated' ? session?.accessToken : undefined

  // 使用 React Query 缓存仓库列表
  const { data: repos = [], isLoading } = useQuery({
    queryKey: ['repos', currentUser],
    queryFn: async () => {
      if (!currentUser || !token) return []
      const api = new GitHubAPI(token, currentUser, '')
      const data = await api.listRepos()
      return Array.isArray(data) ? data : []
    },
    enabled: !!currentUser && !!token,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return (
    <div>
      <Label htmlFor="repo" className="mb-2 block">仓库名</Label>
      {isLoading ? (
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>加载中...</span>
        </div>
      ) : (
        <select
          id="repo"
          value={value}
          onChange={(e) => onRepoChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-white/80 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">选择仓库</option>
          {repos.map((repo) => (
            <option key={repo.full_name} value={repo.name}>
              {repo.full_name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

function ConfigSection({ configStore, onClearConfig }: { configStore: ConfigState, onClearConfig: () => void }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  // 使用惰性初始化从 configStore 恢复初始值，避免在 effect 中调用 setState
  const currentUser = useMemo(() => {
    const user = session?.user
    if (!user) return ''
    const username = user.githubUsername || user.name || user.email || ''
    return username.includes('@') ? username.split('@')[0] : username
  }, [session?.user])
  const [repo, setRepo] = useState(() => configStore.repo || '')
  const [branch, setBranch] = useState(() => configStore.branch || 'main')

  const { updateConfig } = configStore

  // 直接从 session 派生 token，避免在 effect 中调用 setState
  const token = session?.accessToken

  // 使用 React Query 缓存分支列表
  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['branches', currentUser, repo],
    queryFn: async () => {
      if (!currentUser || !repo || !token) return []
      const api = new GitHubAPI(token, currentUser, repo)
      const branchList = await api.getBranches()

      if (branchList.length > 0) {
        return branchList
      } else {
        const repoInfo = await api.getRepo()
        return [repoInfo.default_branch]
      }
    },
    enabled: !!currentUser && !!repo && !!token,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const handleAutoConfig = async () => {
    if (!currentUser) {
      toast.error('请先登录')
      return
    }

    setLoading(true)
    try {
      const repoName = 'img.shenzjd.com'

      if (!token) throw new Error('Not authenticated')

      const api = new GitHubAPI(token, currentUser, '')
      await api.createRepo(repoName, 'Free image hosting powered by img.shenzjd.com', false)

      // 更新 README 为精美宣传内容
      const readmeContent = `# 🚀 img.shenzjd.com

> **现代化的免费图床服务** — 上传即用，全球加速。

👉 立即体验：[**img.shenzjd.com**](https://img.shenzjd.com/)

---

## ✨ 为什么选择 img.shenzjd.com？

- 🔗 **Markdown / HTML / BBCode / 纯链接** — 一键复制，无缝嵌入
- 📦 **批量拖拽上传** — 支持粘贴、批量处理
- 🗜️ **智能压缩** — 自动优化图片，节省带宽
- 🌐 **多 CDN 加速** — GitHub Raw / jsDelivr / jsDMirror / GitHub Pages
- 🎨 **水印保护** — 自定义文字水印，保护原创内容
- ⚡ **零配置上手** — GitHub 账号登录即用，无需额外设置

---

📦 本仓库由 [img.shenzjd.com](https://img.shenzjd.com/) 自动创建并管理
`
      const repoApi = new GitHubAPI(token, currentUser, repoName, 'main')
      const readmeBlob = new Blob([readmeContent], { type: 'text/plain' })
      await repoApi.createOrUpdateFile('README.md', readmeBlob, 'docs: init README [skip ci]')

      updateConfig(
        {
          owner: currentUser,
          repo: repoName,
          branch: 'main',
          directory: '',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['images'] })
          queryClient.invalidateQueries({ queryKey: ['repo-folders'] })
        }
      )

      toast.success('图床配置成功！')
      router.push('/')
    } catch (error) {
      debugError('Auto config failed:', error)
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
        directory: '',
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['images'] })
        queryClient.invalidateQueries({ queryKey: ['repo-folders'] })
      }
    )

    toast.success('配置已保存')
    router.push('/')
  }

  return (
    <CardAnimation delay={0} className={CARD_BASE_CLASSES}>
      <div className={SECTION_HEADER_CLASSES}>
        <FolderGit className="h-5 w-5 text-primary" />
        <h2 className={SECTION_TITLE_CLASSES}>图床配置</h2>
      </div>

      <div className="space-y-6">
        {/* 一键配置 - 仅在未配置时显示 */}
        {!configStore.owner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold mb-2">一键配置</h3>
              <p className="text-gray-500 mb-4 text-sm">
                自动创建图床仓库并完成基础配置
              </p>
              <Button onClick={handleAutoConfig} disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    配置中...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    一键配置
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* 手动配置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">手动配置</h3>

          {/* GitHub 仓库选择 */}
          <GitHubRepoSelect currentUser={currentUser} value={repo} onRepoChange={setRepo} />

          {/* 分支选择 */}
          <div>
            <Label htmlFor="branch" className="mb-2 block">分支</Label>
            {loadingBranches ? (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>加载中...</span>
              </div>
            ) : (
              <select
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white/80 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
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

          <Button onClick={handleManualConfig} className="w-full mt-6">
            保存配置
          </Button>
        </div>
      </div>

      {/* 清空配置 */}
      <div className="mt-6 pt-6 border-t border-red-100 dark:border-red-900/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-red-600 dark:text-red-400">清空配置</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              清除所有本地配置，需要重新配置
            </p>
          </div>
          <Button variant="destructive" onClick={onClearConfig} size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            清空配置
          </Button>
        </div>
      </div>
    </CardAnimation>
  )
}


export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const configStore: ConfigState = useConfigStore()
  const queryClient = useQueryClient()

  const [activeSection, setActiveSection] = useState(0)

  const sections = [
    { id: 'github-config', label: '图床配置', icon: FolderGit, description: '配置 GitHub 仓库' },
    { id: 'image',        label: '图片处理', icon: Image, description: '压缩和水印' },
    { id: 'network',      label: 'CDN',      icon: Globe, description: '加速服务' },
    { id: 'config-sync',  label: '配置同步', icon: RefreshCw, description: '同步到 GitHub' },
    { id: 'about',        label: '关于',     icon: Info, description: '版本信息' },
  ] as const

  // 未登录时自动打开登录弹窗
  useEffect(() => {
    debugLog('[Settings] Status changed:', status, 'Session:', !!session)
    if (status === 'unauthenticated') {
      debugLog('[Settings] Opening login dialog')
      openLoginDialog()
    }
  }, [status, openLoginDialog, session])

  // 如果正在加载
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <PageTransition>
          <CardAnimation className="p-12 text-center rounded-2xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 shadow-lg">
            <div className="text-gray-500">加载中...</div>
          </CardAnimation>
        </PageTransition>
      </div>
    )
  }

  const handleClearConfig = () => {
    if (!confirm('确定要清空所有配置吗？此操作不可恢复。')) return

    localStorage.removeItem('config-storage')
    configStore.resetConfig()
    toast.success('配置已清空')
    router.push('/config')
  }

  const handleCdnChange = (value: string | null) => {
    if (value) {
      configStore.updateConfig(
        { cdn: value as 'github' | 'jsdelivr' | 'jsdmirror' | 'github-pages' },
        () => {
          const { owner, repo, branch } = configStore
          if (owner && repo && branch) {
            queryClient.invalidateQueries({ queryKey: ['images', owner, repo, branch] })
          }
        }
      )
      toast.success('CDN 已更新')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <PageTransition>
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <nav className="space-y-1">
                {sections.map((section, index) => {
                  const Icon = section.icon
                  const isActive = activeSection === index
                  return (
                    <motion.button
                      key={section.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveSection(index)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex-1 text-left">
                        <div>{section.label}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {section.description}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="space-y-6"
              >
                {/* Mobile top tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:hidden scrollbar-hide">
                  {sections.map((section, index) => {
                    const Icon = section.icon
                    const isActive = activeSection === index
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(index)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {section.label}
                      </button>
                    )
                  })}
                </div>

                {activeSection === 0 && <ConfigSection configStore={configStore} onClearConfig={handleClearConfig} />}
                {activeSection === 1 && <ImageProcessingSection configStore={configStore} />}
                {activeSection === 2 && (
                  <NetworkSection configStore={configStore} onCdnChange={handleCdnChange} />
                )}
                {activeSection === 3 && (
                  <ConfigSyncSection configStore={configStore} />
                )}
                {activeSection === 4 && <AboutSection />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </PageTransition>
    </div>
  )
}
