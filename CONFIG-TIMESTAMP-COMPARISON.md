# ⏰ 配置时间戳对比逻辑

## 问题背景 ❌

**用户反馈：** "我本地的配置的更新时间没有 GitHub 的新，是不是就用 GitHub 的覆盖我本地的配置？是不是对比的时间？"

### 原来的问题

**原逻辑：** ConfigDiscovery 从 GitHub 加载配置后，**无条件覆盖本地配置**

```typescript
// ❌ 问题代码
configStore.updateConfig({
  // ... GitHub 配置
  lastSyncAt: config.lastSyncAt,
})
```

**问题场景：**
```
1. 本地配置：压缩质量 90%（lastSyncAt: 10:00）
2. 修改 GitHub 配置：压缩质量 80%（lastSyncAt: 09:00）
3. 刷新页面 → ConfigDiscovery 从 GitHub 加载配置
4. ❌ GitHub 的 80% 覆盖本地的 90%
5. 用户未同步的修改丢失！
```

---

## 解决方案 ✅

### 核心逻辑

**对比 `lastSyncAt` 时间戳，决定是否覆盖本地配置**

```typescript
// ✅ 新增逻辑
const localLastSyncAt = configStore.lastSyncAt
const remoteLastSyncAt = config.lastSyncAt

const shouldUpdateLocal = (() => {
  // 本地未配置 → 使用 GitHub 配置
  if (!configStore.owner) return true

  // 本地没有同步时间 → 可能是旧版本 → 使用 GitHub 配置
  if (!localLastSyncAt) return true

  // GitHub 配置没有同步时间 → 可能是旧版本 → 使用 GitHub 配置
  if (!remoteLastSyncAt) return true

  // 对比时间戳：GitHub 配置更新 → 覆盖本地
  const localTime = new Date(localLastSyncAt).getTime()
  const remoteTime = new Date(remoteLastSyncAt).getTime()
  return remoteTime > localTime
})()
```

---

## 决策流程图

```
ConfigDiscovery 从 GitHub 加载配置
  ↓
对比时间戳
  ↓
┌─────────────────────────────────────┐
│ 本地未配置 owner?                   │
└─────────────────────────────────────┘
  ↓ 是
┌─────────────────────────────────────┐
│ ✅ 使用 GitHub 配置                 │
└─────────────────────────────────────┘
  ↓ 否
┌─────────────────────────────────────┐
│ 本地 lastSyncAt 为空?               │
└─────────────────────────────────────┘
  ↓ 是
┌─────────────────────────────────────┐
│ ✅ 使用 GitHub 配置（旧版本数据）   │
└─────────────────────────────────────┘
  ↓ 否
┌─────────────────────────────────────┐
│ GitHub lastSyncAt 为空?             │
└─────────────────────────────────────┘
  ↓ 是
┌─────────────────────────────────────┐
│ ✅ 使用 GitHub 配置（旧版本数据）   │
└─────────────────────────────────────┘
  ↓ 否
┌─────────────────────────────────────┐
│ 对比时间戳                          │
│ remoteTime > localTime?             │
└─────────────────────────────────────┘
  ↓ 是（GitHub 更新）
┌─────────────────────────────────────┐
│ ✅ 使用 GitHub 配置                 │
└─────────────────────────────────────┘
  ↓ 否（本地更新）
┌─────────────────────────────────────┐
│ ✅ 保留本地配置                     │
│ ⚠️ 提示用户同步到 GitHub            │
└─────────────────────────────────────┘
```

---

## 场景分析

### 场景 1：本地配置更新（GitHub 配置较旧）

```
本地配置：
  - 压缩质量: 90%
  - lastSyncAt: 2024-01-01 10:00:00

GitHub 配置：
  - 压缩质量: 80%
  - lastSyncAt: 2024-01-01 09:00:00

刷新页面后：
  ✅ 保留本地配置（90%）
  ⚠️ 提示：本地配置已更新，请同步到 GitHub
```

**结果：** ✅ 用户的修改不会丢失！

---

### 场景 2：GitHub 配置更新（本地配置较旧）

```
本地配置：
  - 压缩质量: 80%
  - lastSyncAt: 2024-01-01 09:00:00

GitHub 配置：
  - 压缩质量: 90%
  - lastSyncAt: 2024-01-01 10:00:00

刷新页面后：
  ✅ 使用 GitHub 配置（90%）
  ✅ Toast：已发现并加载配置
```

**结果：** ✅ 本地配置自动更新到最新！

---

### 场景 3：首次配置（本地无配置）

```
本地配置：
  - owner: ''（空）

GitHub 配置：
  - owner: 'username'
  - repo: 'img.shenzjd.com'
  - lastSyncAt: 2024-01-01 10:00:00

刷新页面后：
  ✅ 使用 GitHub 配置
  ✅ Toast：已发现并加载配置
```

**结果：** ✅ 自动发现并加载配置！

---

### 场景 4：旧版本数据（无 lastSyncAt）

```
本地配置：
  - owner: 'username'
  - lastSyncAt: undefined（旧版本没有此字段）

GitHub 配置：
  - owner: 'username'
  - lastSyncAt: undefined（旧版本没有此字段）

刷新页面后：
  ✅ 使用 GitHub 配置（兼容旧版本）
  ✅ Toast：已发现并加载配置
```

**结果：** ✅ 向后兼容旧版本数据！

---

### 场景 5：同时修改本地和 GitHub（冲突解决）

```
本地配置：
  - 压缩质量: 90%
  - lastSyncAt: 2024-01-01 10:00:00

GitHub 配置：
  - 压缩质量: 80%
  - lastSyncAt: 2024-01-01 10:00:01（GitHub 更新晚 1 秒）

刷新页面后：
  ✅ 使用 GitHub 配置（80%）
  ✅ Toast：已发现并加载配置
```

**结果：** ✅ 以时间戳最新的配置为准（GitHub 配置晚 1 秒，胜出）

---

## 特殊处理

### 保留本地配置时的额外逻辑

当本地配置更新时，除了保留配置，还会**同步基础信息**：

```typescript
} else {
  // 本地配置更新，保留本地配置
  // 但确保 owner/repo/branch 等基础信息与 GitHub 一致
  configStore.updateConfig({
    owner: username,              // ✅ 确保 owner 正确
    repo: repoName,              // ✅ 确保 repo 正确
    branch: config.branch || configStore.branch || 'main',  // ✅ 确保 branch 正确
    sha: config.sha,             // ✅ 更新 SHA 供下次同步使用
  })

  toast.info('本地配置已更新，请同步到 GitHub')
}
```

**原因：** 即使保留本地配置，也需要确保 `owner`/`repo`/`branch` 等基础信息正确，因为这些不应该被本地修改。

---

## 代码对比

### 修改前 ❌

```typescript
// 直接覆盖本地配置
configStore.updateConfig({
  owner: username,
  repo: repoName,
  branch: config.branch || 'main',
  // ... 所有配置
  lastSyncAt: config.lastSyncAt,
  sha: config.sha,
})

toast.success(`已发现并加载配置: ${username}/${repoName}`)
```

**问题：**
- ❌ 无条件覆盖本地配置
- ❌ 未同步的修改会丢失
- ❌ 没有对比逻辑

---

### 修改后 ✅

```typescript
// 对比时间戳
const localLastSyncAt = configStore.lastSyncAt
const remoteLastSyncAt = config.lastSyncAt

const shouldUpdateLocal = (() => {
  if (!configStore.owner) return true
  if (!localLastSyncAt) return true
  if (!remoteLastSyncAt) return true
  const localTime = new Date(localLastSyncAt).getTime()
  const remoteTime = new Date(remoteLastSyncAt).getTime()
  return remoteTime > localTime
})()

if (shouldUpdateLocal) {
  // GitHub 配置更新 → 覆盖本地
  configStore.updateConfig({ /* ... */ })
  toast.success(`已发现并加载配置: ${username}/${repoName}`)
} else {
  // 本地配置更新 → 保留本地，同步基础信息
  configStore.updateConfig({
    owner: username,
    repo: repoName,
    branch: config.branch || configStore.branch || 'main',
    sha: config.sha,
  })
  toast.info('本地配置已更新，请同步到 GitHub')
}
```

**优势：**
- ✅ 对比时间戳，智能决策
- ✅ 保护本地未同步的修改
- ✅ 向后兼容旧版本数据
- ✅ 用户友好的 Toast 提示

---

## 测试场景

### ✅ 测试 1：本地配置更新

**步骤：**
1. 本地配置：压缩质量 90%，同步到 GitHub
2. 本地修改：压缩质量 80%，未同步
3. 刷新页面

**预期：**
- ✅ 保留本地配置（80%）
- ⚠️ 显示 Toast：本地配置已更新，请同步到 GitHub

---

### ✅ 测试 2：GitHub 配置更新

**步骤：**
1. 本地配置：压缩质量 90%，同步到 GitHub
2. 在 GitHub 手动修改：压缩质量 80%，同步
3. 刷新页面

**预期：**
- ✅ 使用 GitHub 配置（80%）
- ✅ 显示 Toast：已发现并加载配置

---

### ✅ 测试 3：首次配置

**步骤：**
1. 清空本地配置
2. 刷新页面

**预期：**
- ✅ 自动从 GitHub 加载配置
- ✅ 显示 Toast：已发现并加载配置

---

### ✅ 测试 4：冲突场景

**步骤：**
1. 本地配置：压缩质量 90%（10:00 同步）
2. GitHub 配置：压缩质量 80%（10:01 同步）
3. 刷新页面

**预期：**
- ✅ 使用 GitHub 配置（80%，时间戳更新）
- ✅ 显示 Toast：已发现并加载配置

---

## 技术细节

### 时间戳对比

```typescript
const localTime = new Date(localLastSyncAt).getTime()
const remoteTime = new Date(remoteLastSyncAt).getTime()
return remoteTime > localTime
```

**说明：**
- 使用 `getTime()` 转换为毫秒时间戳
- 比较 `remoteTime > localTime` → GitHub 配置更新
- 如果时间戳相同或本地更新 → 保留本地配置

---

### 向后兼容

**旧版本数据（无 lastSyncAt）：**

```typescript
// 本地没有同步时间 → 可能是旧版本数据 → 使用 GitHub 配置
if (!localLastSyncAt) return true

// GitHub 配置没有同步时间 → 可能是旧版本数据 → 使用 GitHub 配置
if (!remoteLastSyncAt) return true
```

**说明：**
- 如果任一方缺少 `lastSyncAt`，视为旧版本数据
- 默认使用 GitHub 配置
- 确保旧版本用户升级后能正常工作

---

## 优势总结

### ✅ 数据安全
- **保护本地未同步的修改**，不会因刷新页面而丢失
- **智能对比时间戳**，以最新配置为准

### ✅ 用户体验
- **友好的 Toast 提示**，告知用户发生了什么
- **自动同步 GitHub 配置**，无需手动刷新
- **向后兼容**，旧版本数据也能正常工作

### ✅ 冲突解决
- **明确的时间戳对比逻辑**，避免歧义
- **优先保留最新修改**，减少数据丢失风险

---

## 验证结果

```
✓ Compiled successfully in 2.1s
✓ Generating static pages using 9 workers (15/15) in 161ms
✓ Build completed successfully
```

---

## 总结

✨ **实现了智能的配置对比逻辑，基于 `lastSyncAt` 时间戳决定是否覆盖本地配置**

- ✅ **时间戳对比**：GitHub 配置更新 → 覆盖本地
- ✅ **保护本地修改**：本地配置更新 → 保留本地
- ✅ **向后兼容**：支持无时间戳的旧版本数据
- ✅ **用户友好**：Toast 提示当前状态
- ✅ **构建通过**：TypeScript 无错误

🎉 **现在刷新页面不会丢失本地未同步的修改了！**
