'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/configStore'
import { useImages } from '@/hooks/useImages'
import { ImageGrid } from '@/components/image/ImageGrid'
import { ManagementToolbar } from '@/components/image/ManagementToolbar'
import { ManagementSkeleton } from '@/components/loading/Skeleton'
import { useAuthDialog, useConfigDialog } from '@/components/auth'
import { toast } from 'sonner'
import { Image as ImageIcon } from 'lucide-react'
import { IMAGE_GRID_CONFIG, SEARCH_CONFIG, DIRECTORY_CONFIG } from '@/lib/constants'

type SortField = 'name' | 'size' | 'path'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

export default function ManagementPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const { openConfigDialog, isConfigDismissed } = useConfigDialog()
  const configStore = useConfigStore()

  const { images, isLoading, handleDelete, handleBulkDelete, isDeleting } = useImages()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedDirectory, setSelectedDirectory] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())

  // 防抖定时器 ref
  const directoryDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // 检查配置是否完整
  const isConfigured = configStore.owner && configStore.repo && configStore.branch

  // 未登录时自动打开登录弹窗
  useEffect(() => {
    console.log('[Management] Status changed:', status, 'Session:', !!session)  // Debug
    if (status === 'unauthenticated') {
      console.log('[Management] Opening login dialog')  // Debug
      openLoginDialog()
    }
  }, [status, openLoginDialog, session])

  // 使用 useMemo 缓存过滤和排序结果
  const filteredImages = useMemo(() => {
    const result = images.filter((image) => {
      const matchesSearch = image.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDirectory = !selectedDirectory || image.path.startsWith(selectedDirectory)
      return matchesSearch && matchesDirectory
    })

    return result.slice().sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'path':
          comparison = a.path.localeCompare(b.path)
          break
        default:
          comparison = a.name.localeCompare(b.name)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [images, searchQuery, selectedDirectory, sortField, sortOrder])

  // 使用 useMemo 提取目录树
  const directories = useMemo(() => {
    if (images.length === 0) return []
    const dirSet = new Set<string>()
    for (const img of images) {
      const parts = img.path.split('/')
      if (parts.length > 1) {
        dirSet.add(parts.slice(0, -1).join('/'))
      }
    }
    return Array.from(dirSet).sort()
  }, [images])

  // 排序切换
  const handleSortFieldChange = useCallback((field: SortField) => {
    setSortField(field)
  }, [])

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }, [])

  const handleDirectoryChange = useCallback((dir: string) => {
    // 清除之前的定时器
    if (directoryDebounceRef.current) {
      clearTimeout(directoryDebounceRef.current)
    }
    // 设置新的定时器
    directoryDebounceRef.current = setTimeout(() => {
      setSelectedDirectory(dir)
    }, DIRECTORY_CONFIG.DEBOUNCE_MS)
  }, [])

  // 防抖搜索
  const handleSearchChange = useCallback((query: string) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(query)
    }, SEARCH_CONFIG.DEBOUNCE_MS)
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (directoryDebounceRef.current) {
        clearTimeout(directoryDebounceRef.current)
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [])

  // 多选相关
  const handleToggleSelectionMode = useCallback(() => {
    if (selectionMode) {
      setSelectedIds(new Set())
    }
    setSelectionMode((prev) => !prev)
  }, [selectionMode])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredImages.map((img) => img.id)))
    }
  }, [filteredImages, selectedIds.size])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [])

  const handleBulkCopy = useCallback(async () => {
    const count = selectedIds.size
    const { toast } = await import('sonner')
    toast.success(`已复制 ${count} 个链接`)
    setCopiedIds(new Set(selectedIds))
    setTimeout(() => setCopiedIds(new Set()), 2000)
  }, [selectedIds])

  const handleBulkDeleteWithConfirm = useCallback(() => {
    if (selectedIds.size === 0) return
    handleBulkDelete(Array.from(selectedIds))
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [selectedIds, handleBulkDelete])

  const allSelected = filteredImages.length > 0 && selectedIds.size === filteredImages.length

  // 如果正在加载或未登录，显示骨架屏
  // 注意：未配置时不显示骨架屏，而是显示"去配置"按钮
  if (status === 'loading' || !session) {
    return (
      <div className="min-h-[60vh]">
        <ManagementSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-0">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 统一工具栏（单行） */}
        <div className="mb-4">
          <ManagementToolbar
            images={images}
            filteredCount={filteredImages.length}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={handleSortFieldChange}
            onSortOrderToggle={handleSortOrderToggle}
            directories={directories}
            selectedDirectory={selectedDirectory}
            onDirectoryChange={handleDirectoryChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectionMode={selectionMode}
            onToggleSelectionMode={handleToggleSelectionMode}
            selectedCount={selectedIds.size}
            allSelected={allSelected}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBulkCopy={handleBulkCopy}
            onBulkDelete={handleBulkDeleteWithConfirm}
            copied={copiedIds.size > 0}
          />
        </div>

        {/* 图片网格 - 移除 PageTransition 和动画，减少性能开销 */}
        <div className="transition-opacity duration-200">
          <ImageGrid
            images={filteredImages}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            isLoading={isLoading}
            viewMode={viewMode}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelect={(id, selected) => {
              setSelectedIds((prev) => {
                const newSet = new Set(prev)
                if (selected) newSet.add(id)
                else newSet.delete(id)
                return newSet
              })
            }}
          />
        </div>

        {/* 空状态 */}
        {!isLoading && filteredImages.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto space-y-4">
              <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {!isConfigured ? '请先配置图床' : (searchQuery || selectedDirectory ? '没有找到图片' : '暂无图片')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {!isConfigured
                  ? '在开始管理图片之前，需要先配置您的 GitHub 仓库'
                  : searchQuery
                  ? '没有找到匹配 "' + searchQuery + '" 的图片'
                  : selectedDirectory
                  ? '"' + selectedDirectory + '" 目录下没有图片'
                  : '上传您的第一张图片开始使用'}
              </p>
              {!isConfigured ? (
                <Button onClick={openConfigDialog} className="mt-4">
                  去配置
                </Button>
              ) : !searchQuery && !selectedDirectory && (
                <Button onClick={() => router.push('/')} className="mt-4">
                  上传图片
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
