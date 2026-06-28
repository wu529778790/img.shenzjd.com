'use client'

import { useState } from 'react'
import { LayoutGrid, List, Trash2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/utils'
import { ImageCard } from './ImageCard'
import type { ImageFile } from '@/types/image'

interface ImageGridProps {
  images: ImageFile[]
  onDelete?: (id: string) => void
  onBulkDelete?: (ids: string[]) => void
  isLoading?: boolean
}

type ViewMode = 'grid' | 'list'

export function ImageGrid({ images, onDelete, onBulkDelete, isLoading = false }: ImageGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())

  const handleBulkCopy = async () => {
    const count = selectedIds.size
    toast.success(`已复制 ${count} 个链接`)
    setCopiedIds(new Set(selectedIds))
    setTimeout(() => setCopiedIds(new Set()), 2000)
  }

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(images.map((img) => img.id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    if (!onBulkDelete || selectedIds.size === 0) return

    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个文件吗？`)) return

    onBulkDelete(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const allSelected = images.length > 0 && selectedIds.size === images.length

  return (
    <div>
      {/* 工具栏 */}
      {images.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="rounded"
              />
              全选
            </label>
            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-gray-500">
                  已选择 {selectedIds.size} 项
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearSelection}
                >
                  取消选择
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkCopy}
                >
                  {copiedIds.size > 0 ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      复制链接
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 图片网格/列表 */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无图片</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onDelete={onDelete}
              onSelect={handleSelect}
              selected={selectedIds.has(image.id)}
              selectable
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {images.map((image) => (
            <div
              key={image.id}
              className={`flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedIds.has(image.id) ? 'bg-primary/5 border-primary' : ''
              }`}
              onClick={() => handleSelect(image.id, !selectedIds.has(image.id))}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(image.id)}
                onChange={() => handleSelect(image.id, !selectedIds.has(image.id))}
                className="rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{image.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(image.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
