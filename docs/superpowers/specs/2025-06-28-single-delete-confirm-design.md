# 单张删除确认弹窗设计

## 背景

`ImageCard.tsx` 中单张图片删除使用浏览器原生 `confirm()`，存在以下问题：

- **阻塞式体验** — 同步弹窗阻塞主线程，用户无法继续操作
- **样式不统一** — 原生弹窗与批量删除确认弹窗视觉割裂
- **提示信息不足** — 只显示文件名，无法展示文件大小和风险提示

## 目标

将单张删除从原生 `confirm()` 迁移到 shadcn/ui Dialog 组件，与批量删除保持视觉和体验一致，同时提供更完整的提示信息。

## 方案

### 使用组件

- `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter` — `@/components/ui/dialog`
- `AlertTriangle` — `lucide-react`
- `Button` — `@/components/ui/button`（`variant="destructive"` + `variant="outline"`）
- `formatFileSize` — `@/lib/utils`

### 弹窗布局

```
┌─────────────────────────────────────────┐
│  ⚠️  确认删除                    [ ✕ ]  │
│                                         │
│  此操作无法撤销，删除后链接将失效        │
│                                         │
│  📄 example.png                   12 KB │
│                                         │
│  ┌─────────────┐  ┌─────────────┐       │
│  │   取  消    │  │  🗑️ 确认删除 │       │
│  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────┘
```

### 信息层级

| 元素 | 内容 |
|------|------|
| 图标 | `AlertTriangle`，红色圆形背景 (`bg-red-100 dark:bg-red-900/30`) |
| 标题 | `DialogTitle` — "确认删除" |
| 描述 | `DialogDescription` — "此操作无法撤销，删除后链接将失效" |
| 文件信息 | 文件名（`font-mono`） + 文件大小（`formatFileSize`） |
| 取消按钮 | `variant="outline"`，关闭弹窗 |
| 确认按钮 | `variant="destructive"` + `Trash2` icon，调用 `handleDelete` |

### 状态管理

```tsx
// ImageCard.tsx
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
```

| 状态 | 触发条件 |
|------|---------|
| `showDeleteConfirm = true` | 点击菜单栏「删除」 |
| `showDeleteConfirm = false` | 点击取消 / 点击遮罩 / 关闭按钮 |

### 变更文件

| 文件 | 改动 |
|------|------|
| `src/components/image/ImageCard.tsx` | 1) 添加 `Dialog` 系列导入 + `AlertTriangle`；2) 添加 `showDeleteConfirm` state；3) `handleDelete` 重构为开弹窗（删除逻辑移至 Dialog 确认按钮 `onClick`）；4) 在 return 末尾添加 `<Dialog>` 弹窗 JSX |

### 不涉及

- 不修改 API 层（`DELETE /api/images/[sha]`）
- 不修改 `ImageGrid.tsx` 批量删除弹窗
- 不修改 `Dialog` 组件本身
- 不修改 `useImages` hook 或 `bulkDeleteMutation`

## 验收标准

- [ ] 点击单张图片菜单「删除」，弹出 shadcn/ui Dialog（非原生 confirm）
- [ ] 弹窗显示文件名、文件大小、风险提示
- [ ] 点击「取消」关闭弹窗，不触发删除
- [ ] 点击「确认删除」执行删除逻辑，行为与之前一致
- [ ] 深色模式下图标和文字颜色正确
