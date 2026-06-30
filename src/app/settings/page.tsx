'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Trash2, FolderGit, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useConfigStore, type ConfigState } from '@/stores/configStore'
import { useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
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

      <div className="space-y-5">
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
        <div className="space-y-3">
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

          <Button onClick={handleManualConfig} className="w-full mt-4">
            保存配置
          </Button>
        </div>
      </div>

      {/* 清空配置 */}
      <div className="mt-4 pt-5 border-t border-red-100 dark:border-red-900/30">
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

  const [activeSection, setActiveSection] = useState(0)

  const sections = [
    { id: 'github-config', label: '图床配置', icon: FolderGit, description: '配置 GitHub 仓库' },
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
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </PageTransition>
    </div>
  )
}
