# 修复配置弹窗关闭后显示"暂无图片"的问题

## 问题描述

当用户已登录但未配置图床时，进入图片管理页面会：
1. ✅ 自动打开配置弹窗
2. ✅ 显示骨架屏

但当用户关闭配置弹窗后：
- ❌ 骨架屏消失
- ❌ 显示"暂无图片"空状态（这是误导性的，因为用户还没配置，不是真的没有图片）

## 解决方案

### 1. 新增 `isConfigDismissed` 状态

在 `ConfigDialogProvider` 中新增一个状态来追踪用户是否关闭过配置弹窗：

```typescript
const [isConfigDismissed, setIsConfigDismissed] = useState(false)
```

**状态转换逻辑**：
- 打开弹窗时：`isConfigDismissed = false`（重置）
- 用户关闭弹窗时：`isConfigDismissed = true`（标记已关闭）
- 配置完成时：`isConfigured = true`，不再受此状态影响

### 2. 修改骨架屏显示条件

**图片管理页面** (`src/app/management/page.tsx`):

```typescript
// 修改前
if (status === 'loading' || !session || !isConfigured) {
  return <ManagementSkeleton />
}

// 修改后
if (status === 'loading' || !session || !isConfigured || isConfigDismissed) {
  return <ManagementSkeleton />
}
```

**首页** (`src/app/page.tsx`):
- 更新 `useEffect` 依赖，添加 `isConfigDismissed`
- 避免在用户关闭弹窗后重复打开

### 3. 自动打开弹窗的逻辑优化

```typescript
// 修改前
useEffect(() => {
  if (status === 'authenticated' && !isConfigured) {
    openConfigDialog()
  }
}, [status, isConfigured, openConfigDialog])

// 修改后
useEffect(() => {
  if (status === 'authenticated' && !isConfigured && !isConfigDismissed) {
    openConfigDialog()
  }
}, [status, isConfigured, isConfigDismissed, openConfigDialog])
```

## 修复后的用户体验

### 场景：已登录但未配置

1. 用户进入图片管理页面
   - ✅ 显示骨架屏
   - ✅ 自动打开配置弹窗

2. 用户关闭配置弹窗（未完成配置）
   - ✅ **继续显示骨架屏**（修复了！）
   - ❌ 不再显示"暂无图片"

3. 用户在骨架屏页面点击"去配置"按钮
   - ✅ 重新打开配置弹窗

4. 用户完成配置
   - ✅ 配置弹窗关闭
   - ✅ 骨架屏消失
   - ✅ 显示正常的图片管理页面

## 修改的文件

1. `src/components/auth/ConfigDialogProvider.tsx` - 新增 `isConfigDismissed` 状态管理
2. `src/app/management/page.tsx` - 更新骨架屏显示条件和弹窗自动打开逻辑
3. `src/app/page.tsx` - 更新弹窗自动打开逻辑（保持一致性）
