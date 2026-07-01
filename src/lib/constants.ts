/**
 * 图片管理页面常量配置
 * 集中管理所有魔法数字，便于维护和调整
 */

export const IMAGE_GRID_CONFIG = {
  // 初始加载配置
  INITIAL_LOAD_COUNT: 8,       // 首屏加载图片数量（减少以提升性能）
  BATCH_SIZE: 8,                // 懒加载批次大小

  // 懒加载配置（原虚拟化配置已移除，改用懒加载）
  ESTIMATED_ROW_HEIGHT: 360,    // 预估行高（像素）- 已弃用，保留用于兼容
  VIRTUALIZATION_THRESHOLD: 30, // 初始加载数量阈值：<=30加载全部，>30初始加载8
  VIRTUALIZATION_OVERSCAN: 3,   // 预渲染行数 - 已弃用，保留用于兼容

  // 响应式断点（与 Tailwind 保持一致）
  BREAKPOINTS: {
    sm: 640,   // sm: 640px+
    md: 768,   // md: 768px+
    lg: 1024,  // lg: 1024px+
    xl: 1280,  // xl: 1280px+
  },

  // 响应式列数（优化：移除 tablet 断点，减少 resize 时重排）
  COLUMNS: {
    mobile: 2,    // < 768px
    desktop: 3,    // 768px - 1023px
    wide: 4,      // >= 1024px
  } as const,

  // 图片预览配置
  PREVIEW: {
    MAX_IMAGES: 100,  // 预览导航时最多显示图片数
  },
} as const

export const BULK_DELETE_CONFIG = {
  BATCH_SIZE: 3,          // 每批删除数量
  BATCH_DELAY_MS: 500,    // 批次间延迟（毫秒）
} as const

export const SEARCH_CONFIG = {
  DEBOUNCE_MS: 200,       // 搜索防抖延迟
  MIN_QUERY_LENGTH: 0,    // 最小搜索长度
} as const

export const DIRECTORY_CONFIG = {
  DEBOUNCE_MS: 300,       // 目录切换防抖延迟
  MAX_DIRECTORIES: 50,    // 最大目录显示数量
} as const

export const socialLinks = [
  { name: 'Telegram', href: 'https://t.me/shenzjd_com', icon: 'telegram' },
  { name: 'GitHub', href: 'https://github.com/wu529778790', icon: 'github' },
  { name: 'X', href: 'https://x.com/shenzujiudi', icon: 'x' },
] as const

export const navLinks = [
  { name: '网址导航', href: 'https://navhub.shenzjd.com' },
  { name: '热门资源', href: 'https://shenzjd.com' },
  { name: '网盘搜索', href: 'https://panhub.shenzjd.com' },
  { name: '在线网盘', href: 'https://alist.shenzjd.com' },
  { name: '视频解析', href: 'https://parse.shenzjd.com' },
  { name: 'GIT 图床', href: 'https://img.shenzjd.com' },
  { name: 'GIT 短链', href: 'https://duanlian.shenzjd.com' },
  { name: '热点聚合', href: 'https://newshub.shenzjd.com' },
  { name: '必应壁纸', href: 'https://bing.shenzjd.com' },
] as const
