'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { FolderGit, LogOut, User, Settings, ChevronDown, Image as ImageIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import { ThemeToggle } from './ThemeToggle'
import { useAuthDialog } from '@/components/auth'

const navLinks = [
  { name: '首页', href: 'https://shenzjd.com' },
  { name: '在线网盘', href: 'https://alist.shenzjd.com' },
  { name: '网盘搜索', href: 'https://panhub.shenzjd.com' },
  { name: '快链', href: 'https://duanlian.shenzjd.com' },
  { name: '视频解析', href: 'https://parse.shenzjd.com' },
  { name: '热点聚合', href: 'https://newshub.shenzjd.com' },
  { name: '个人导航', href: 'https://navhub.shenzjd.com' },
  { name: '必应壁纸', href: 'https://bing.shenzjd.com' },
]

export function Header() {
  const { data: session } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const user = session?.user
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    localStorage.removeItem('github_token')
    localStorage.removeItem('config-storage')
    queryClient.clear()
    await signOut({ redirect: false })
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex h-14 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <FolderGit className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg gradient-text">ImgX</span>
          </Link>

          {/* 导航 */}
          <nav className="flex items-center gap-1 ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                导航
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    {link.name}
                  </a>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* 右侧 */}
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || user.email || ''}
                      className="h-8 w-8 rounded-full ring-2 ring-border"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name || user.email}</span>
                        {user.email && (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => window.location.href = '/management'}
                      className="cursor-pointer"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      <span>图片管理</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => window.location.href = '/settings'}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>设置</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={openLoginDialog} size="sm" className="font-semibold gradient-primary">
                登录
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
