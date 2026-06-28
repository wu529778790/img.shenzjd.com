# 操作日志/历史设计

## 背景

用户在管理图片时经常需要追溯"刚才做了什么"——上传了几张？删除了哪些？复制了哪个链接？设置改了什么？目前没有统一的日志记录，出问题后只能靠记忆排查。

## 目标

在管理页面添加一个**操作日志面板**，实时记录用户的最近操作（上传、删除、复制链接、设置变更），提供一目了然的历史记录。

## 方案

### 展示位置

放在管理页面右侧（桌面端）/ 底部（移动端），与图片列表并列或叠放。

```
┌─────────────────────────────────────────┬──────────┐
│  图片管理                      [126 张]  │ 操作日志 │
│  ┌──────────┐ ┌──────────┐             │ ───────── │
│  │ 📷 126   │ │ 📦 48 MB │             │ 10:32   ✅ │
│  └──────────┘ └──────────┘             │ 上传成功 3 │
│  [搜索框] [排序]                        │          │
│  ┌─────────────────────────────────┐   │ 10:30   ✅ │
│  │ [图片网格/列表]                  │   │ 删除 example.png │
│  └─────────────────────────────────┘   │          │
│                                         │ 10:25   ✅ │
│                                         │ 复制 Markdown 链接 │
└─────────────────────────────────────────┴──────────┘
```

### 日志项结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 唯一标识（随机字符串） |
| `type` | `'upload' \| 'delete' \| 'copy' \| 'settings'` | 操作类型 |
| `action` | `string` | 简短描述（如"上传成功"、"删除文件"） |
| `status` | `'success' \| 'error' \| 'pending'` | 状态 |
| `timestamp` | `Date` | 操作时间 |
| `detail` | `string?` | 可选详情（文件名、数量等） |

### 状态管理

- 新增 Zustand store：`src/stores/operationLogStore.ts`
- 使用 `zustand/middleware` 的 `persist` 持久化到 `localStorage`
- 最大记录数：100 条（超过后移除最旧的）
- 日志操作 API（供各 hook/组件调用）：
  - `addLog(log: OperationLog)` — 追加一条
  - `clearLogs()` — 清空日志
  - `logs: OperationLog[]` — 只读访问

### 调用点

| 位置 | 触发时机 |
|------|---------|
| `useUpload.ts` `uploadMutation.onSuccess` | 上传成功 |
| `useUpload.ts` `uploadMutation.onError` | 上传失败 |
| `useImages.ts` `deleteMutation.onSuccess` | 单张删除成功 |
| `useImages.ts` `bulkDeleteMutation.onSuccess` | 批量删除成功 |
| `ImageCard.tsx` `handleCopyLink` | 复制链接 |
| `settings/page.tsx` `handleThemeChange` | 切换主题 |
| `settings/page.tsx` `handleCdnChange` | 切换 CDN |

### 组件拆分

```
OperationLogStore (zustand store)         — 日志状态 + persist
OperationLogPanel (OperationLogPanel.tsx)  — 日志面板 UI
  └── OperationLogItem                    — 单条日志项

management/page.tsx                       — 引入 <OperationLogPanel />
```

### 变更文件

| 文件 | 改动 |
|------|------|
| `src/stores/operationLogStore.ts` | **新建** — Zustand store + persist |
| `src/components/OperationLogPanel.tsx` | **新建** — 日志面板组件 |
| `src/hooks/useUpload.ts` | 上传 mutation 回调中调用 `addLog` |
| `src/hooks/useImages.ts` | 删除 mutation 回调中调用 `addLog` |
| `src/components/image/ImageCard.tsx` | 复制链接后调用 `addLog` |
| `src/app/settings/page.tsx` | 主题/CDN 变更后调用 `addLog` |
| `src/app/management/page.tsx` | 引入 `<OperationLogPanel />` |
| `src/types/image.ts` | 新增 `OperationLog` 类型 |

### 不涉及

- 不新增 API 端点（纯前端日志）
- 不改 `configStore`
- 操作日志仅展示最近 100 条，不做分页

## 验收标准

- [ ] 管理页面右侧显示操作日志面板
- [ ] 上传成功/失败时记录日志
- [ ] 删除（单张/批量）成功时记录日志
- [ ] 复制链接时记录日志
- [ ] 切换主题/CDN 时记录日志
- [ ] 日志按时间倒序排列，最新的在最上方
- [ ] 日志最多保留 100 条
- [ ] 支持一键清空日志
- [ ] 深色模式下面板颜色正确
- [ ] `tsc --noEmit` 通过，0 新增 lint 问题
