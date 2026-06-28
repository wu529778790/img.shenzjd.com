'use client'

import { motion } from 'framer-motion'

// 骨架屏动画
const shimmer = {
  initial: { backgroundPosition: '-200% 0' },
  animate: { backgroundPosition: '200% 0' },
  transition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
}

// 骨架卡片组件
export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
    >
      {/* 图片占位 */}
      <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-900">
        <motion.div
          variants={shimmer}
          initial="initial"
          animate="animate"
          className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800"
        />
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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

// 骨架工具栏组件
export function SkeletonToolbar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      {/* 左侧 */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded shimmer-bg" />
      </div>

      {/* 右侧 */}
      <div className="flex gap-2">
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer-bg" />
      </div>
    </motion.div>
  )
}

// 骨架搜索栏组件
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

// 主骨架屏 - 完整页面加载
export function ManagementSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面标题骨架 */}
      <SkeletonPageHeader />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 侧边栏骨架 */}
        <SkeletonSidebar />

        {/* 主内容区 */}
        <div className="flex-1 space-y-4">
          {/* 搜索栏骨架 */}
          <SkeletonSearchBar />

          {/* 工具栏骨架 */}
          <SkeletonToolbar />

          {/* 图片网格骨架 - 显示 10 个 */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
