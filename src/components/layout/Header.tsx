'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Upload, Image, Settings, FolderGit, LogOut, User, Menu, X, Code } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { ThemeToggle } from './ThemeToggle'

const navigation = [
  { name: '上传图片', href: '/upload', icon: Upload },
  { name: '图片管理', href: '/management', icon: Image },
  { name: '设置', href: '/settings', icon: Settings },
]

// 移动端菜单动画
const mobileMenuVariants = {
  closed: {
    opacity: 0,
    height: 0,
    overflow: 'hidden' as const,
    transition: {
      duration: 0.2,
    },
  },
  open: {
    opacity: 1,
    height: 'auto',
    overflow: 'hidden' as const,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
}

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user
  const configStore = useConfigStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  // 预加载管理页面数据
  const prefetchManagementPage = () => {
    const { owner, repo, branch } = configStore
    if (owner && repo && branch) {
      queryClient.prefetchQuery({
        queryKey: ['images', owner, repo, branch],
        staleTime: 60 * 1000,
      })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/upload" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.2 }}
              className="text-primary"
            >
              <FolderGit className="h-6 w-6" />
            </motion.div>
            <motion.span
              className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              ImgX
            </motion.span>
          </Link>

          {/* 桌面端导航菜单 */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item, index) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onMouseEnter={item.href === '/management' ? prefetchManagementPage : undefined}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-3">
            {/* 主题切换 */}
            <ThemeToggle />

            {/* GitHub 链接 */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>

            {/* 用户菜单 */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                  {user.image ? (
                    <motion.img
                      src={user.image}
                      alt={user.name || ''}
                      className="h-8 w-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    />
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-semibold"
                    >
                      <User className="h-4 w-4" />
                    </motion.div>
                  )}
                  <span className="hidden md:inline text-sm font-medium">
                    {user.name || user.email}
                  </span>
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
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileMenuVariants}
              className="md:hidden border-t"
            >
              <div className="py-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                        isActive
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-600 dark:text-gray-400'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
