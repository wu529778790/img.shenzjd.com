'use client'

import { motion } from 'framer-motion'

// 骨架卡片组件
export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      {/* 图片占位 - 使用 shimmer 效果 */}
      <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0 shimmer-bg"
        />

        {/* 悬停时的渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* 文字占位 */}
      <div className="p-4 space-y-2">
        {/* 文件名 */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        {/* 文件大小 */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
          <div className="h-3 w-4 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
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

// 骨架搜索栏组件（已合并到 SkeletonToolbar，保留以备后用）
export function SkeletonSearchBar() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* 搜索框 */}
      <div className="flex-1 h-11 bg-gray-200 dark:bg-gray-700 rounded-xl shimmer-bg" />

      {/* 排序按钮 */}
      <div className="flex gap-2">
        <div className="h-11 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl shimmer-bg" />
        <div className="h-11 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl shimmer-bg" />
        <div className="h-11 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl shimmer-bg" />
      </div>
    </div>
  )
}

// 骨架侧边栏组件
export function SkeletonSidebar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-64 flex-shrink-0 sticky top-20"
    >
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {/* 标题 */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
          <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        </div>

        {/* 目录列表 */}
        <div className="space-y-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// 骨架页面标题组件
export function SkeletonPageHeader() {
  return (
    <div className="mb-8">
      <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg mb-2" />
      <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
    </div>
  )
}

// 骨架统计信息组件
export function SkeletonStats() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full shimmer-bg" />
    </div>
  )
}

// 骨架工具栏 - 统计+搜索
export function SkeletonToolbar() {
  return (
    <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {/* 第一行：统计 + 搜索 */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        {/* 左侧：统计信息 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <SkeletonStats />
          <div className="hidden sm:block w-px h-5 bg-gray-200 dark:bg-gray-700" />
          <div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        </div>

        {/* 右侧：搜索框 */}
        <div className="relative w-full lg:w-64">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />
        </div>
      </div>

      {/* 第二行：排序 + 目录过滤 */}
      <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {/* 排序按钮 */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-10 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
          <div className="flex gap-1">
            <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded-md shimmer-bg" />
            <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded-md shimmer-bg" />
            <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded-md shimmer-bg" />
          </div>
        </div>

        {/* 目录过滤 */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-10 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
          <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-md shimmer-bg" />
          <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-md shimmer-bg" />
          <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-md shimmer-bg" />
        </div>
      </div>
    </div>
  )
}

// 主骨架屏 - 完整页面加载
export function ManagementSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 顶部工具栏骨架 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
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
