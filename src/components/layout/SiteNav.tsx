'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Upload, Images, Settings, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '上传', icon: Upload, exact: true },
  { href: '/management', label: '图片管理', icon: Images },
  { href: '/tools/cli', label: 'CLI / AI', icon: Terminal },
  { href: '/settings', label: '图床设置', icon: Settings },
]

/**
 * 本站二级导航：页面级入口（上传 / 图片管理 / 图床设置）。
 * 居中下划线 Tab 样式，与公共导航的居中轴线对齐；
 * 账号级操作（登录/退出）归公共导航 site-navbar 的头像菜单。
 */
export function SiteNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="本站导航" className="border-b border-border/60">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-center gap-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-1.5 h-12 px-4 text-sm transition-colors',
                  active
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-opacity',
                    active ? 'bg-primary opacity-100' : 'opacity-0'
                  )}
                />
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
