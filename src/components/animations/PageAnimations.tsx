'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence, Variants } from 'framer-motion'

// 动画配置常量
export const ANIMATION_CONFIG = {
  // 基础持续时间 (ms)
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  // 交错延迟 (ms)
  stagger: {
    small: 30,
    medium: 50,
    large: 80,
  },
  // 缩放效果
  scale: {
    hover: 1.02,
    tap: 0.98,
  },
  // 缓动函数
  easing: {
    easeOut: 'easeOut',
    easeIn: 'easeIn',
    easeInOut: 'easeInOut',
  },
} as const

// 页面进入动画
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal / 1000,
      ease: ANIMATION_CONFIG.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: ANIMATION_CONFIG.duration.fast / 1000,
      ease: ANIMATION_CONFIG.easing.easeIn,
    },
  },
}

// 卡片进入动画
export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal / 1000,
      ease: ANIMATION_CONFIG.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: ANIMATION_CONFIG.duration.fast / 1000,
    },
  },
}

// 列表项交错进入动画
export const listItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal / 1000,
      ease: ANIMATION_CONFIG.easing.easeOut,
    },
  },
}

// 创建一个交错动画的列表
// baseDelay: 交错延迟（ms），用于 staggerChildren，值越大列表越长动画越慢
export function createStaggerVariants(baseDelay: number = ANIMATION_CONFIG.stagger.small) {
  return {
    animate: {
      transition: {
        staggerChildren: baseDelay / 1000,
      },
    },
  }
}

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

/**
 * 页面过渡包装器
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface CardAnimationProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

/**
 * 带动画的卡片容器
 */
export function CardAnimation({ children, className, delay = 0 }: CardAnimationProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={cardVariants}
      transition={{ delay: delay / 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedListProps {
  children: React.ReactNode
  className?: string
}

/**
 * 带动画列表容器（需要配合 stagger 使用）
 */
export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={createStaggerVariants()}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedListItemProps {
  children: React.ReactNode
  className?: string
}

/**
 * 列表项动画
 */
export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <motion.div variants={listItemVariants} className={className}>
      {children}
    </motion.div>
  )
}

// 淡入淡出动画
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// 缩放动画
export const scaleVariants: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
}

// 滑入动画（从右侧）
export const slideInRightVariants: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
}

// 滑入动画（从下方）
export const slideInUpVariants: Variants = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 50, opacity: 0 },
}
