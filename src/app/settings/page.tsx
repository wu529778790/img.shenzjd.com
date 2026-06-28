'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Settings, Moon, Sun, Monitor, Trash2, Lock, Link2, Globe, Zap, Image, Shield, ShieldAlert, User, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useConfigStore, type ConfigState } from '@/stores/configStore'
import { useThemeStore } from '@/hooks/useTheme'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ── Section components (defined outside SettingsPage for stable identity) ─────

function AppearanceSection({
  theme,
  onThemeChange,
}: {
  theme: 'light' | 'dark' | 'system'
  onThemeChange: (t: 'light' | 'dark' | 'system') => void
}) {
  return (
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <Sun className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">主题模式</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: 'light', icon: Sun, label: '浅色' },
          { value: 'dark',  icon: Moon, label: '深色' },
          { value: 'system', icon: Monitor, label: '跟随系统' },
        ].map((option) => {
          const Icon = option.icon
          const isSelected = theme === option.value
          return (
            <motion.div key={option.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onThemeChange(option.value as 'light' | 'dark' | 'system')}
                className={cn(
                  'w-full h-auto py-4 flex flex-col items-center gap-2 rounded-xl transition-all',
                  isSelected && 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-800'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{option.label}</span>
              </Button>
            </motion.div>
          )
        })}
      </div>
    </CardAnimation>
  )
}

function ImageProcessingSection({ configStore }: { configStore: ConfigState }) {
  return (
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <Image className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">图床配置</h2>
      </div>

      <div className="space-y-8">
        {/* 压缩设置 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
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
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
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

function DangerSection({
  onClearConfig,
  onClearAuth,
}: {
  onClearConfig: () => void
  onClearAuth: () => void
}) {
  return (
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-100 dark:border-red-900/50">
        <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">危险操作</h2>
      </div>
      <div className="space-y-4">
        <motion.div
          whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
          className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
        >
          <div className="flex-1">
            <p className="font-medium text-red-600 dark:text-red-400">清空配置</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              清除所有本地配置，下次使用需要重新配置图床
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="destructive" onClick={onClearConfig}>
              <Trash2 className="h-4 w-4 mr-2" />
              清空配置
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
          className="flex items-center justify-between p-4 rounded-xl -mx-2 transition-colors"
        >
          <div className="flex-1">
            <p className="font-medium text-red-600 dark:text-red-400">退出登录</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              清除登录状态，需要重新登录
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="destructive" onClick={onClearAuth}>
              <Trash2 className="h-4 w-4 mr-2" />
              退出登录
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </CardAnimation>
  )
}

function AccountSection() {
  return (
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">账户</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">更多账户设置即将推出。</p>
    </CardAnimation>
  )
}

function AboutSection() {
  return (
    <CardAnimation delay={0} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
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

// ── Main page component ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const configStore: ConfigState = useConfigStore()
  const { theme, setTheme } = useThemeStore()

  const [activeSection, setActiveSection] = useState(0)

  const sections = [
    { id: 'appearance', label: '外观', icon: Sun },
    { id: 'image',      label: '图片处理', icon: Image },
    { id: 'network',    label: '网络', icon: Globe },
    { id: 'danger',     label: '危险操作', icon: ShieldAlert },
    { id: 'account',    label: '账户', icon: User },
    { id: 'about',      label: '关于', icon: Info },
  ] as const

  // 如果正在加载
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageTransition>
          <CardAnimation className="p-12 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="text-gray-500">加载中...</div>
          </CardAnimation>
        </PageTransition>
      </div>
    )
  }

  // 如果未登录，显示登录提示
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageTransition>
          <CardAnimation className="max-w-md mx-auto p-8 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6"
            >
              <Lock className="h-10 w-10 text-gray-400" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              需要登录
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              登录后才能管理设置
            </p>
            <p className="text-sm text-gray-400">
              请先登录以继续
            </p>
          </CardAnimation>
        </PageTransition>
      </div>
    )
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    toast.success('主题已更新')
  }

  const handleClearConfig = () => {
    if (!confirm('确定要清空所有配置吗？此操作不可恢复。')) return

    localStorage.removeItem('config-storage')
    configStore.resetConfig()
    toast.success('配置已清空')
    router.push('/config')
  }

  const handleClearAuth = async () => {
    if (!confirm('确定要退出登录吗？')) return

    await signOut({ redirect: false })
    toast.success('已退出登录')
    router.push('/login')
  }

  const handleCdnChange = (value: string | null) => {
    if (value) {
      configStore.updateConfig({ cdn: value as 'github' | 'jsdelivr' | 'github-pages' })
      toast.success('CDN 已更新')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PageTransition>
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Settings className="h-8 w-8 text-primary" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              设置
            </h1>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400"
          >
            管理您的偏好设置
          </motion.p>
        </motion.div>

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
                        ? 'bg-primary/10 text-primary shadow-sm'
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

                {activeSection === 0 && (
                  <AppearanceSection theme={theme} onThemeChange={handleThemeChange} />
                )}
                {activeSection === 1 && <ImageProcessingSection configStore={configStore} />}
                {activeSection === 2 && (
                  <NetworkSection configStore={configStore} onCdnChange={handleCdnChange} />
                )}
                {activeSection === 3 && (
                  <DangerSection onClearConfig={handleClearConfig} onClearAuth={handleClearAuth} />
                )}
                {activeSection === 4 && <AccountSection />}
                {activeSection === 5 && <AboutSection />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </PageTransition>
    </div>
  )
}
