# 操作日志/历史 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an operation log panel to the management page that records uploads, deletes, link copies, and settings changes in real-time

**Architecture:** New Zustand store (persisted) for log state, new OperationLogPanel component, integration hooks in existing mutation callbacks

**Tech Stack:** React, TypeScript, Zustand + persist middleware, Tailwind CSS, lucide-react, shadcn/ui Button/Card, date-fns

## Global Constraints

- Log is frontend-only — no API endpoint
- Zustand persist middleware stores to `localStorage` under key `operation-log-storage`
- Max 100 entries — excess removed on add (FIFO)
- No changes to `configStore`
- `OperationLog` type defined in `src/types/image.ts`
- All log calls are fire-and-forget (no await, no error propagation to callers)
- Dark mode correct on panel

---

## File Structure

```
src/types/image.ts                           — MODIFY (add OperationLog type)
src/stores/operationLogStore.ts              — CREATE (zustand store + persist)
src/components/OperationLogPanel.tsx          — CREATE (log panel UI)
src/hooks/useUpload.ts                       — MODIFY (addLog in mutation callbacks)
src/hooks/useImages.ts                       — MODIFY (addLog in delete callbacks)
src/components/image/ImageCard.tsx           — MODIFY (addLog after copy link)
src/app/settings/page.tsx                    — MODIFY (addLog after theme/CDN change)
src/app/management/page.tsx                  — MODIFY (render <OperationLogPanel />)
```

---

### Task 1: Define OperationLog type and create store

**Files:**
- Modify: `src/types/image.ts`
- Create: `src/stores/operationLogStore.ts`

#### Step 1.1 — Add OperationLog type to image.ts

Add after `LinkOptions` interface (end of file):

```ts
export interface OperationLog {
  id: string
  type: 'upload' | 'delete' | 'copy' | 'settings'
  action: string
  status: 'success' | 'error' | 'pending'
  timestamp: Date
  detail?: string
}
```

#### Step 1.2 — Create operationLogStore.ts

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OperationLog } from '@/types/image'

interface OperationLogState {
  logs: OperationLog[]
  addLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void
  clearLogs: () => void
}

const MAX_LOGS = 100

export const useOperationLogStore = create<OperationLogState>()(
  persist(
    (set) => ({
      logs: [],

      addLog: (log) => {
        set((state) => {
          const newLog: OperationLog = {
            ...log,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date(),
          }
          const updated = [newLog, ...state.logs]
          return {
            logs: updated.length > MAX_LOGS ? updated.slice(0, MAX_LOGS) : updated,
          }
        })
      },

      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'operation-log-storage',
    }
  )
)
```

- [ ] **Step 1.3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 1.4: Commit Task 1a**

```bash
git add src/types/image.ts src/stores/operationLogStore.ts
git commit -m "feat(log): add OperationLog type and operation log zustand store"
```

---

### Task 2: Create OperationLogPanel component

**Files:**
- Create: `src/components/OperationLogPanel.tsx`

```tsx
'use client'

import { useOperationLogStore } from '@/stores/operationLogStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Trash2, CheckCircle, XCircle, Loader2, Upload, Trash2 as TrashIcon, Copy, Settings } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const typeConfig: Record<string, { icon: typeof Upload; label: string; color: string }> = {
  upload:   { icon: Upload,    label: '上传', color: 'text-blue-500' },
  delete:   { icon: TrashIcon, label: '删除', color: 'text-red-500' },
  copy:     { icon: Copy,      label: '复制', color: 'text-green-500' },
  settings: { icon: Settings,  label: '设置', color: 'text-amber-500' },
}

const statusConfig: Record<string, { icon: typeof CheckCircle; className: string }> = {
  success: { icon: CheckCircle, className: 'text-green-500' },
  error:   { icon: XCircle,    className: 'text-red-500' },
  pending: { icon: Loader2,    className: 'text-gray-400 animate-spin' },
}

export function OperationLogPanel() {
  const logs = useOperationLogStore((s) => s.logs)
  const clearLogs = useOperationLogStore((s) => s.clearLogs)

  if (logs.length === 0) {
    return (
      <Card className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-sm">操作日志</h3>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">暂无操作记录</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm">操作日志</h3>
        <Button size="sm" variant="ghost" onClick={clearLogs} className="h-7 px-2 text-xs">
          <Trash2 className="h-3 w-3 mr-1" />
          清空
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-220px)] max-h-[400px]">
        <div className="space-y-2">
          {logs.map((log) => {
            const typeInfo = typeConfig[log.type] || typeConfig.settings
            const statusInfo = statusConfig[log.status] || statusConfig.success
            const TypeIcon = typeInfo.icon
            const StatusIcon = statusInfo.icon
            return (
              <div
                key={log.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <TypeIcon className={cn('h-4 w-4 flex-shrink-0 mt-0.5', typeInfo.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.action}</p>
                  {log.detail && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{log.detail}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: zhCN })}
                  </p>
                </div>
                <StatusIcon className={cn('h-4 w-4 flex-shrink-0', statusInfo.className)} />
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
```

- [ ] **Step 2.1: Create OperationLogPanel.tsx**

Write the file with exact code above.

- [ ] **Step 2.2: Verify ScrollArea and Button imports**

Confirm `ScrollArea` exists at `@/components/ui/scroll-area`. If missing, add it:
```bash
npx shadcn@latest add scroll-area 2>/dev/null || echo "checking manually"
```

If `npx shadcn` is not available, run `ls src/components/ui/scroll-area*` and add manually if needed.

- [ ] **Step 2.3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2.4: Commit Task 2a**

```bash
git add src/components/OperationLogPanel.tsx
git commit -m "feat(log): add operation log panel component"
```

---

### Task 3: Integrate log calls in upload hook

**Files:**
- Modify: `src/hooks/useUpload.ts`

- [ ] **Step 3.1: Import addLog**

Add to existing import line 10:
```ts
import { useOperationLogStore } from '@/stores/operationLogStore'
```

Destructure in hook body (around line 20):
```ts
const { addLog: addOperationLog } = useOperationLogStore()
```

- [ ] **Step 3.2: Add log calls in uploadMutation callbacks**

In `onSuccess` (line 106–108), replace `toast.success('上传成功')` with:
```ts
toast.success('上传成功')
addOperationLog({
  type: 'upload',
  action: '上传成功',
  status: 'success',
  detail: file ? `${(file as any).name}` : undefined,
})
```

Wait — the mutation function's `onSuccess` doesn't receive the file directly. The `uploadMutation.mutate(file, { onSuccess })` passes the file as context. Let me verify: TanStack Query's `onSuccess` receives `(data, variables)` where `variables` is the `file`. So:

```ts
onSuccess: (data, variables: File) => {
  toast.success('上传成功')
  addOperationLog({
    type: 'upload',
    action: '上传成功',
    status: 'success',
    detail: variables?.name,
  })
},
```

In `onError` (line 109–111):
```ts
onError: (error: Error) => {
  toast.error(error.message)
  addOperationLog({
    type: 'upload',
    action: '上传失败',
    status: 'error',
    detail: error.message,
  })
},
```

- [ ] **Step 3.3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3.4: Commit**

```bash
git add src/hooks/useUpload.ts
git commit -m "feat(log): log upload success/failure in useUpload hook"
```

---

### Task 4: Integrate log calls in image delete hooks

**Files:**
- Modify: `src/hooks/useImages.ts`

- [ ] **Step 4.1: Import addLog**

Add to existing imports:
```ts
import { useOperationLogStore } from '@/stores/operationLogStore'
```

Destructure near top of `useImages` body:
```ts
const { addLog: addOperationLog } = useOperationLogStore()
```

- [ ] **Step 4.2: Log in deleteMutation onSuccess**

At `deleteMutation.onSuccess` (line 83–87), add log after `toast.success`:
```ts
onSuccess: () => {
  toast.success('删除成功')
  addOperationLog({
    type: 'delete',
    action: '删除文件',
    status: 'success',
    detail: filePath,
  })
  queryClient.invalidateQueries({ queryKey: ['images', owner, repo, branch] })
},
```

- [ ] **Step 4.3: Log in bulkDeleteMutation onSuccess**

At `bulkDeleteMutation.onSuccess` (line 114–121), add log:
```ts
onSuccess: (data) => {
  if (data.failed === 0) {
    toast.success(`成功删除 ${data.successful} 个文件`)
  } else {
    toast.success(`删除完成：${data.successful} 成功，${data.failed} 失败`)
  }
  addOperationLog({
    type: 'delete',
    action: data.failed === 0 ? '批量删除成功' : '批量删除（部分失败）',
    status: data.failed === 0 ? 'success' : 'error',
    detail: `${data.successful} 成功，${data.failed} 失败`,
  })
  queryClient.invalidateQueries({ queryKey: ['images', owner, repo, branch] })
},
```

- [ ] **Step 4.4: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4.5: Commit**

```bash
git add src/hooks/useImages.ts
git commit -m "feat(log): log delete operations in useImages hook"
```

---

### Task 5: Integrate log calls in ImageCard copy link

**Files:**
- Modify: `src/components/image/ImageCard.tsx`

- [ ] **Step 5.1: Import addLog**

Add to imports:
```ts
import { useOperationLogStore } from '@/stores/operationLogStore'
```

- [ ] **Step 5.2: Get store instance**

After line 36 (`const configStore = useConfigStore()`):
```ts
const { addLog: addOperationLog } = useOperationLogStore()
```

- [ ] **Step 5.3: Add log after successful copy**

In `handleCopyLink` after `toast.success(...)` (line 63), add:
```ts
addOperationLog({
  type: 'copy',
  action: '复制链接',
  status: 'success',
  detail: `${formatNames[format]}: ${link}`,
})
```

- [ ] **Step 5.4: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5.5: Commit**

```bash
git add src/components/image/ImageCard.tsx
git commit -m "feat(log): log link copy in ImageCard"
```

---

### Task 6: Integrate log calls in settings page

**Files:**
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 6.1: Import addLog**

Add to imports:
```ts
import { useOperationLogStore } from '@/stores/operationLogStore'
```

- [ ] **Step 6.2: Get store instance**

After `const configStore: ConfigState = useConfigStore()`:
```ts
const { addLog: addOperationLog } = useOperationLogStore()
```

- [ ] **Step 6.3: Log theme change**

In `handleThemeChange` (line 67–70), after `toast.success`:
```ts
const themeNames: Record<string, string> = { light: '浅色', dark: '深色', system: '跟随系统' }
addOperationLog({
  type: 'settings',
  action: '切换主题',
  status: 'success',
  detail: themeNames[newTheme],
})
```

- [ ] **Step 6.4: Log CDN change**

In `handleCdnChange` (line 89–94), after `toast.success`:
```ts
const cdnNames: Record<string, string> = { github: 'GitHub', jsdelivr: 'jsDelivr', 'jsdmirror': 'jsDMirror', 'github-pages': 'GitHub Pages' }
addOperationLog({
  type: 'settings',
  action: '切换 CDN',
  status: 'success',
  detail: cdnNames[value],
})
```

- [ ] **Step 6.5: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6.6: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat(log): log theme and CDN changes in settings"
```

---

### Task 7: Render OperationLogPanel in management page

**Files:**
- Modify: `src/app/management/page.tsx`

- [ ] **Step 7.1: Import OperationLogPanel**

Add near other image component imports:
```ts
import { OperationLogPanel } from '@/components/OperationLogPanel'
```

- [ ] **Step 7.2: Render panel beside image list**

Replace the current two-column layout (`div.flex.flex-col.lg:flex-row`) at line ~185 with a three-column layout on desktop:

```tsx
<div className="flex flex-col lg:flex-row gap-6">
  {/* Left sidebar — directory tree */}
  <AnimatePresence>
    {directories.length > 0 && (
      <motion.aside ...>
        {/* ...existing sidebar JSX unchanged... */}
      </motion.aside>
    )}
  </AnimatePresence>

  {/* Main content — stats + grid */}
  <div className="flex-1 min-w-0">
    {/* 图片统计 */}
    <ImageStats images={images} />

    {/* 搜索栏和排序 */}
    <motion.div ...>
      {/* ...existing search/sort JSX unchanged... */}
    </motion.div>

    {/* 图片列表 */}
    <ImageGrid ... />
  </div>

  {/* Right sidebar — operation log */}
  <div className="hidden lg:block w-72 flex-shrink-0">
    <div className="sticky top-20">
      <OperationLogPanel />
    </div>
  </div>
</div>
```

For mobile, the log panel should NOT appear (hidden by `hidden lg:block`).

- [ ] **Step 7.3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7.4: Commit**

```bash
git add src/app/management/page.tsx
git commit -m "feat(management): render operation log panel in sidebar"
```

---

## Spec Self-Review

### 1. Spec Coverage

| Spec 要求 | 对应 Task |
|----------|-----------|
| OperationLog 类型 | Task 1 Step 1.1 |
| Zustand persist store (max 100) | Task 1 Step 1.2 |
| OperationLogPanel 组件 | Task 2 |
| 上传成功/失败日志 | Task 3 |
| 删除成功/批量删除日志 | Task 4 |
| 复制链接日志 | Task 5 |
| 主题/CDN 变更日志 | Task 6 |
| 管理页右侧面板 | Task 7 |
| 深色模式 | Task 2 (all dark: classes) |
| 清空日志按钮 | Task 2 |
| 纯前端，无 API | All tasks |

No gaps.

### 2. Placeholder Scan

No "TBD" or "TODO".

### 3. Type Consistency

- `OperationLog` — added to `src/types/image.ts`, imported where needed
- `useOperationLogStore` — single store, imported in 4 hooks/components
- `addLog` accepts `Omit<OperationLog, 'id' | 'timestamp'>` — callers never set id/timestamp
- `MAX_LOGS = 100` — FIFO slice at 0
- `ScrollArea` — `@/components/ui/scroll-area`

All consistent.
