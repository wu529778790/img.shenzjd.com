# 🎨 ImgX 组件样式指南

## 目录

1. [基础原则](#基础原则)
2. [通用模式](#通用模式)
3. [组件规范](#组件规范)
4. [代码示例](#代码示例)
5. [反模式](#反模式)

---

## 基础原则

### 核心设计语言

**Soft UI Evolution** - 现代、友好、专业的设计系统

#### 关键特征

- ✅ **柔和阴影** - 清晰的层次，而非生硬的投影
- ✅ **圆润边角** - 8-12px 圆角
- ✅ **微妙深度** - 通过阴影而非边框创建层次
- ✅ **流畅动画** - 150-300ms，尊重用户偏好
- ✅ **高可访问性** - WCAG AA+ 标准

---

## 通用模式

### 1. 卡片组件

#### 标准卡片

```tsx
<div className="
  rounded-xl
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  shadow-soft
  hover:shadow-soft-hover
  transition-all duration-200 ease-out
">
  {/* 卡片内容 */}
</div>
```

#### 大卡片/Hero 卡片

```tsx
<div className="
  rounded-2xl
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  shadow-soft-lg
">
  {/* 内容 */}
</div>
```

#### 可交互卡片

```tsx
<button
  className="
    group
    w-full text-left
    rounded-xl
    bg-white dark:bg-gray-800
    border border-gray-200 dark:border-gray-700
    shadow-sm hover:shadow-md
    transition-all duration-200
    focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
  "
>
  卡片内容
</button>
```

### 2. 按钮

#### 主要按钮

```tsx
<Button variant="default" size="default">
  主要操作
</Button>
```

#### 次要按钮

```tsx
<Button variant="secondary">
  次要操作
</Button>
```

#### 图标按钮

```tsx
<Button
  variant="ghost"
  size="icon"
  aria-label="删除"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

#### 加载状态

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      加载中...
    </>
  ) : (
    '提交'
  )}
</Button>
```

### 3. 输入框

#### 标准输入

```tsx
<div className="space-y-2">
  <Label htmlFor="email">邮箱</Label>
  <Input
    id="email"
    type="email"
    placeholder="your@email.com"
    aria-describedby="email-help"
  />
  <p id="email-help" className="text-sm text-gray-500">
    我们不会分享您的邮箱
  </p>
</div>
```

#### 错误状态

```tsx
<div className="space-y-2">
  <Label htmlFor="password">密码</Label>
  <Input
    id="password"
    type="password"
    aria-invalid="true"
    aria-describedby="password-error"
    className="border-red-500 focus-visible:ring-red-500"
  />
  <p id="password-error" role="alert" className="text-sm text-red-600">
    密码至少需要 8 个字符
  </p>
</div>
```

### 4. 阴影使用

| 场景 | 类名 | 用途 |
|------|------|------|
| 默认卡片 | `shadow-soft` | 一般内容卡片 |
| 悬停增强 | `shadow-soft-hover:hover` | 可点击卡片的悬停状态 |
| 大型卡片 | `shadow-soft-lg` | 英雄区域、大卡片 |
| 弹窗/下拉 | `shadow-elevated` | 悬浮在内容之上的元素 |
| 微小 | `shadow-soft-sm` | 细微的提升效果 |

### 5. 过渡动画

| 工具类 | 时长 | 用途 |
|--------|------|------|
| `transition-soft-fast` | 150ms | 微交互（按钮按下、图标旋转） |
| `transition-soft` | 200ms | 标准状态切换（默认） |
| `transition-soft-slow` | 300ms | 页面过渡、模态框出现 |

```tsx
// 示例
<button className="transition-soft hover:bg-gray-100">
  悬停我
</button>

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}  {/* 200ms */}
>
  淡入内容
</motion.div>
```

### 6. 间距系统

使用 8px 基础网格：

```tsx
// 小间距 (8px)
<div className="gap-2">  {/* 8px */}

// 中间距 (16px)
<div className="gap-4">  {/* 16px */}

// 大间距 (24px)
<div className="gap-6">  {/* 24px */}

// 超大间距 (32px)
<div className="gap-8">  {/* 32px */}
```

**实用工具类**（globals.css 中已定义）：

```tsx
<div className="space-soft-4">  {/* space-y: 16px */}

<div className="gap-soft-6">  {/* gap: 24px */}
```

### 7. 色彩系统

#### 语义化颜色

```tsx
// 背景
bg-background          // 主背景
bg-card                // 卡片背景
bg-muted               // 弱化背景

// 文字
text-foreground        // 主文字
text-muted-foreground  // 弱化文字

// 状态
text-primary           // 主色调
text-destructive       // 危险/错误
```

#### 避免硬编码

```tsx
// ❌ 避免
<div className="bg-gray-100 text-gray-900">

// ✅ 推荐
<div className="bg-muted text-foreground">
```

---

## 组件规范

### 可访问性要求

所有交互元素必须满足：

#### 1. 键盘可访问

```tsx
// ✅ 添加键盘支持
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  可点击区域
</div>
```

#### 2. 焦点可见

```tsx
// ✅ 使用全局焦点样式（已在 globals.css 定义）
className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
```

#### 3. ARIA 标签

```tsx
// ✅ 图标按钮必须有 aria-label
<Button aria-label="删除项目">
  <Trash2 className="h-4 w-4" />
</Button>

// ✅ 状态图标有 aria-label
<CheckCircle aria-label="上传成功" />

// ✅ 动态内容有 aria-live
<div aria-live="polite" aria-atomic="true">
  {message}
</div>
```

#### 4. 最小触摸目标

```tsx
// ✅ 确保至少 44×44px
<button className="h-11 w-11">  {/* 44px */}
  <Icon className="h-5 w-5" />
</button>
```

---

## 代码示例

### 完整示例：图片卡片

```tsx
import { memo } from 'react';
import Image from 'next/image';
import { MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ImageCard = memo(function ImageCard({
  image,
  onDelete,
  onPreview,
  selected,
  onSelect,
  selectable,
}: ImageCardProps) {
  return (
    <div
      className="
        group relative overflow-hidden rounded-xl
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-md
        transition-all duration-200 ease-out
        cursor-pointer
        focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        aria-[pressed]:ring-2 aria-[pressed]:ring-primary
      "
      onClick={() => {
        if (selectable) {
          onSelect?.(image.id, !selected);
        } else {
          onPreview?.(image);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (selectable) {
            onSelect?.(image.id, !selected);
          } else {
            onPreview?.(image);
          }
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${selected ? '取消选择' : '选择'}图片: ${image.name}`}
      aria-pressed={selectable ? selected : undefined}
    >
      {/* 图片 */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Image
          src={image.url}
          alt={image.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* 信息 */}
      <div className="p-4 space-y-2">
        <p className="text-sm font-medium truncate">{image.name}</p>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(image.id);
          }}
          aria-label={`删除 ${image.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
```

---

## 反模式 ❌

### 避免这些做法

#### ❌ 不使用 Emoji 作为图标

```tsx
// ❌ 错误
<button>🎨</button>
<button>🚀</button>

// ✅ 正确
<button><Palette className="h-4 w-4" /></button>
<button><Rocket className="h-4 w-4" /></button>
```

#### ❌ 不要硬编码颜色

```tsx
// ❌ 错误
<div className="bg-gray-100 text-gray-900">

// ✅ 正确
<div className="bg-muted text-foreground">
```

#### ❌ 不要使用占位符作为标签

```tsx
// ❌ 错误
<input placeholder="邮箱" />

// ✅ 正确
<div>
  <Label htmlFor="email">邮箱</Label>
  <Input id="email" />
</div>
```

#### ❌ 不要禁用焦点

```tsx
// ❌ 错误
<button className="focus:outline-none">点击</button>

// ✅ 正确
<button className="focus-visible:ring-2 focus-visible:ring-primary">
  点击
</button>
```

#### ❌ 不要只使用颜色传达信息

```tsx
// ❌ 错误 - 只使用红色边框
<div className="border-red-500">错误</div>

// ✅ 正确 - 颜色 + 图标 + 文字
<div className="text-red-600">
  <AlertCircle className="h-4 w-4" />
  错误：请输入有效的邮箱
</div>
```

#### ❌ 不要使用过长的动画

```tsx
// ❌ 错误
<motion.div transition={{ duration: 1 }}>  {/* 1000ms 太长 */}

// ✅ 正确
<motion.div transition={{ duration: 0.2 }}>  {/* 200ms */
```

---

## 📦 工具类速查

### 阴影类

```tsx
shadow-soft          // 默认
shadow-soft-sm       // 微小
shadow-soft-lg       // 大
shadow-soft-xl       // 特大
shadow-soft-hover    // 悬停增强
shadow-elevated      // 弹窗级
```

### 过渡类

```tsx
transition-soft        // 200ms ease-out
transition-soft-fast   // 150ms ease-out
transition-soft-slow   // 300ms ease-out
```

### 间距类

```tsx
space-soft-1   // 4px
space-soft-2   // 8px
space-soft-3   // 12px
space-soft-4   // 16px
space-soft-6   // 24px
space-soft-8   // 32px
gap-soft-2     // 8px
gap-soft-4     // 16px
gap-soft-6     // 24px
```

---

## 🔧 开发工具

### 检查可访问性

```bash
# 安装 axe-core
npm install --save-dev @axe-core/react

# 在开发环境使用
import React from 'react';
import ReactDOM from 'react-dom/client';
import AxeBuilder from '@axe-core/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <AxeBuilder />
  </React.StrictMode>
);
```

### 验证对比度

使用浏览器扩展：
- **axe DevTools** - Chrome/Firefox
- **WAVE** - 可视化反馈
- **Lighthouse** - 综合审计

---

**最后更新**: 2025-06-29
**版本**: 1.0
