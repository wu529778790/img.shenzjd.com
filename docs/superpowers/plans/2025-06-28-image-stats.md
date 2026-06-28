# 图片统计信息 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4-card statistics overview at the top of the management page showing total images, total size, dominant format, and last upload time

**Architecture:** New `ImageStats` component computes stats from `images` array via `useMemo`; `management/page.tsx` renders it above the image grid

**Tech Stack:** React, TypeScript, Tailwind CSS, lucide-react, date-fns, shadcn/ui Card

## Global Constraints

- Pure frontend computation — no API changes, no store changes
- `useImages` hook is consumed as-is; only its `images` return value is used
- `formatFileSize` from `@/lib/utils` must be used for all byte→string conversions
- `date-fns` `formatDistanceToNow` for relative time (already a project dependency)
- Dark mode colors must be correct on all stat cards
- No charting libraries — plain text/number cards only
- When `images.length === 0`, render nothing (or empty state) — management page already handles this

---

## File Structure

```
src/components/image/ImageStats.tsx    — CREATE (new stat card component)
src/app/management/page.tsx            — MODIFY (import and render <ImageStats />)
src/types/image.ts                     — READ ONLY (ImageFile type)
src/lib/utils.ts                       — READ ONLY (formatFileSize)
```

### Existing utilities to leverage

- `ImageFile` — `@/types/image` (has `name`, `size`, `path`, `uploaded_at`)
- `formatFileSize` — `@/lib/utils`
- `formatDistanceToNow` — `date-fns`
- `Card` — `@/components/ui/card`
- `Image` — `lucide-react` (`Image`, `HardDrive`, `FileImage`, `Calendar`)
- `cn` — `@/lib/utils`

---

### Task 1: Create ImageStats component

**Files:**
- Create: `src/components/image/ImageStats.tsx`

**Interfaces:**
- Consumes: `images: ImageFile[]`
- Produces: `<ImageStats />` — renders 4 stat cards or null

```tsx
'use client'

import { useMemo } from 'react'
import { Image, HardDrive, FileImage, Calendar } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ImageFile } from '@/types/image'

interface ImageStatsProps {
  images: ImageFile[]
}

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <Card className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </Card>
  )
}

export function ImageStats({ images }: ImageStatsProps) {
  const stats = useMemo(() => {
    if (images.length === 0) return null

    // Total count
    const totalCount = images.length

    // Total size
    const totalSize = images.reduce((sum, img) => sum + img.size, 0)

    // Dominant format
    const formatCounts: Record<string, number> = {}
    images.forEach((img) => {
      const ext = img.name.split('.').pop()?.toLowerCase() || 'unknown'
      formatCounts[ext] = (formatCounts[ext] || 0) + 1
    })
    const dominantFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]
    const dominantFormatLabel = dominantFormat
      ? `${dominantFormat[0].toUpperCase()} (${Math.round(dominantFormat[1] / totalCount * 100)}%)`
      : '—'

    // Last upload
    const lastUpload = images.reduce((latest, img) => {
      const date = img.uploaded_at ? new Date(img.uploaded_at).getTime() : 0
      return date > latest ? date : latest
    }, 0)
    const lastUploadLabel = lastUpload
      ? formatDistanceToNow(new Date(lastUpload), { addSuffix: true, locale: zhCN })
      : '未知'

    return {
      totalCount: totalCount.toString(),
      totalSize: formatFileSize(totalSize),
      dominantFormat: dominantFormatLabel,
      lastUpload: lastUploadLabel,
    }
  }, [images])

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Image className="h-6 w-6 text-primary" />}
        value={stats.totalCount}
        label="总图片数"
      />
      <StatCard
        icon={<HardDrive className="h-6 w-6 text-primary" />}
        value={stats.totalSize}
        label="总大小"
      />
      <StatCard
        icon={<FileImage className="h-6 w-6 text-primary" />}
        value={stats.dominantFormat}
        label="主要格式"
      />
      <StatCard
        icon={<Calendar className="h-6 w-6 text-primary" />}
        value={stats.lastUpload}
        label="最近上传"
      />
    </div>
  )
}
```

- [ ] **Step 1: Create the file with exact content above**

Write `src/components/image/ImageStats.tsx` with the exact code shown.

- [ ] **Step 2: Import and render in management page**

In `src/app/management/page.tsx`:
1. Add `import { ImageStats } from '@/components/image/ImageStats'` near the other image component imports (line 12–13 area).
2. Insert `<ImageStats images={images} />` just before the `<ImageGrid ... />` line (around line 345–350).

The exact insertion point (before the `ImageGrid` JSX, after the sort/filter section):

```tsx
{/* 图片统计 */}
<ImageStats images={images} />

{/* 图片列表 */}
<ImageGrid
  images={filteredImages}
  onDelete={handleDelete}
  onBulkDelete={handleBulkDelete}
  isLoading={isLoading}
/>
```

- [ ] **Step 3: TypeScript and lint check**

Run:
```bash
npx tsc --noEmit && npx eslint src/components/image/ImageStats.tsx src/app/management/page.tsx
```

Expected: 0 errors, 0 new warnings.

- [ ] **Step 4: Commit**

```bash
git add src/components/image/ImageStats.tsx src/app/management/page.tsx
git commit -m "feat(image): add image statistics overview cards on management page"
```

---

## Spec Self-Review

### 1. Spec Coverage

| Spec 要求 | 对应 Step |
|----------|-----------|
| 4 张统计卡片 | Step 1 |
| 总图片数 | Step 1 (`totalCount`) |
| 总大小（formatFileSize） | Step 1 (`totalSize`) |
| 主要格式 + 占比 | Step 1 (`dominantFormat`) |
| 最近上传（相对时间） | Step 1 (`lastUpload` with `formatDistanceToNow`) |
| 管理页顶部展示 | Step 2 (insert before ImageGrid) |
| images=0 不渲染 | Step 1 (`if (!stats) return null`) |
| 深色模式 | Step 1 (Card + text dark: classes) |
| 无 API/store 改动 | Step 1 (pure useMemo) |

No gaps.

### 2. Placeholder Scan

No "TBD", "TODO". All code is complete.

### 3. Type Consistency

- `ImageFile` — from `@/types/image`
- `formatFileSize(bytes: number): string` — matches `totalSize: number` input
- `formatDistanceToNow(date, { addSuffix, locale })` — `date-fns` v4 API matches usage
- `StatCardProps` — `icon: React.ReactNode`, `value: string`, `label: string`
- `useMemo` deps `[images]` — correct
- Grid: `grid-cols-2 lg:grid-cols-4` — responsive, matches design

All consistent.
