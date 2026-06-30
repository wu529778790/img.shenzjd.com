'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { FolderGit, LogOut, User, Image as ImageIcon, LinkIcon, Settings } from 'lucide-react'
import { useConfigStore } from '@/stores/configStore'
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

export function Header() {
  const { data: session } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const user = session?.user
  const configStore = useConfigStore()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    localStorage.removeItem('github_token')
    localStorage.removeItem('config-storage')
    queryClient.clear()
    await signOut({ redirect: false })
    window.location.href = '/'
  }

  const repoUrl = configStore.owner && configStore.repo
    ? `https://github.com/${configStore.owner}/${configStore.repo}`
    : null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <FolderGit className="h-6 w-6 text-primary transition-transform duration-200 group-hover:rotate-12" />
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
              ImgX
            </span>
          </Link>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || user.email || ''}
                      className="h-8 w-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name || user.email}</span>
                        {user.email && (
                          <span className="text-xs text-gray-500">{user.email}</span>
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
                    {repoUrl && (
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/dropdown-menu-item relative flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                      >
                        <LinkIcon className="h-4 w-4" />
                        <span>查看仓库</span>
                      </a>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={openLoginDialog}
                size="sm"
                variant="gradient"
                className="font-semibold"
              >
                登录
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
