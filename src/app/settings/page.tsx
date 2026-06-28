'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Settings, Moon, Sun, Monitor, Trash2, Lock, Link2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useConfigStore } from '@/stores/configStore'
import { useThemeStore } from '@/hooks/useTheme'

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const configStore = useConfigStore()
  const { theme, setTheme } = useThemeStore()

  // 如果正在加载
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果未登录，显示登录提示
  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">需要登录</h2>
          <p className="text-gray-500 mb-4">
            登录后才能管理设置
          </p>
          <Button onClick={() => router.push('/login')}>
            去登录
          </Button>
        </div>
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
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          设置
        </h1>
        <p className="text-gray-500 mt-2">管理您的偏好设置</p>
      </div>

      <div className="space-y-6">
        {/* 主题设置 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">主题</h2>
          <div className="space-y-4">
            <div>
              <Label>外观</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('light')}
                  className="flex flex-col h-auto py-3"
                >
                  <Sun className="h-5 w-5 mb-1" />
                  <span className="text-xs">浅色</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('dark')}
                  className="flex flex-col h-auto py-3"
                >
                  <Moon className="h-5 w-5 mb-1" />
                  <span className="text-xs">深色</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('system')}
                  className="flex flex-col h-auto py-3"
                >
                  <Monitor className="h-5 w-5 mb-1" />
                  <span className="text-xs">跟随系统</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 图床配置 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">图床配置</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">默认压缩质量</p>
                <p className="text-sm text-gray-500">
                  当前: {configStore.compressionQuality}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  min={10}
                  max={100}
                  step={10}
                  value={[configStore.compressionQuality]}
                  onValueChange={(value) => configStore.updateConfig({ compressionQuality: (value as number[])[0] })}
                  className="w-32"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">自动压缩</p>
                <p className="text-sm text-gray-500">上传时自动压缩图片</p>
              </div>
              <input
                type="checkbox"
                checked={configStore.compressionEnabled}
                onChange={(e) => configStore.updateConfig({ compressionEnabled: e.target.checked })}
                className="rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">默认水印</p>
                <p className="text-sm text-gray-500">{configStore.watermarkText || '未设置'}</p>
              </div>
              <input
                type="checkbox"
                checked={configStore.watermarkEnabled}
                onChange={(e) => configStore.updateConfig({ watermarkEnabled: e.target.checked })}
                className="rounded"
              />
            </div>

            {/* CDN 设置 */}
            <div>
              <Label htmlFor="cdn">CDN 服务</Label>
              <p className="text-sm text-gray-500 mb-2">
                选择用于加速图片访问的 CDN 服务
              </p>
              <Select
                value={configStore.cdn}
                onValueChange={handleCdnChange}
              >
                <SelectTrigger id="cdn" className="w-full">
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
              <p className="text-xs text-gray-500 mt-2">
                {configStore.cdn === 'github' && '使用 GitHub 原始链接，直接从 GitHub 服务器加载'}
                {configStore.cdn === 'jsdelivr' && '使用 jsDelivr CDN，全球加速访问'}
                {configStore.cdn === 'jsdmirror' && '使用 jsDMirror CDN，国内加速访问（推荐国内用户）'}
                {configStore.cdn === 'github-pages' && '使用 GitHub Pages 托管（需要启用 Pages）'}
              </p>
            </div>

            {/* 使用 raw 链接 */}
            {configStore.cdn === 'github' && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">使用 Raw 链接</p>
                  <p className="text-sm text-gray-500">
                    使用 raw.githubusercontent.com 而非 github.com
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={configStore.useRaw}
                  onChange={(e) => configStore.updateConfig({ useRaw: e.target.checked })}
                  className="rounded"
                />
              </div>
            )}
          </div>
        </Card>

        {/* 数据管理 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">危险操作</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">清空配置</p>
                <p className="text-sm text-gray-500">
                  清除所有本地配置，下次使用需要重新配置图床
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleClearConfig}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                清空配置
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">退出登录</p>
                <p className="text-sm text-gray-500">
                  清除登录状态，需要重新登录
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleClearAuth}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                退出登录
              </Button>
            </div>
          </div>
        </Card>

        {/* 关于 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">关于</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>版本:</strong> 1.0.0</p>
            <p><strong>描述:</strong> 基于 GitHub 的现代化图床服务</p>
            <p><strong>技术栈:</strong> Next.js + TypeScript + Tailwind CSS</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
