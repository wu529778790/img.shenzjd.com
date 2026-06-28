# ImgX 设计系统文档

## 📋 概述

本文档记录了 ImgX 图床管理工具的设计系统重构，基于 **Soft UI Evolution** 设计语言。

**最后更新**: 2025-06-29

---

## 🎨 设计语言

### 风格：Soft UI Evolution

- **特点**: 改进的软 UI 设计，更好的对比度，现代美学，微妙深度
- **最佳适用**: 现代化企业应用、SaaS 平台、专业工具
- **性能**: ⚡ 优秀
- **可访问性**: ✓ WCAG AA+

---

## 🌈 颜色系统

### 当前颜色配置

| 角色 | 浅色模式 | 深色模式 |
|------|---------|---------|
| Primary | `oklch(0.55 0.22 250)` - 靛蓝色 | `oklch(0.65 0.22 250)` - 亮靛蓝色 |
| Secondary | `oklch(0.92 0.01 250)` - 浅灰蓝 | `oklch(0.25 0.02 250)` - 深灰蓝 |
| Background | `oklch(0.98 0.005 250)` - 近白 | `oklch(0.145 0.02 250)` - 深灰黑 |
| Foreground | `oklch(0.15 0.02 250)` - 深灰黑 | `oklch(0.95 0.01 250)` - 近白 |
| Muted | `oklch(0.96 0.005 250)` | `oklch(0.22 0.02 250)` |
| Accent | `oklch(0.92 0.01 250)` | `oklch(0.25 0.02 250)` |
| Border | `oklch(0.9 0.01 250)` | `oklch(0.25 0.02 250 / 0.5)` |

### 使用原则

1. **语义化命名**: 使用 `bg-primary`, `text-foreground` 而非硬编码颜色
2. **对比度**: 确保正文对比度 ≥ 4.5:1（WCAG AA）
3. **深色模式**: 使用降低饱和度和亮度的变体，而非颜色反转

---

## 🔤 字体系统

### 字体对

- **正文字体**: Inter (300-700)
- **标题字体**: Poppins (400-700)
- **等宽字体**: JetBrains Mono

### 字阶

```
H1: 2.25rem (36px) / sm: 3rem (48px)
H2: 1.875rem (30px) / sm: 2.25rem (36px)
H3: 1.5rem (24px) / sm: 1.875rem (30px)
H4: 1.25rem (20px) / sm: 1.5rem (24px)
Body: 1rem (16px) - 最小 16px 防止 iOS 缩放
Small: 0.875rem (14px)
```

### 字体特征

- 正文行高: 1.5-1.75
- 标题行高: tight (1.25)
- 字距: tracking-tight 用于标题
- 字体平滑: antialiased

---

## 📐 间距系统

### 8px 网格

所有间距遵循 8px 基础网格：

```
space-1: 4px
space-2: 8px
space-3: 12px
space-4: 16px
space-5: 20px
space-6: 24px
space-8: 32px
space-12: 48px
space-16: 64px
```

### 组件间距

- 卡片内边距: `p-4` (16px)
- 卡片间距: `gap-4` 或 `space-y-4`
- 按钮内边距: `px-2.5 py-1.5`
- 输入框内边距: `px-3 py-2`

---

## 🌟 阴影系统 (Soft UI Evolution)

### 阴影等级

```css
--shadow-soft-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-soft-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
--shadow-soft-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);
--shadow-soft-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);
--shadow-soft-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.15);
```

### 使用指南

| 场景 | 阴影 | Tailwind 类 |
|------|------|------------|
| 默认卡片 | soft-md | `shadow-soft` |
| Hover 卡片 | soft-lg | `shadow-soft-hover:hover` |
| 弹出层/Dropdown | elevated | `shadow-elevated` |
| 模态框 | soft-xl | `shadow-soft-xl` |
| 大卡片/Hero | soft-2xl | `shadow-soft-2xl` |

### 深色模式

深色模式下阴影更强以保持可见性：

```css
--shadow-soft-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), ...;
```

---

## 📱 响应式设计

### 断点

```
默认: 375px (移动优先)
sm: 640px
md: 768px (平板)
lg: 1024px (桌面)
xl: 1440px (大屏)
```

### 移动端优先原则

1. 默认样式适配移动端
2. 通过断点逐步增强桌面体验
3. 避免固定宽度容器，使用 `max-w-*`
4. 容器最大宽度: `max-w-5xl` 或 `max-w-6xl`

### 安全区域

- 顶部: `safe-area-inset-top`
- 底部: `safe-area-inset-bottom`
- 固定头部/底部: 使用 `pb-safe` 或 `pt-safe`

---

## ⚡ 动画系统

### 时长标准

```
快速 (微交互): 150ms
标准: 200-250ms
慢速 (页面过渡): 300ms
避免: >500ms
```

### 缓动函数

- **进入**: `ease-out`
- **退出**: `ease-in`
- **悬停**: `ease-in-out`

### 可访问性

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 使用工具类

```css
.transition-soft     /* 200ms ease-out */
.transition-soft-fast  /* 150ms ease-out */
.transition-soft-slow  /* 300ms ease-out */
```

---

## ♿ 可访问性 (WCAG AA+)

### 对比度

- **正文**: ≥ 4.5:1
- **大标题** (18px+): ≥ 3:1
- **图标**: ≥ 3:1

### 交互元素

#### 触摸目标

- **最小尺寸**: 44×44px (iOS) / 48×48dp (Android)
- **间距**: ≥ 8px 间隔

#### 焦点状态

```css
:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2;
}
```

- 所有交互元素必须有可见焦点
- 焦点环颜色使用 `--ring` 变量
- 偏移量 2px 确保不遮挡内容

### ARIA 属性

| 元素类型 | 必需属性 |
|---------|---------|
| 图标按钮 | `aria-label` |
| 自定义按钮 | `role="button"`, `tabIndex={0}` |
| 下拉菜单 | `aria-expanded`, `aria-controls` |
| 进度条 | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| 状态图标 | `aria-label` |
| 导航当前页 | `aria-current="page"` |

### 键盘导航

- `Tab` 顺序匹配视觉顺序
- `Enter` / `Space` 激活按钮
- `Escape` 关闭模态框/菜单
- `↑` / `↓` 导航列表

---

## 🎯 组件模式

### 按钮 (Button)

```tsx
// 主要按钮
<Button variant="default">主要操作</Button>

// 次要按钮
<Button variant="secondary">次要操作</Button>

// 轮廓按钮
<Button variant="outline">轮廓</Button>

// 幽灵按钮
<Button variant="ghost">幽灵</Button>

// 危险按钮
<Button variant="destructive">删除</Button>
```

### 卡片 (Card)

```tsx
<Card className="shadow-soft hover:shadow-soft-hover transition-soft">
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>内容</CardContent>
  <CardFooter>底部</CardFooter>
</Card>
```

### 阴影使用

```tsx
<div className="shadow-soft">默认</div>
<div className="shadow-soft hover:shadow-soft-hover">悬停增强</div>
<div className="shadow-elevated">弹出层</div>
```

---

## 📦 性能优化

### 图片优化

- **格式**: WebP / AVIF
- **懒加载**: `loading="lazy"` 用于非首屏图片
- **占位符**: `placeholder="blur"` 使用 Base64
- **尺寸**: 明确 `width` / `height` 防止 CLS
- **响应式**: `sizes` 属性

### 列表优化

- **虚拟滚动**: ≥50 项使用 `@tanstack/react-virtual`
- **记忆化**: `useMemo` 缓存过滤/排序结果
- **防抖**: 搜索输入 300ms 防抖

### 代码分割

- **动态导入**: 重型组件使用 `dynamic()`
- **路由分割**: Next.js 自动分割

---

## 🔧 开发工具

### Tailwind CSS

- **版本**: 4.x
- **配置**: `@theme inline` 在 globals.css
- **工具类**: `@layer utilities`

### 自定义工具类

```css
/* 阴影 */
.shadow-soft
.shadow-soft-lg
.shadow-elevated

/* 过渡 */
.transition-soft
.transition-soft-fast
.transition-soft-slow

/* 滚动条 */
.scrollbar-thin

/* 渐变文字 */
.gradient-text

/* 骨架屏 */
.skeleton
```

---

## ✅ 重构检查清单

### 已完成 ✅

- [x] 添加 Soft UI 阴影系统
- [x] 实现跳转到主内容链接 (SkipLink)
- [x] 优化图片卡片可访问性
- [x] 优化上传区域可访问性
- [x] 优化上传队列可访问性
- [x] 添加 ARIA 标签
- [x] 确保焦点可见性
- [x] 支持键盘导航
- [x] 添加深色模式阴影变量
- [x] 改进对比度

### 待完成 📋

- [ ] 验证所有颜色对比度 ≥ 4.5:1
- [ ] 测试键盘导航流程
- [ ] 测试屏幕阅读器 (VoiceOver/NVDA)
- [ ] 测试 prefers-reduced-motion
- [ ] 验证触摸目标 ≥ 44px
- [ ] 优化所有动画时长至 150-300ms
- [ ] 添加页面过渡动画
- [ ] 测试深色模式所有状态
- [ ] 优化表单标签和错误提示

---

## 📚 参考资源

- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design 3](https://m3.material.io/)
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

## 🔄 更新日志

### 2025-06-29 - 设计系统重构

- ✅ 实施 Soft UI Evolution 设计语言
- ✅ 添加完整的阴影系统
- ✅ 优化可访问性 (ARIA, 键盘导航, 焦点管理)
- ✅ 创建 SkipLink 组件
- ✅ 改进动画系统
- ✅ 添加深色模式支持
- ✅ 创建设计系统文档
