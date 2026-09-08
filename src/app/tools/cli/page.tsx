'use client'

import { useState } from 'react'
import { Terminal, Copy, Check, Zap, ImageIcon, Settings2, Link2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

const INSTALL_COMMAND = 'npx skills add wu529778790/shenzjd-skills -s github-figure-bed -y'

const FEATURES = [
  {
    icon: Zap,
    title: '对话即上传',
    description:
      '安装技能后，直接对 AI 说「上传 xxx.png 到图床」，秒得 CDN / Markdown 链接，无需打开任何界面。',
  },
  {
    icon: ImageIcon,
    title: '完整的图床管理',
    description:
      '批量上传、子目录归档、重名自动保护、图片列表与搜索、按文件名删除，命令行与对话双通道。',
  },
  {
    icon: Settings2,
    title: '与网页端共用配置',
    description:
      '技能读取图床仓库里的 .img.shenzjd.com/config.json（与本站设置面板同一份），分支、目录、CDN 自动保持一致。',
  },
  {
    icon: Link2,
    title: '多 CDN 直出',
    description: '支持 jsDelivr、jsDMirror、Statically、GitHub Raw 等多种加速链接，大陆访问推荐 jsDMirror。',
  },
]

export default function CliPage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND)
      setCopied(true)
      toast.success('安装命令已复制')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Terminal className="h-8 w-8" />
          CLI / AI 集成
        </h1>
        <p className="text-muted-foreground mt-2">
          在终端和 AI 助手里使用同一个图床 —— 由开源技能 github-figure-bed 驱动，与本站共用仓库和配置。
        </p>
      </div>

      {/* 安装命令 */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold">一键安装技能</h2>
          <Button size="sm" variant="outline" onClick={handleCopy} className="flex items-center gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                复制命令
              </>
            )}
          </Button>
        </div>
        <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto">
          {INSTALL_COMMAND}
        </pre>
        <p className="text-sm text-muted-foreground mt-3">
          支持 Claude Code、Cursor、Copilot、Windsurf 等 67+ AI 编码工具。安装后在终端运行一次{' '}
          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">setup.sh</code>{' '}
          完成初始化（自动登录引导 + 配置），之后零配置直接使用。
        </p>
      </Card>

      {/* 能力列表 */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </Card>
        ))}
      </div>

      {/* 使用示例 */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-3">安装后怎么用</h2>
        <div className="space-y-3 text-sm">
          {[
            { say: '「上传 screenshot.png 到图床」', get: '返回 CDN 链接 + 可直接粘贴的 Markdown' },
            { say: '「上传这几张图到图床的 2026/09 目录」', get: '批量上传 + 子目录归档' },
            { say: '「图床里有哪些图」', get: '列出 / 搜索已托管文件' },
            { say: '「删掉 old-banner.png」', get: '从图床仓库删除' },
          ].map(({ say, get }) => (
            <div key={say} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <code className="font-mono bg-muted px-2 py-1 rounded shrink-0">{say}</code>
              <span className="text-muted-foreground">→ {get}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 相关链接 */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => window.open('https://github.com/wu529778790/shenzjd-skills/tree/main/github-figure-bed', '_blank', 'noopener,noreferrer')}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          技能文档与源码
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open('https://www.skills.sh/wu529778790/shenzjd-skills', '_blank', 'noopener,noreferrer')}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          skills.sh 页面
        </Button>
      </div>
    </div>
  )
}
