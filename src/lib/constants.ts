/**
 * 图片管理页面常量配置
 * 集中管理所有魔法数字，便于维护和调整
 */

export const IMAGE_GRID_CONFIG = {
  // 初始加载配置
  INITIAL_LOAD_COUNT: 12,      // 首屏加载图片数量
  BATCH_SIZE: 8,                // 懒加载批次大小

  // 懒加载配置（原虚拟化配置已移除，改用懒加载）
  ESTIMATED_ROW_HEIGHT: 360,    // 预估行高（像素）- 已弃用，保留用于兼容
  VIRTUALIZATION_THRESHOLD: 30, // 初始加载数量阈值：<=30加载全部，>30初始加载12
  VIRTUALIZATION_OVERSCAN: 3,   // 预渲染行数 - 已弃用，保留用于兼容

  // 响应式断点（与 Tailwind 保持一致）
  BREAKPOINTS: {
    sm: 640,   // sm: 640px+
    md: 768,   // md: 768px+
    lg: 1024,  // lg: 1024px+
    xl: 1280,  // xl: 1280px+
  },

  // 响应式列数
  COLUMNS: {
    mobile: 2,    // < 640px
    tablet: 3,    // 640px - 767px
    desktop: 4,   // 768px - 1023px
    wide: 5,      // >= 1024px
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
