'use client'

import { useMemo } from 'react'
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Copy,
  Check,
  Trash2,
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
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/utils'
import type { ImageFile } from '@/types/image'

type SortField = 'name' | 'size' | 'path'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

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
  // 视图
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  // 多选
  selectionMode: boolean
  onToggleSelectionMode: () => void
  selectedCount: number
  allSelected: boolean
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkCopy: () => void
  onBulkDelete: () => void
  copied: boolean
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'name', label: '名称' },
  { field: 'size', label: '大小' },
  { field: 'path', label: '路径' },
]

export function ManagementToolbar({
  images,
  filteredCount,
  searchQuery,
  onSearchChange,
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderToggle,
  directories,
  selectedDirectory,
  onDirectoryChange,
  viewMode,
  onViewModeChange,
  selectionMode,
  onToggleSelectionMode,
  selectedCount,
  allSelected,
  onSelectAll,
  onClearSelection,
  onBulkCopy,
  onBulkDelete,
  copied,
}: ManagementToolbarProps) {
  const stats = useMemo(() => {
    if (images.length === 0) return null
    return {
      total: images.length,
      totalSize: formatFileSize(images.reduce((sum, img) => sum + img.size, 0)),
    }
  }, [images])

  const currentSortLabel = SORT_OPTIONS.find((o) => o.field === sortField)?.label ?? '排序'

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
        <DropdownMenu>
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
                onCheckedChange={() => onDirectoryChange('')}
              >
                全部目录
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {directories.slice(0, 10).map((dir) => (
                <DropdownMenuCheckboxItem
                  key={dir}
                  checked={selectedDirectory === dir}
                  onCheckedChange={() => onDirectoryChange(dir)}
                >
                  <span className="truncate max-w-[200px]" title={dir}>
                    {dir}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 弹性空间 */}
      <div className="flex-1 min-w-0" />

      {/* 批量操作（多选模式下有选中时显示） */}
      {selectionMode && selectedCount > 0 && (
        <div className="flex items-center gap-1.5 overflow-hidden shrink-0">
          <span className="text-xs text-primary font-medium px-1">
            {selectedCount} 项
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={onClearSelection}
            className="h-7 px-2 text-xs gap-1"
          >
            取消
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onBulkCopy}
            className="h-7 px-2 text-xs gap-1"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onBulkDelete}
            className="h-7 px-2 text-xs gap-1"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* 多选模式下显示全选 */}
      {selectionMode && (
        <div className="overflow-hidden shrink-0">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer group px-1">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
            />
            <span className="group-hover:text-primary transition-colors">全选</span>
          </label>
        </div>
      )}

      {/* 多选按钮 */}
      <Button
        size="sm"
        variant={selectionMode ? 'default' : 'ghost'}
        onClick={onToggleSelectionMode}
        className="h-8 px-2 gap-1 shrink-0"
        title={selectionMode ? '退出多选' : '多选模式'}
      >
        {selectionMode ? (
          <CheckSquare className="h-4 w-4" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        <span className="hidden md:inline text-xs">
          {selectionMode ? '退出多选' : '多选'}
        </span>
      </Button>

      {/* 分隔线 */}
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 shrink-0" />

      {/* 视图切换 */}
      <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900 shrink-0">
        <Button
          size="sm"
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          onClick={() => onViewModeChange('grid')}
          className="h-7 w-7 p-0"
          title="网格视图"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          onClick={() => onViewModeChange('list')}
          className="h-7 w-7 p-0"
          title="列表视图"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
