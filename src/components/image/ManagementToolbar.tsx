'use client'

import { useMemo, useState, useCallback } from 'react'
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  HardDrive,
  Images,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/utils'
import type { ImageFile } from '@/types/image'

type SortField = 'name' | 'size' | 'path'
type SortOrder = 'asc' | 'desc'

interface ManagementToolbarProps {
  // 统计
  images: ImageFile[]
  filteredCount: number
  // 搜索
  searchQuery: string
  onSearchChange: (query: string) => void
  // 排序
  sortField: SortField
  sortOrder: SortOrder
  onSortFieldChange: (field: SortField) => void
  onSortOrderToggle: () => void
  // 目录
  directories: string[]
  selectedDirectory: string
  onDirectoryChange: (dir: string) => void
  // CDN
  cdn: string
  onCdnChange: (value: string | null) => void
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'name', label: '名称' },
  { field: 'size', label: '大小' },
  { field: 'path', label: '路径' },
]

export function ManagementToolbar({
  images,
  searchQuery,
  onSearchChange,
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderToggle,
  directories,
  selectedDirectory,
  onDirectoryChange,
  cdn,
  onCdnChange,
}: ManagementToolbarProps) {
  // 控制目录下拉菜单的开关状态
  const [directoryMenuOpen, setDirectoryMenuOpen] = useState(false)

  const stats = useMemo(() => {
    if (images.length === 0) return null
    return {
      total: images.length,
      totalSize: formatFileSize(images.reduce((sum, img) => sum + img.size, 0)),
    }
  }, [images])

  const currentSortLabel = SORT_OPTIONS.find((o) => o.field === sortField)?.label ?? '排序'

  // 处理目录选择，选择后自动关闭菜单
  const handleDirectorySelect = useCallback((dir: string) => {
    onDirectoryChange(dir)
    setDirectoryMenuOpen(false) // 选择后关闭菜单
  }, [onDirectoryChange])

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* 左侧：统计 */}
      {stats && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 px-1 shrink-0">
          <Images className="h-3.5 w-3.5" />
          <span>{stats.total}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <HardDrive className="h-3.5 w-3.5" />
          <span>{stats.totalSize}</span>
        </div>
      )}

      {/* 分隔线 */}
      {stats && <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 shrink-0" />}

      {/* 搜索框 */}
      <div className="relative group shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none" />
        <Input
          type="text"
          placeholder="搜索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'pl-8 h-8 w-40 rounded-lg border-gray-200 dark:border-gray-700 text-sm',
            'focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'transition-all duration-200',
            searchQuery && 'pr-7'
          )}
          aria-label="搜索图片"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
            aria-label="清除搜索"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* 排序下拉 */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors',
            'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
            'hover:bg-gray-50 dark:hover:bg-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-primary/20'
          )}
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />
          <span className="hidden sm:inline">{currentSortLabel}</span>
          {sortOrder === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>排序方式</DropdownMenuLabel>
            {SORT_OPTIONS.map(({ field, label }) => (
              <DropdownMenuCheckboxItem
                key={field}
                checked={sortField === field}
                onCheckedChange={() => onSortFieldChange(field)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSortOrderToggle}>
            {sortOrder === 'asc' ? (
              <>
                <ArrowDown className="h-4 w-4" />
                切换为降序
              </>
            ) : (
              <>
                <ArrowUp className="h-4 w-4" />
                切换为升序
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 目录筛选下拉 */}
      {directories.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu open={directoryMenuOpen} onOpenChange={setDirectoryMenuOpen}>
            <DropdownMenuTrigger
              className={cn(
                'inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors',
                'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                selectedDirectory && 'border-primary/50 bg-primary/5 text-primary'
              )}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline max-w-[80px] truncate">
                {selectedDirectory ? selectedDirectory.split('/').pop() : '目录'}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={4}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>筛选目录</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={!selectedDirectory}
                  onCheckedChange={() => handleDirectorySelect('')}
                >
                  全部目录
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {directories.slice(0, 10).map((dir) => (
                  <DropdownMenuCheckboxItem
                    key={dir}
                    checked={selectedDirectory === dir}
                    onCheckedChange={() => handleDirectorySelect(dir)}
                  >
                    <span className="truncate max-w-[200px]" title={dir}>
                      {dir}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 清除目录筛选按钮 */}
          {selectedDirectory && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDirectoryChange('')}
              className="h-8 w-8 p-0 shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="清除目录筛选"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </Button>
          )}
        </div>
      )}

      {/* 弹性空间 */}
      <div className="flex-1 min-w-0" />

      {/* CDN 选择 */}
      <Select value={cdn} onValueChange={onCdnChange}>
        <SelectTrigger className="h-7 w-[120px] text-xs rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <SelectValue placeholder="CDN" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="github">GitHub 原始</SelectItem>
          <SelectItem value="jsdelivr">jsDelivr</SelectItem>
          <SelectItem value="jsdmirror">jsDMirror</SelectItem>
          <SelectItem value="github-pages">GitHub Pages</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
