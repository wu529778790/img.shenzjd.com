'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Upload, Image, Settings, ToolCase, FolderGit, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useConfigStore } from '@/stores/configStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/avatar'

const navigation = [
  { name: '上传图片', href: '/upload', icon: Upload },
  { name: '图片管理', href: '/management', icon: Image },
  { name: '工具箱', href: '/tools/compress', icon: ToolCase },
  { name: '设置', href: '/settings', icon: Settings },
]

export function Header() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const configStore = useConfigStore()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <header className="border-b bg-white dark:bg-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/upload" className="flex items-center gap-2">
            <FolderGit className="h-6 w-6" />
            <span className="font-bold text-xl">ImgX</span>
          </Link>

          {/* 导航菜单 */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                    isActive
                      ? 'text-primary'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-4">
            {/* 图床信息 */}
            {configStore.repo && (
              <div className="hidden lg:block text-sm text-gray-500">
                {configStore.owner}/{configStore.repo}
              </div>
            )}

            {/* 用户菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" className="flex items-center gap-2">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="hidden md:inline">{user?.login}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name || user?.login}</span>
                    {user?.email && (
                      <span className="text-xs text-gray-500">{user.email}</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
