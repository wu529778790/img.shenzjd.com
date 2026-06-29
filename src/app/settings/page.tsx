'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Settings, Trash2, Link2, Globe, Image, Info, FileText, Code, RefreshCw, Check, Copy, FolderGit, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useConfigStore, type ConfigState } from '@/stores/configStore'
import { useQueryClient } from '@tanstack/react-query'
import { useQuery, useMutation, useQueryClient as useTanStackQueryClient } from '@tanstack/react-query'
import { useSaveConfigToGitHub, useLoadConfigFromGitHub } from '@/hooks/useConfigSync'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { motion, AnimatePresence } from 'framer-motion'
import { debugLog, debugError } from '@/lib/debug'
import { useAuthDialog } from '@/components/auth'
import { cn } from '@/lib/utils'
import { GitHubAPI, GitHubRepo } from '@/lib/github'

// ── Section components (defined outside SettingsPage for stable identity) ─────

function ImageProcessingSection({ configStore }: { configStore: ConfigState }) {
  return (
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 shadow-modern-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/80 dark:border-gray-700/50">
        <Image className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">图床配置</h2>
      </div>

      <div className="space-y-8">
        {/* 压缩设置 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">压缩设置</h3>
          </div>

          {/* 压缩质量 */}
          <motion.div
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium">默认压缩质量</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                当前: <span className="font-mono font-semibold text-primary">{configStore.compressionQuality}%</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Slider
                min={10}
                max={100}
                step={10}
                value={[configStore.compressionQuality]}
                onValueChange={(value) => configStore.updateConfig({ compressionQuality: (value as number[])[0] })}
                className="w-36"
              />
            </div>
          </motion.div>

          {/* 自动压缩 */}
          <motion.div
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium">自动压缩</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                上传时自动压缩图片以节省空间
              </p>
            </div>
            <motion.label
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                checked={configStore.compressionEnabled}
                onChange={(e) => configStore.updateConfig({ compressionEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </motion.label>
          </motion.div>
        </div>

        {/* 水印设置 */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">水印设置</h3>
          </div>

          {/* 默认水印 */}
          <motion.div
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium">默认水印</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {configStore.watermarkText || '未设置'}
              </p>
            </div>
            <motion.label
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                checked={configStore.watermarkEnabled}
                onChange={(e) => configStore.updateConfig({ watermarkEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </motion.label>
          </motion.div>
        </div>

        {/* 文件名设置 */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">文件名设置</h3>
          </div>

          {/* 使用原始文件名 */}
          <motion.div
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium">保留原始文件名</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                关闭时自动使用时间戳命名（推荐），开启时保持上传时的文件名
              </p>
            </div>
            <motion.label
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                checked={configStore.useOriginalFileName}
                onChange={(e) => configStore.updateConfig({ useOriginalFileName: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </motion.label>
          </motion.div>
        </div>

        {/* 复制链接设置 */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">复制链接</h3>
          </div>

          {/* 自动复制开关 */}
          <motion.div
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium">上传后自动复制</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                上传成功后自动复制链接到剪贴板
              </p>
            </div>
            <motion.label
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                checked={configStore.autoCopyAfterUpload}
                onChange={(e) => configStore.updateConfig({ autoCopyAfterUpload: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </motion.label>
          </motion.div>

          {/* 复制格式 */}
          <motion.div
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium">复制格式</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                选择复制到剪贴板的链接格式
              </p>
            </div>
            <Select
              value={configStore.copyFormat}
              onValueChange={(value) => configStore.updateConfig({ copyFormat: value as 'markdown' | 'html' | 'bbcode' | 'url' })}
            >
              <SelectTrigger className="w-[180px] h-10 rounded-xl">
                <SelectValue placeholder="选择格式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="url">纯链接</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="bbcode">BBCode</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* 格式预览 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
          >
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">预览：</p>
            <code className="text-xs font-mono text-primary break-all">
              {configStore.copyFormat === 'markdown' && '![image.png](https://example.com/image.png)'}
              {configStore.copyFormat === 'url' && 'https://example.com/image.png'}
              {configStore.copyFormat === 'html' && '<img src="https://example.com/image.png" alt="image.png" />'}
              {configStore.copyFormat === 'bbcode' && '[img]https://example.com/image.png[/img]'}
            </code>
          </motion.div>
        </div>
      </div>
    </CardAnimation>
  )
}

function ConfigSyncSection({ configStore }: { configStore: ConfigState }) {
  const saveMutation = useSaveConfigToGitHub()
  const [configPath, setConfigPath] = useState(configStore.configPath || '.imgx-config/config.json')

  const handleSyncToGitHub = async () => {
    try {
      const result = await saveMutation.mutateAsync()
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('同步失败')
    }
  }

  const handleConfigPathChange = (value: string) => {
    setConfigPath(value)
    configStore.updateConfig({ configPath: value })
  }

  return (
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 shadow-modern-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/80 dark:border-gray-700/50">
        <RefreshCw className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">配置同步</h2>
      </div>

      <div className="space-y-6">
        {/* 配置路径 */}
        <motion.div
          whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
          className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
        >
          <div className="flex-1">
            <p className="font-medium">配置路径</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              配置将保存到 GitHub 仓库的此路径下
            </p>
          </div>
          <div className="w-64">
            <input
              type="text"
              value={configPath}
              onChange={(e) => handleConfigPathChange(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-gray-200/80 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder=".imgx-config/config.json"
            />
          </div>
        </motion.div>

        {/* 自动同步开关 */}
        <motion.div
          whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
          className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
        >
          <div className="flex-1">
            <p className="font-medium">自动同步</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              配置变更时自动同步到 GitHub
            </p>
          </div>
          <motion.label
            whileTap={{ scale: 0.95 }}
            className="relative inline-flex items-center cursor-pointer"
          >
            <input
              type="checkbox"
              checked={configStore.autoSync ?? true}
              onChange={(e) => configStore.updateConfig({ autoSync: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </motion.label>
        </motion.div>

        {/* 上次同步时间 */}
        {configStore.lastSyncAt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50"
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
              请先在"网络"中配置 GitHub 仓库
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
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 shadow-modern-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/80 dark:border-gray-700/50">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">CDN 服务</h2>
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
        >
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {configStore.cdn === 'github' && '使用 GitHub 原始链接，直接从 GitHub 服务器加载'}
            {configStore.cdn === 'jsdelivr' && '使用 jsDelivr CDN，全球加速访问'}
            {configStore.cdn === 'jsdmirror' && '使用 jsDMirror CDN，国内加速访问（推荐国内用户）'}
            {configStore.cdn === 'github-pages' && '使用 GitHub Pages 托管（需要启用 Pages）'}
          </p>
        </motion.div>

        {/* 使用 raw 链接 */}
        {configStore.cdn === 'github' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
            style={{ minHeight: 80 }} // ✅ 预留空间防止 CLS
          >
            <div className="flex-1">
              <p className="font-medium">使用 Raw 链接</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                使用 raw.githubusercontent.com 而非 github.com
              </p>
            </div>
            <motion.label
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                checked={configStore.useRaw}
                onChange={(e) => configStore.updateConfig({ useRaw: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </motion.label>
          </motion.div>
        )}
      </div>
    </CardAnimation>
  )
}

function AboutSection() {
  return (
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 shadow-modern-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/80 dark:border-gray-700/50">
        <Info className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">关于</h2>
      </div>
      <div className="space-y-3 text-sm">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-start gap-3"
        >
          <span className="text-gray-500 dark:text-gray-400 min-w-16">版本</span>
          <span className="font-mono font-semibold">1.0.0</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-start gap-3"
        >
          <span className="text-gray-500 dark:text-gray-400 min-w-16">描述</span>
          <span>基于 GitHub 的现代化图床服务</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18 }}
          className="flex items-start gap-3"
        >
          <span className="text-gray-500 dark:text-gray-400 min-w-16">仓库</span>
          <a
            href="https://github.com/wu529778790/img.shenzjd.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub
          </a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-3"
        >
          <span className="text-gray-500 dark:text-gray-400 min-w-16">技术栈</span>
          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
            Next.js + TypeScript + Tailwind CSS
          </span>
        </motion.div>
      </div>
    </CardAnimation>
  )
}

// ── Config Section (moved from /config page) ────────────────────────────────────

function GitHubRepoSelect({ currentUser, value, onRepoChange }: { currentUser: string, value: string, onRepoChange: (repo: string) => void }) {
  const [token, setToken] = useState<string | undefined>()
  const { data: session, status } = useSession()
  const queryClient = useTanStackQueryClient()

  // 从 session 获取 token
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      setToken(session.accessToken)
    } else if (status === 'unauthenticated') {
      setToken(undefined)
    }
  }, [session, status])

  // ✅ 使用 React Query 缓存仓库列表
  const { data: repos = [], isLoading } = useQuery({
    queryKey: ['repos', currentUser],
    queryFn: async () => {
      if (!currentUser || !token) return []
      const api = new GitHubAPI(token, currentUser, '')
      const data = await api.listRepos()
      return Array.isArray(data) ? data : []
    },
    enabled: !!currentUser && !!token,
    staleTime: 10 * 60 * 1000, // 10 分钟内使用缓存
    gcTime: 30 * 60 * 1000, // 30 分钟后垃圾回收
  })

  return (
    <div>
      <Label htmlFor="repo">仓库名</Label>
      {isLoading ? (
        <div className="flex items-center mt-1">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">加载中...</span>
        </div>
      ) : (
        <select
          id="repo"
          value={value}
          onChange={(e) => onRepoChange(e.target.value)}
          className="mt-1 w-full px-3 py-2 border rounded-md bg-white/80 dark:bg-gray-800/50"
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
  const { data: session } = useSession() // ✅ 使用 useSession
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState('')
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')
  const [directory, setDirectory] = useState('')
  const [token, setToken] = useState<string | undefined>()

  const { updateConfig } = configStore

  // 从 configStore 恢复配置到本地状态
  useEffect(() => {
    if (configStore.owner && configStore.repo) {
      // 仓库选择器的 value 是 repo.name，不是 owner/repo
      setRepo(configStore.repo)
    }
    if (configStore.branch) {
      setBranch(configStore.branch)
    }
    if (configStore.directory) {
      setDirectory(configStore.directory)
    }
  }, [configStore.owner, configStore.repo, configStore.branch, configStore.directory])

  // ✅ 修复：从 session 获取 token（替代 getSession）
  useEffect(() => {
    if (session?.accessToken) {
      setToken(session.accessToken)
    } else {
      setToken(undefined)
    }
  }, [session])

  // ✅ 修复：从 session 获取用户信息（替代 getSession）
  useEffect(() => {
    if (session?.user) {
      const username = (session.user as any).githubUsername || session.user.name || session.user.email
      const cleanUsername = username.includes('@') ? username.split('@')[0] : username
      setCurrentUser(cleanUsername)
    }
  }, [session])

  // ✅ 使用 React Query 缓存分支列表
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
    staleTime: 10 * 60 * 1000, // 10 分钟内使用缓存
    gcTime: 30 * 60 * 1000, // 30 分钟后垃圾回收
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
      await api.createRepo(repoName, 'ImgX image host', false)

      updateConfig(
        {
          owner: currentUser,
          repo: repoName,
          branch: 'main',
          directory: 'images',
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
        directory,
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
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 shadow-modern-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/80 dark:border-gray-700/50">
        <FolderGit className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">图床配置</h2>
      </div>

      <div className="space-y-6">
        {/* 一键配置 */}
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

        {/* 手动配置 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">手动配置</h3>
          <div className="space-y-4">
            <GitHubRepoSelect currentUser={currentUser} value={repo} onRepoChange={setRepo} />

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
                  onChange={(e) => setBranch(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md bg-white/80 dark:bg-gray-800/50"
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
                onChange={(e) => setDirectory(e.target.value)}
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
        </div>
      </div>

      {/* 清空配置 */}
      <div className="mt-6 pt-6 border-t border-red-100 dark:border-red-900/30">
        <div className="flex items-center justify-between">
          <div>
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
    { id: 'github-config', label: '图床配置', icon: FolderGit },  // 第一步：先配置
    { id: 'image',        label: '图片处理', icon: Image },        // 第二步：处理图片
    { id: 'network',      label: '网络',     icon: Globe },        // 第三步：网络设置
    { id: 'config-sync',  label: '配置同步', icon: RefreshCw },   // 第四步：同步配置
    { id: 'about',        label: '关于',     icon: Info },         // 第五步：关于
  ] as const

  // 未登录时自动打开登录弹窗
  useEffect(() => {
    debugLog('[Settings] Status changed:', status, 'Session:', !!session)  // Debug
    if (status === 'unauthenticated') {
      debugLog('[Settings] Opening login dialog')  // Debug
      openLoginDialog()
    }
  }, [status, openLoginDialog, session])

  // 如果正在加载
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
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
          // CDN 配置变更后，invalidate 图片列表（CDN URL 会变）
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PageTransition>
        {/* 页面标题 */}
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              {sections.map((section, index) => {
                const Icon = section.icon
                return (
                  <motion.button
                    key={section.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSection(index)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      activeSection === index
                        ? 'bg-primary/10 text-primary shadow-modern-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </motion.button>
                )
              })}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {/* Mobile top tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:hidden mb-4 scrollbar-hide">
                  {sections.map((section, index) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(index)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                          activeSection === index
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
