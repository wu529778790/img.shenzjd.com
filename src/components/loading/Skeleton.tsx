'use client'

import { motion } from 'framer-motion'

// 骨架卡片组件 - 匹配新的 ImageCard 设计
export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      {/* 图片占位 - 使用 shimmer 效果 */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900">
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 shimmer-bg"
        />
      </div>

      {/* 文件信息 */}
      <div className="p-4 space-y-2">
        {/* 文件名 */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg w-3/4" />
        {/* 文件大小和操作 */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />
        </div>
      </div>
    </motion.div>
  )
}

// 骨架列表项组件
export function SkeletonListItem() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      {/* 复选框 */}
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />

      {/* 内容 */}
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
      </div>
    </motion.div>
  )
}

// 骨架工具栏组件 - 匹配新的 ManagementToolbar 布局
export function SkeletonToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* 左侧：统计信息 */}
      <div className="flex items-center gap-1.5 text-xs px-1 shrink-0">
        <div className="h-3.5 w-3.5 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        <div className="h-3.5 w-6 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        <div className="h-3 w-px bg-gray-300 dark:bg-gray-600" />
        <div className="h-3.5 w-3.5 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        <div className="h-3.5 w-12 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
      </div>

      {/* 分隔线 */}
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 shrink-0" />

      {/* 搜索框 */}
      <div className="relative group shrink-0">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />
      </div>

      {/* 排序下拉 */}
      <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />

      {/* 目录筛选 */}
      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />

      {/* 弹性空间 */}
      <div className="flex-1 min-w-0" />

      {/* 批量操作（多选模式） */}
      <div className="hidden sm:flex items-center gap-1.5 overflow-hidden shrink-0">
        <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        <div className="h-7 w-8 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        <div className="h-7 w-8 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
      </div>

      {/* 多选按钮 */}
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />

      {/* 分隔线 */}
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 shrink-0 hidden sm:block" />

      {/* 视图切换 */}
      <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900 shrink-0">
        <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
      </div>
    </div>
  )
}

// 主骨架屏 - 完整页面加载
export function ManagementSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 顶部工具栏骨架 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <SkeletonToolbar />
        </motion.div>

        {/* 图片网格骨架 - 显示 12 个 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
