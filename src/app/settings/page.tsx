'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SlidersHorizontal, Palette, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useConfigStore } from '@/stores/configStore'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { useAuthDialog } from '@/components/auth'
import { AdvancedConfig } from '@/components/upload/AdvancedConfig'
import { debugLog } from '@/lib/debug'

const CARD_BASE_CLASSES = 'p-6 rounded-2xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 shadow-modern-sm'
const SECTION_HEADER_CLASSES = 'flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/80 dark:border-gray-700/50'
const SECTION_TITLE_CLASSES = 'text-xl font-semibold'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const configStore = useConfigStore()

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <PageTransition>
        {/* 上传相关设置 */}
        <CardAnimation delay={0} className={CARD_BASE_CLASSES}>
          <div className={SECTION_HEADER_CLASSES}>
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h2 className={SECTION_TITLE_CLASSES}>上传设置</h2>
          </div>
          <AdvancedConfig />
        </CardAnimation>

        {/* 水印详细设置 */}
        {configStore.watermarkEnabled && (
          <CardAnimation delay={0.1} className={`${CARD_BASE_CLASSES} mt-6`}>
            <div className={SECTION_HEADER_CLASSES}>
              <Droplets className="h-5 w-5 text-primary" />
              <h2 className={SECTION_TITLE_CLASSES}>水印设置</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="watermarkColor" className="mb-2 block">水印颜色</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="watermarkColor"
                    type="color"
                    value={configStore.watermarkColor}
                    onChange={(e) => configStore.updateConfig({ watermarkColor: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">{configStore.watermarkColor}</span>
                </div>
              </div>
              <div>
                <Label htmlFor="watermarkSize" className="mb-2 block">
                  水印大小: {configStore.watermarkSize}px
                </Label>
                <input
                  id="watermarkSize"
                  type="range"
                  min={12}
                  max={72}
                  value={configStore.watermarkSize}
                  onChange={(e) => configStore.updateConfig({ watermarkSize: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="watermarkPosition" className="mb-2 block">水印位置</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'top-left', label: '左上' },
                    { value: 'top-right', label: '右上' },
                    { value: 'bottom-left', label: '左下' },
                    { value: 'bottom-right', label: '右下' },
                  ].map((pos) => (
                    <Button
                      key={pos.value}
                      variant={configStore.watermarkPosition === pos.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => configStore.updateConfig({ watermarkPosition: pos.value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' })}
                    >
                      {pos.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardAnimation>
        )}

        {/* 主题设置 */}
        <CardAnimation delay={0.2} className={`${CARD_BASE_CLASSES} mt-6`}>
          <div className={SECTION_HEADER_CLASSES}>
            <Palette className="h-5 w-5 text-primary" />
            <h2 className={SECTION_TITLE_CLASSES}>外观</h2>
          </div>
          <div className="flex items-center gap-2">
            {[
              { value: 'light', label: '浅色' },
              { value: 'dark', label: '深色' },
              { value: 'system', label: '跟随系统' },
            ].map((t) => (
              <Button
                key={t.value}
                variant={configStore.theme === t.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => configStore.updateConfig({ theme: t.value as 'light' | 'dark' | 'system' })}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </CardAnimation>
      </PageTransition>
    </div>
  )
}
