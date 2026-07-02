'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/configStore'
import { useImages } from '@/hooks/useImages'
import { ImageGrid } from '@/components/image/ImageGrid'
import { ImagePreview } from '@/components/image/ImagePreview'
import { ManagementToolbar } from '@/components/image/ManagementToolbar'
import { ManagementSkeleton } from '@/components/loading/Skeleton'
import { useAuthDialog } from '@/components/auth'
import { Image as ImageIcon } from 'lucide-react'
import { SEARCH_CONFIG } from '@/lib/constants'
import type { ImageFile } from '@/types/image'

type SortField = 'name' | 'size' | 'path'
type SortOrder = 'asc' | 'desc'

export default function ManagementPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const configStore = useConfigStore()

  const { images, isLoading, handleDelete, handleBulkDelete } = useImages()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedDirectory, setSelectedDirectory] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null)

  // 防抖定时器 ref
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // 未登录时自动打开登录弹窗（配置由 ConfigDiscovery 自动完成）
  useEffect(() => {
    if (status === 'unauthenticated') {
      openLoginDialog()
    }
  }, [status, openLoginDialog])

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
    // 目录切换不需要防抖，立即生效
    setSelectedDirectory(dir)
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
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [])

  // 如果正在加载或未登录，显示骨架屏
  // 注意：未配置时不显示骨架屏，而是显示"去配置"按钮
  if (status === 'loading' || !session) {
    return <ManagementSkeleton />
  }

  return (
    <div className="min-h-0">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
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
            cdn={configStore.cdn}
            onCdnChange={(value) => value && configStore.updateConfig({ cdn: value as 'github' | 'jsdelivr' | 'jsdmirror' | 'github-pages' | 'statically' | 'jsd-onmicrosoft' | 'gitmirror' | 'ghproxy' })}
          />
        </div>

        {/* 图片网格 - 移除 PageTransition 和动画，减少性能开销 */}
        <div className="transition-opacity duration-200">
          <ImageGrid
            images={filteredImages}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            isLoading={isLoading}
            viewMode="grid"
            onPreview={(image) => setPreviewImage(image)}
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
                {searchQuery || selectedDirectory ? '没有找到文件' : '暂无文件'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? '没有找到匹配 "' + searchQuery + '" 的文件'
                  : selectedDirectory
                  ? '"' + selectedDirectory + '" 目录下没有文件'
                  : '上传您的第一个文件开始使用'}
              </p>
              {!searchQuery && !selectedDirectory && (
                <Button onClick={() => router.push('/')} className="mt-4">
                  上传文件
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 图片预览模态框 */}
      {previewImage && (
        <ImagePreview
          image={previewImage}
          images={filteredImages}
          onClose={() => setPreviewImage(null)}
          onDelete={(id) => handleDelete(id)}
          onImageChange={(img) => setPreviewImage(img)}
        />
      )}
    </div>
  )
}
