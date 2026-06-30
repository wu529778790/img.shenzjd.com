'use client'

import { useFramerMotion } from '@/hooks/useFramerMotion'

// ===== 动画变体（纯数据，不依赖 framer-motion） =====

export const ANIMATION_CONFIG = {
  duration: {
    fast: 100,
    normal: 200,
    slow: 300,
  },
  stagger: {
    small: 5,
    medium: 10,
    large: 20,
  },
  scale: {
    hover: 1.02,
    tap: 0.98,
  },
  easing: {
    easeOut: 'easeOut',
    easeIn: 'easeIn',
    easeInOut: 'easeInOut',
  },
} as const

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const listItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export function createStaggerVariants(baseDelay: number = ANIMATION_CONFIG.stagger.small) {
  return {
    animate: {
      transition: {
        staggerChildren: baseDelay / 1000,
      },
    },
  }
}

export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const scaleVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
}

export const slideInRightVariants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
}

export const slideInUpVariants = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 50, opacity: 0 },
}

// ===== 动画组件（使用动态加载的 framer-motion） =====

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const Framer = useFramerMotion()
  const motion = Framer?.motion

  if (!motion) {
    return <div className={className}>{children}</div>
  }

  const MotionDiv = motion.div
  return (
    <MotionDiv
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants as any}
      className={className}
    >
      {children}
    </MotionDiv>
  )
}

interface CardAnimationProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function CardAnimation({ children, className, delay = 0 }: CardAnimationProps) {
  const Framer = useFramerMotion()
  const motion = Framer?.motion

  if (!motion) {
    return <div className={className}>{children}</div>
  }

  const MotionDiv = motion.div
  return (
    <MotionDiv
      initial="initial"
      animate="animate"
      exit="exit"
      variants={cardVariants as any}
      transition={{ delay: delay / 1000 }}
      className={className}
    >
      {children}
    </MotionDiv>
  )
}

interface AnimatedListProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  const Framer = useFramerMotion()
  const motion = Framer?.motion

  if (!motion) {
    return <div className={className}>{children}</div>
  }

  const MotionDiv = motion.div
  return (
    <MotionDiv
      initial="initial"
      animate="animate"
      variants={createStaggerVariants()}
      className={className}
    >
      {children}
    </MotionDiv>
  )
}

interface AnimatedListItemProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  const Framer = useFramerMotion()
  const motion = Framer?.motion

  if (!motion) {
    return <div className={className}>{children}</div>
  }

  const MotionDiv = motion.div
  return (
    <MotionDiv variants={listItemVariants} className={className}>
      {children}
    </MotionDiv>
  )
}
