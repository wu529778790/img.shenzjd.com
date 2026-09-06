'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/configStore'
import { useImages } from '@/hooks/useImages'
import { useWxAuthSession, ensureReady } from '@/hooks/useWxAuthSession'
import { ImageGrid } from '@/components/image/ImageGrid'
import { ImagePreview } from '@/components/image/ImagePreview'
import { ManagementToolbar } from '@/components/image/ManagementToolbar'
import { ManagementSkeleton } from '@/components/loading/Skeleton'
import { Image as ImageIcon, LogIn } from 'lucide-react'
import { SEARCH_CONFIG } from '@/lib/constants'
import type { ImageFile } from '@/types/image'

type SortField = 'name' | 'size' | 'path'
type SortOrder = 'asc' | 'desc'

export default function ManagementPage() {
  const router = useRouter()
  const { session, refreshSession } = useWxAuthSession()
  const configStore = useConfigStore()

  const { images, isLoading, error, handleDelete, handleBulkDelete } = useImages()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedDirectory, setSelectedDirectory] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null)

  // 防抖定时器 ref
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // 未登录时展示登录引导（由 wx-auth 弹出登录）
  const handleLogin = useCallback(async () => {
    try {
      await ensureReady()
      await refreshSession()
    } catch {
      // 用户取消登录或引导未完成，保持当前页面状态
    }
  }, [refreshSession])

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

  // 如果正在校验会话，显示骨架屏；未登录时显示登录引导
  if (!session) {
    return <ManagementSkeleton />
  }

  if (!session?.loggedIn) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">请先登录</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">登录后即可管理你的图床文件</p>
          <Button onClick={handleLogin} className="gap-2">
            <LogIn className="h-4 w-4" />
            立即登录
          </Button>
        </div>
      </div>
    )
  }

  // 已登录但 GitHub 未绑定/未开通 → 引导卡片（ensureReady 会依次弹出绑定/安装/开通引导）
  if (!session?.repo) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/30 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">绑定 GitHub 后即可管理图片</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            首次使用会引导你绑定 GitHub 账号、安装 GitHub App 并自动初始化图床仓库（需要几秒）
          </p>
          <Button onClick={handleLogin} className="gap-2">
            <LogIn className="h-4 w-4" />
            绑定 GitHub
          </Button>
        </div>
      </div>
    )
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

        {/* 错误状态：鉴权失效 / 仓库被删 / 限流 等不再静默为空 */}
        {!isLoading && error && (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto space-y-4">
              <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/30 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {(() => {
                  const status = (error as { response?: { status?: number } })?.response?.status
                  if (status === 401 || status === 403) return '登录已失效，请重新登录'
                  if (status === 404) return '图床仓库不存在，请重新配置'
                  return '加载失败'
                })()}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(() => {
                  const status = (error as { response?: { status?: number } })?.response?.status
                  if (status === 401 || status === 403) return 'GitHub 授权已过期，点击右上角重新登录后重试'
                  if (status === 404) return '检测到仓库已被删除或无权访问'
                  return 'GitHub API 请求失败，可能是速率限制，请稍后重试'
                })()}
              </p>
              <Button onClick={() => router.push('/')} className="mt-4">
                返回首页
              </Button>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && !error && filteredImages.length === 0 && (
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
