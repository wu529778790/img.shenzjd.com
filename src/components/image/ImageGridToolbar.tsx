'use client'

import { useState } from 'react'
import { LayoutGrid, List, Trash2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

type ViewMode = 'grid' | 'list'

interface ImageGridToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  selectedCount: number
  totalCount: number
  allSelected: boolean
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkCopy: () => void
  onBulkDelete: () => void
  copied: boolean
}

export function ImageGridToolbar({
  viewMode,
  onViewModeChange,
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onClearSelection,
  onBulkCopy,
  onBulkDelete,
  copied,
}: ImageGridToolbarProps) {
  const hasSelection = selectedCount > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* 全选 */}
        <label className="flex items-center gap-2 text-sm cursor-pointer group">
          <motion.input
            whileTap={{ scale: 0.9 }}
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
          />
          <span className="group-hover:text-primary transition-colors">
            全选
          </span>
        </label>

        {/* 批量操作按钮 */}
        <AnimatePresence>
          {hasSelection && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
              <span className="text-sm text-primary font-medium px-2">
                {selectedCount} 项已选
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={onClearSelection}
                className="gap-1"
              >
                取消选择
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onBulkCopy}
                  className="gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      复制链接
                    </>
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onBulkDelete}
                  className="gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        {/* 视图切换 */}
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => onViewModeChange('grid')}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => onViewModeChange('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
