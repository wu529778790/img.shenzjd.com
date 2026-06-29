# 智能配置检测与同步功能

## 功能说明

系统现在支持**智能配置检测**和**配置时间戳对比**，确保用户始终使用最新的配置。

## 核心特性

### 1. 配置时间戳对比

系统会对比本地配置和远程配置的最后更新时间：

```typescript
// 获取远程配置的最后修改时间
const remoteUpdatedAt = getUpdatedAtFromGitHub(configFile)

// 对比本地和远程时间
if (hasLocalConfig && localLastSync && remoteUpdatedAt) {
  const localTime = new Date(localLastSync).getTime()
  const remoteTime = new Date(remoteUpdatedAt).getTime()

  // 如果本地配置更新，跳过远程配置
  if (localTime >= remoteTime) {
    return null // 使用本地配置
  }
}
```

**行为**：
- ✅ **本地配置更新** → 使用本地配置，跳过远程
- ✅ **远程配置更新** → 使用远程配置，自动同步
- ✅ **都没有** → 打开配置弹窗

### 2. 设置页面配置恢复

当从 GitHub 恢复配置时，设置页面会自动填充所有字段：

```typescript
// 从 configStore 恢复配置到本地状态
useEffect(() => {
  if (configStore.owner && configStore.repo) {
    setRepo(`${configStore.owner}/${configStore.repo}`)
  }
  if (configStore.branch) {
    setBranch(configStore.branch)
  }
  if (configStore.directory) {
    setDirectory(configStore.directory)
  }
}, [configStore])
```

**自动恢复的配置项**：
- ✅ 仓库（owner/repo）
- ✅ 分支（branch）
- ✅ 文件夹（directory）
- ✅ 压缩设置（compressionEnabled, compressionQuality）
- ✅ 水印设置（watermarkEnabled, watermarkText, watermarkColor, watermarkSize, watermarkPosition）
- ✅ CDN 设置（cdn）
- ✅ 链接格式（copyFormat, useRaw）
- ✅ 其他所有配置项

### 3. 智能提示

系统会根据配置来源显示不同的提示：

- 📥 **"配置已同步"** → 远程配置更新，已同步到本地
- ♻️ **"已恢复配置"** → 首次从 GitHub 恢复配置
- ✅ **"配置已保存"** → 本地配置保存到 GitHub

## 工作流程

### 场景 1：首次登录

```
用户登录
  ↓
本地无配置
  ↓
检测 GitHub 配置文件
  ↓
找到 config.json？→ 是 → 解析配置 → 恢复所有配置项 ✅
  ↓ 否
打开配置弹窗
```

### 场景 2：本地配置 vs 远程配置

```
本地有配置（lastSyncAt: 2024-01-01）
  ↓
检测远程 config.json（updatedAt: 2024-01-02）
  ↓
对比时间戳
  ↓
远程更新？→ 是 → 使用远程配置 → 提示"配置已同步" 🔄
  ↓ 否
使用本地配置 → 跳过
```

### 场景 3：设置页面显示

```
配置恢复
  ↓
configStore 更新
  ↓
useEffect 触发
  ↓
更新本地状态（repo, branch, directory）
  ↓
设置页面显示最新配置 ✅
```

## 技术实现

### 1. 获取文件更新时间

GitHub API 返回的文件信息包含 commit 数据：

```typescript
// GitHub API 响应结构
{
  "sha": "...",
  "content": "...",
  "commit": {
    "commit": {
      "committer": {
        "date": "2024-01-02T10:30:00Z" // 最后修改时间
      }
    }
  }
}
```

提取函数：

```typescript
function getUpdatedAtFromGitHub(file: any): string | null {
  if (file.commit?.commit?.committer?.date) {
    return file.commit.commit.committer.date
  }
  return null
}
```

### 2. 时间戳对比逻辑

```typescript
// 只有当远程配置确实更新时才覆盖本地
if (localTime < remoteTime) {
  // 远程配置更新，使用远程
  return remoteConfig
} else {
  // 本地配置最新，跳过远程
  return null
}
```

### 3. 设置页面状态恢复

```typescript
useEffect(() => {
  // 当 configStore 变化时，更新本地状态
  if (configStore.owner && configStore.repo) {
    setRepo(`${configStore.owner}/${configStore.repo}`)
  }
  // ... 其他字段
}, [configStore])
```

## 优势

### ✅ 配置不丢失
- 远程配置更新后，登录时自动同步
- 不会因为本地配置旧而使用过时设置

### ✅ 双向同步保护
- 本地修改后保存到 GitHub，lastSyncAt 更新
- 下次检测时，本地配置优先

### ✅ 用户体验优化
- 自动提示配置同步状态
- 设置页面实时显示最新配置
- 无需手动刷新或重新登录

### ✅ 完整配置恢复
- 不仅仅是 owner/repo/branch
- 所有配置项都能恢复
- 设置页面完整显示

## 修改的文件

1. **src/hooks/useDetectExistingConfig.ts** - 新增时间戳对比逻辑
2. **src/app/management/page.tsx** - 优化配置恢复提示
3. **src/app/page.tsx** - 优化配置恢复提示
4. **src/app/settings/page.tsx** - 添加配置恢复状态同步

## 注意事项

- 时间戳对比依赖 GitHub API 返回的 commit 时间
- 如果 GitHub API 请求失败，会跳过时间对比，直接使用检测到的配置
- 设置页面的仓库选择器显示格式为 `owner/repo`
