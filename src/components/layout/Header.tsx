'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Upload, Image, Settings, ToolCase, FolderGit, LogOut, User } from 'lucide-react'
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

const navigation = [
  { name: '上传图片', href: '/upload', icon: Upload },
  { name: '图片管理', href: '/management', icon: Image },
  { name: '工具箱', href: '/tools/compress', icon: ToolCase },
  { name: '设置', href: '/settings', icon: Settings },
]

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user
  const configStore = useConfigStore()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
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
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || ''}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="hidden md:inline">{user.name || user.email}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.name || user.email}</span>
                        {user.email && (
                          <span className="text-xs text-gray-500">{user.email}</span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
