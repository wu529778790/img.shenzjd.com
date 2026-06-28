# ♿ 可访问性快速参考

## 🚀 快速检查清单

在提交代码前，请确认以下项目：

### 图片和媒体
- [ ] 所有 `<img>` 都有有意义的 `alt` 文本
- [ ] 装饰性图片使用 `alt=""` 或 `aria-hidden="true"`
- [ ] 图片有明确的 `width` 和 `height` 或 `aspect-ratio`

### 按钮和链接
- [ ] 所有交互元素有清晰的可访问名称
- [ ] 图标按钮必须有 `aria-label`
- [ ] 当前页面在导航中有 `aria-current="page"`
- [ ] 禁用状态使用 `disabled` 属性，不只是样式

### 键盘导航
- [ ] 所有功能可通过键盘访问（Tab / Enter / Space / Escape）
- [ ] Tab 顺序与视觉顺序一致
- [ ] 焦点指示器可见且清晰
- [ ] 没有键盘陷阱

### 表单
- [ ] 每个输入有 `<label>`（不是 placeholder-only）
- [ ] 错误消息使用 `role="alert"` 或 `aria-live`
- [ ] 必填字段有 `aria-required="true"`

### ARIA 属性
- [ ] 自定义组件使用适当的 `role` 属性
- [ ] 动态内容变化通知 `aria-live` 区域
- [ ] 展开/折叠状态使用 `aria-expanded`
- [ ] 标签页使用 `role="tablist"` 和 `role="tabpanel"`

---

## 🎨 颜色对比度

### 最小要求

| 文本大小 | 对比度 |
|---------|--------|
| 普通文本 (< 18px) | ≥ 4.5:1 |
| 大文本 (≥ 18px) | ≥ 3:1 |
| 图标/图形 | ≥ 3:1 |

### 验证工具

```
WebAIM Contrast Checker:
https://webaim.org/resources/contrastchecker/

Colorable:
https://colorable.design/
```

---

## 📐 触摸目标

### 最小尺寸

- **iOS**: 44×44pt
- **Android**: 48×48dp
- **Web**: 44×44px（推荐）

### 间距

- 触摸目标之间至少 8px
- 使用 `p-2` (8px) 作为最小内边距

```tsx
// ✅ 正确：44×44px 触摸目标
<button className="h-11 w-11 p-0"> {/* h-11 w-11 = 44px */}
  <Icon className="h-5 w-5" />
</button>

// ❌ 错误：太小
<button className="h-8 w-8 p-0">
  <Icon className="h-4 w-4" />
</button>
```

---

## ⌨️ 键盘交互模式

### 标准快捷键

| 键 | 操作 |
|----|------|
| `Tab` | 下一个元素 |
| `Shift + Tab` | 上一个元素 |
| `Enter` / `Space` | 激活按钮/链接 |
| `Escape` | 关闭模态框/菜单 |
| `↑` / `↓` | 导航列表 |
| `Home` / `End` | 列表首尾 |

### 实现示例

```tsx
// 按钮
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  点击我
</button>

// 自定义可点击卡片
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  卡片内容
</div>
```

---

## 🌓 动画和运动

### 时长标准

```
快速 (微交互): 150ms
标准: 200-250ms
慢速 (页面过渡): 300ms
避免: >500ms
```

### 减少运动偏好

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

### 实现

```tsx
// 使用 framer-motion 时
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2 }}  {/* 200ms */}
>
  内容
</motion.div>

// Tailwind 过渡
<div className="transition-all duration-200 ease-out">
  内容
</div>
```

---

## 🎯 焦点管理

### 可见焦点

```css
:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2;
}
```

### 焦点陷阱（模态框）

```tsx
import { useEffect, useRef } from 'react';

function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

---

## 📝 ARIA 属性速查

### 常用 ARIA 属性

| 属性 | 用途 | 示例 |
|------|------|------|
| `aria-label` | 描述元素用途 | `aria-label="关闭菜单"` |
| `aria-labelledby` | 引用标题元素 ID | `aria-labelledby="dialog-title"` |
| `aria-describedby` | 引用描述元素 ID | `aria-describedby="help-text"` |
| `aria-hidden` | 对屏幕阅读器隐藏 | `aria-hidden="true"` |
| `aria-live` | 动态内容区域 | `aria-live="polite"` |
| `aria-expanded` | 展开/折叠状态 | `aria-expanded={isOpen}` |
| `aria-controls` | 控制的元素 ID | `aria-controls="menu"` |
| `aria-current` | 当前页面/步骤 | `aria-current="page"` |
| `aria-required` | 必填字段 | `aria-required="true"` |
| `aria-invalid` | 验证失败 | `aria-invalid="true"` |
| `role="button"` | 自定义按钮 | `<div role="button">` |
| `role="dialog"` | 模态框 | `role="dialog"` |
| `role="alert"` | 重要提示 | `role="alert"` |
| `role="progressbar"` | 进度条 | `role="progressbar"` |

### 最佳实践

```tsx
// ✅ 好的示例
<button
  aria-label="删除文件"
  aria-describedby="delete-help"
>
  <TrashIcon />
</button>
<span id="delete-help" className="sr-only">
  此操作不可撤销
</span>

// ❌ 避免
<button>
  <TrashIcon />  {/* 只有图标，没有标签 */}
</button>
```

---

## 🧪 测试工具

### 浏览器扩展

- **axe DevTools** - 自动化可访问性测试
- **WAVE** - 可视化可访问性反馈
- **Lighthouse** - 综合质量审计

### 键盘测试

```
1. 放下鼠标 🖱️
2. 只用 Tab 导航
3. 用 Enter/Space 激活
4. 用 Escape 关闭
5. 检查所有功能是否可用
```

### 屏幕阅读器测试

- **macOS**: VoiceOver (Cmd+F5)
- **iOS**: VoiceOver (三击 Home 键)
- **Windows**: NVDA 或 Narrator
- **Android**: TalkBack

---

## 📚 更多资源

- [WCAG 2.1 快速参考](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN 可访问性](https://developer.mozilla.org/zh-CN/docs/Web/Accessibility)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y 项目](https://www.a11yproject.com/)

---

**最后更新**: 2025-06-29
**维护者**: Claude (Anthropic)
