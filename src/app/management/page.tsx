'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, FolderTree, Loader2, Lock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/configStore'
import { useImages } from '@/hooks/useImages'
import { ImageGrid } from '@/components/image/ImageGrid'

type SortField = 'name' | 'size' | 'path' | 'uploaded_at'
type SortOrder = 'asc' | 'desc'

export default function ManagementPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const configStore = useConfigStore()

  const { images, isLoading, handleDelete, handleBulkDelete, isDeleting } = useImages()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedDirectory, setSelectedDirectory] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('uploaded_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // 检查配置是否完整
  const isConfigured = configStore.owner && configStore.repo && configStore.branch

  // 如果正在加载
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果未登录，显示登录提示
  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">需要登录</h2>
          <p className="text-gray-500 mb-4">
            登录后才能管理图片
          </p>
          <Button onClick={() => router.push('/login')}>
            去登录
          </Button>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">请先配置图床</p>
          <Button onClick={() => router.push('/config')}>去配置</Button>
        </div>
      </div>
    )
  }

  // 过滤图片
  let filteredImages = images.filter((image) => {
    const matchesSearch = image.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDirectory = !selectedDirectory || image.path.startsWith(selectedDirectory)
    return matchesSearch && matchesDirectory
  })

  // 排序图片
  filteredImages.sort((a, b) => {
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
      case 'uploaded_at':
      default:
        comparison = (a.uploaded_at?.getTime() || 0) - (b.uploaded_at?.getTime() || 0)
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  // 切换排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 切换排序顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // 新字段，默认降序（最新的在前）
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // 提取目录树
  const directories = Array.from(
    new Set(
      images
        .map((img) => {
          const parts = img.path.split('/')
          return parts.length > 1 ? parts.slice(0, -1).join('/') : ''
        })
        .filter(Boolean)
    )
  )

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">图片管理</h1>
        <p className="text-gray-500 mt-2">
          管理您的图片（共 {images.length} 张）
        </p>
      </div>

      <div className="flex gap-6">
        {/* 侧边栏 - 目录树 */}
        {directories.length > 0 && (
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-4 border rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <FolderTree className="h-5 w-5" />
                <h2 className="font-semibold">目录</h2>
              </div>
              <div className="space-y-1">
                <button
                  className={`w-full text-left px-2 py-1 rounded text-sm ${
                    !selectedDirectory
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedDirectory('')}
                >
                  全部
                </button>
                {directories.map((dir) => (
                  <button
                    key={dir}
                    className={`w-full text-left px-2 py-1 rounded text-sm ${
                      selectedDirectory === dir
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedDirectory(dir)}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* 主内容区 */}
        <div className="flex-1">
          {/* 搜索栏和排序 */}
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="搜索图片..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('name')}
              >
                名称
                {sortField === 'name' && (
                  sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('size')}
              >
                大小
                {sortField === 'size' && (
                  sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('uploaded_at')}
              >
                日期
                {sortField === 'uploaded_at' && (
                  sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 图片列表 */}
          <ImageGrid
            images={filteredImages}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
