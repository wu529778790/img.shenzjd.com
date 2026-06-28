'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore, type Theme } from '@/hooks/useTheme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  const currentTheme = themeOptions.find((opt) => opt.value === theme) || themeOptions[2]
  const CurrentIcon = currentTheme.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'p-2 rounded-lg transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'text-gray-600 dark:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900'
        )}
        aria-label="切换主题"
      >
        <CurrentIcon className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {themeOptions.map((option) => {
          const Icon = option.icon
          const isSelected = theme === option.value
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'cursor-pointer flex items-center gap-2',
                isSelected && 'bg-primary/10 text-primary'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{option.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
