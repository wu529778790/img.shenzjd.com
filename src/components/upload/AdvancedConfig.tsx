'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useConfigStore } from '@/stores/configStore'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-10 h-[22px] bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:border after:border-border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
      </label>
    </div>
  )
}

export function AdvancedConfig() {
  const configStore = useConfigStore()
  const [expanded, setExpanded] = useState(false)

  const hasAdvancedSettings =
    configStore.compressionEnabled ||
    configStore.watermarkEnabled ||
    configStore.useOriginalFileName ||
    configStore.autoCopyAfterUpload

  return (
    <div className="mt-5 rounded-2xl bg-card border shadow-sm overflow-hidden">
      {/* 折叠头部 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">高级配置</span>
          {hasAdvancedSettings && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
          )}
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* 折叠内容 */}
      {expanded && (
        <div className="px-5 pb-5 space-y-1 border-t">
          {/* 自动压缩 */}
          <ToggleRow
            label="自动压缩"
            description="上传时自动压缩图片以节省空间"
            checked={configStore.compressionEnabled}
            onChange={(checked) => configStore.updateConfig({ compressionEnabled: checked })}
          />
          {/* 压缩质量 */}
          {configStore.compressionEnabled && (
            <div className="pl-4 pr-2 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">压缩质量</span>
                <span className="text-xs font-mono font-semibold text-primary">
                  {configStore.compressionQuality}%
                </span>
              </div>
              <Slider
                min={10}
                max={100}
                step={10}
                value={[configStore.compressionQuality]}
                onValueChange={(value) =>
                  configStore.updateConfig({ compressionQuality: (value as number[])[0] })
                }
                className="h-2"
              />
            </div>
          )}

          {/* 默认水印 */}
          <ToggleRow
            label="默认水印"
            description={configStore.watermarkText || '未设置水印文字'}
            checked={configStore.watermarkEnabled}
            onChange={(checked) => {
              if (checked && !configStore.watermarkText) {
                configStore.updateConfig({ watermarkEnabled: true, watermarkText: 'by img.shenzjd.com' })
              } else {
                configStore.updateConfig({ watermarkEnabled: checked })
              }
            }}
          />
          {/* 水印文字 */}
          {configStore.watermarkEnabled && (
            <div className="pl-4 pr-2 py-2">
              <input
                type="text"
                value={configStore.watermarkText}
                onChange={(e) => configStore.updateConfig({ watermarkText: e.target.value })}
                placeholder="输入水印文字"
                className="w-full px-3 py-1.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {/* 保留原始文件名 */}
          <ToggleRow
            label="保留原始文件名"
            description="关闭时自动使用时间戳命名（推荐）"
            checked={configStore.useOriginalFileName}
            onChange={(checked) => configStore.updateConfig({ useOriginalFileName: checked })}
          />

          {/* 上传后自动复制 */}
          <ToggleRow
            label="上传后自动复制"
            description="上传成功后自动复制链接到剪贴板"
            checked={configStore.autoCopyAfterUpload}
            onChange={(checked) => configStore.updateConfig({ autoCopyAfterUpload: checked })}
          />
          {/* 复制格式 */}
          {configStore.autoCopyAfterUpload && (
            <div className="pl-4 pr-2 py-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">复制格式</span>
              <Select
                value={configStore.copyFormat}
                onValueChange={(value) => configStore.updateConfig({ copyFormat: value as 'markdown' | 'html' | 'bbcode' | 'url' })}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg">
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
          )}

          {/* CDN 加速 */}
          <div className="flex items-center justify-between gap-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">CDN 加速</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {configStore.cdn === 'github' && 'GitHub 原始链接'}
                {configStore.cdn === 'jsdelivr' && 'jsDelivr CDN（全球加速）'}
                {configStore.cdn === 'jsdmirror' && 'jsDMirror CDN（国内推荐）'}
                {configStore.cdn === 'github-pages' && 'GitHub Pages'}
              </p>
            </div>
            <Select
              value={configStore.cdn}
              onValueChange={(value) => configStore.updateConfig({ cdn: value as 'github' | 'jsdelivr' | 'jsdmirror' | 'github-pages' })}
            >
              <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg">
                <SelectValue placeholder="选择 CDN" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github">GitHub 原始</SelectItem>
                <SelectItem value="jsdelivr">jsDelivr</SelectItem>
                <SelectItem value="jsdmirror">jsDMirror</SelectItem>
                <SelectItem value="github-pages">GitHub Pages</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
