// Tailwind CSS Configuration for Tree Shaking (v4)
// 在 Tailwind CSS v4 中，配置主要通过 CSS @theme 指令完成
// 此文件用于记录内容扫描路径和特殊配置

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // 核心应用文件
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // 组件库文件
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // shadcn/ui 组件（如果存在）
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // 动态类名白名单（避免被 tree-shaking 误删）
  safelist: [
    // shadcn/ui badge variants
    'bg-primary',
    'bg-secondary',
    'bg-destructive',
    'bg-muted',
    'bg-accent',
    'text-primary',
    'text-secondary',
    'text-destructive',
    'text-muted-foreground',
    // 动画类
    'animate-pulse',
    'animate-spin',
    // 渐变类
    'from-indigo-500',
    'to-violet-600',
    'from-indigo-400',
    'via-violet-400',
    'to-purple-500',
  ],
  theme: {
    extend: {
      // 自定义阴影
      boxShadow: {
        'modern': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'modern-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'modern-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      // 自定义动画
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-ring': 'pulse-ring 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
