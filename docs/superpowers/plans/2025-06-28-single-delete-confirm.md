# 单张删除确认弹窗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace native `confirm()` in ImageCard single delete with shadcn/ui Dialog matching the bulk delete dialog style

**Architecture:** Add Dialog state and JSX to ImageCard, remove browser confirm, keep deletion logic unchanged

**Tech Stack:** React, TypeScript, shadcn/ui Dialog, lucide-react, Framer Motion

## Global Constraints

- Follow existing component patterns in `ImageCard.tsx` and `ImageGrid.tsx`
- Dialog style must match bulk delete dialog in `ImageGrid.tsx:331-381`
- No changes to API layer (`/api/images/[sha]/route.ts`)
- No changes to mutation logic — deletion fetch/API call is preserved, only moved from `handleDelete` into the Dialog confirm button's `onClick`
- Dark mode colors must be correct

---

## File Structure

```
src/components/image/ImageCard.tsx    — MODIFY (add Dialog state + JSX)
src/components/ui/dialog.tsx          — READ ONLY (already exists)
src/lib/utils.ts                      — READ ONLY (formatFileSize already imported)
```

### Existing imports to leverage

- `AlertTriangle` — `lucide-react` (already used in ImageGrid bulk dialog)
- `Dialog` family — `@/components/ui/dialog` (same as ImageGrid)
- `Trash2` — `lucide-react` (already in ImageCard imports)
- `formatFileSize` — `@/lib/utils` (already in ImageCard imports)
- `Button` — `@/components/ui/button` (already in ImageCard imports)

---

### Task 1: Replace confirm() with Dialog in ImageCard

**Files:**
- Modify: `src/components/image/ImageCard.tsx`

**Interfaces:**
- Consumes: Existing `image` prop (`ImageFile`), `onDelete` callback
- Produces: `handleDelete` now triggered via Dialog confirm button

- [ ] **Step 1: Add Dialog import and state**

At the top of the file, confirm `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle` are imported from `@/components/ui/dialog`. Add `AlertTriangle` to lucide-react import.

Add state below existing `showPreview` state:

```tsx
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
```

- [ ] **Step 2: Replace confirm() with setShowDeleteConfirm(true)**

In `handleDelete`, remove the `confirm()` check and replace it with `setShowDeleteConfirm(true)`:

```tsx
const handleDelete = async () => {
  if (!token || !onDelete) return
  setShowDeleteConfirm(true)
}
```

- [ ] **Step 3: Add the confirmDialog JSX before the ImagePreview closing tag**

Insert before `{showPreview && <ImagePreview ... />}`:

```tsx
{/* 单张删除确认弹窗 */}
<Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <DialogTitle className="text-lg">确认删除</DialogTitle>
          <DialogDescription className="mt-1">
            此操作无法撤销，删除后链接将失效
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>

    {/* 文件信息预览 */}
    <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="truncate font-mono text-gray-600 dark:text-gray-400">{image.name}</span>
        <span className="text-gray-400 text-xs">{formatFileSize(image.size)}</span>
      </div>
    </div>

    <DialogFooter className="mt-4">
      <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
        取消
      </Button>
      <Button
        variant="destructive"
        onClick={async () => {
          setShowDeleteConfirm(false)
          // 原有删除逻辑
          if (!token || !onDelete) return
          try {
            const response = await fetch(`/api/images/${image.sha}`, {
              method: 'DELETE',
              headers: {
                Authorization: `token ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                owner: configStore.owner,
                repo: configStore.repo,
              }),
            })
            if (!response.ok) throw new Error('Delete failed')
            toast.success('删除成功')
            onDelete(image.id)
          } catch (error) {
            toast.error('删除失败')
            console.error('Delete error:', error)
          }
        }}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        确认删除
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 4: Verify no confirm() remains**

Run a grep check:

```bash
grep -n "confirm(" src/components/image/ImageCard.tsx
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/image/ImageCard.tsx
git commit -m "feat(image): replace native confirm() with Dialog for single delete"
```

---

## Spec Self-Review

### 1. Spec Coverage

| Spec 要求 | 对应 Task |
|----------|-----------|
| 替换 `confirm()` → Dialog | Task 1 Step 2-3 |
| 显示文件名 + 文件大小 | Task 1 Step 3 |
| 显示风险提示"此操作无法撤销，删除后链接将失效" | Task 1 Step 3 |
| 取消按钮关闭弹窗 | Task 1 Step 3 |
| 确认按钮执行删除 | Task 1 Step 3 |
| 与批量删除弹窗风格一致 | Task 1 Step 3（直接复用相同结构） |
| 深色模式正确 | Task 1 Step 3（`dark:` 类名已配置） |

No gaps.

### 2. Placeholder Scan

No "TBD", "TODO", "TBD" placeholders found. All code is complete.

### 3. Type Consistency

- `showDeleteConfirm: boolean` — consistent with `showPreview: boolean` pattern already in file
- `image.name`, `image.size`, `image.sha`, `image.id` — all from `ImageFile` type
- `onDelete(image.id)` — matches callback signature `(id: string) => void`
- `configStore.owner`, `configStore.repo` — already used in existing `handleDelete`

All consistent.
