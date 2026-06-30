'use client'

import { motion } from 'framer-motion'

// 骨架卡片组件 - 精确匹配 ImageCard 设计
export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/50 shadow-modern backdrop-blur-sm"
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
        {/* 文件大小和操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />
        </div>
      </div>
    </motion.div>
  )
}

// 骨架列表项组件 - 精确匹配列表视图行
export function SkeletonListItem() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      {/* 复选框 */}
      <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />

      {/* 内容 */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
      </div>

      {/* 预览按钮占位 */}
      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />
    </motion.div>
  )
}

// 骨架工具栏组件 - 精确匹配 ManagementToolbar 布局（初始加载状态：无选择模式）
export function SkeletonToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* 左侧：统计信息（初始有图片时显示） */}
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

      {/* 排序下拉（模拟带边框的触发器外观） */}
      <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />

      {/* 目录筛选（恢复时显示，因为管理页通常有目录数据） */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />
      </div>

      {/* 弹性空间 */}
      <div className="flex-1 min-w-0" />

      {/* 多选按钮 */}
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />

      {/* 分隔线 */}
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 shrink-0" />

      {/* 视图切换 */}
      <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900 shrink-0">
        <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
      </div>
    </div>
  )
}

// 主骨架屏 - 完整页面加载中状态，精确匹配 management page 布局
export function ManagementSkeleton() {
  return (
    <div className="min-h-0">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* 顶部工具栏骨架 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <SkeletonToolbar />
        </motion.div>

        {/* 图片网格骨架 - 列数与 LazyImageGrid 完全一致 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
