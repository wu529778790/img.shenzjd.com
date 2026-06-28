# GitHub API 排序行为分析

## 问题

GitHub API 返回的文件列表是否已经是按提交时间排序的？

如果是这样，我们就不需要单独获取每个文件的提交时间了！

---

## GitHub Contents API（递归方式）

### API 请求
```http
GET /repos/{owner}/{repo}/contents/{path}
```

### 返回字段
```json
[
  {
    "name": "file.txt",
    "path": "file.txt",
    "sha": "abc123",
    "size": 123,
    "url": "...",
    "html_url": "...",
    "download_url": "...",
    "type": "file"
    ❌ 没有提交时间字段
  }
]
```

**Content API 的排序**：
- 默认按**文件路径字母顺序**排序
- ❌ 不是按提交时间排序

---

## Git Trees API（当前使用）

### API 请求
```http
GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
```

### 返回字段
```json
{
  "tree": [
    {
      "type": "blob",
      "path": "images/1.jpg",
      "mode": "100644",
      "sha": "abc123",
      "size": 12345
      ❌ 没有提交时间字段
    }
  ]
}
```

**Git Trees API 的排序**：
- 按**文件系统顺序**返回
- ❌ 不是按提交时间排序
- 顺序与 `git ls-tree` 命令相同

---

## GitHub Commits API（当前用于获取提交时间）

### API 请求
```http
GET /repos/{owner}/{repo}/commits?path={file_path}&per_page=1
```

### 返回字段
```json
[
  {
    "commit": {
      "committer": {
        "date": "2025-06-28T10:30:00Z"  ✅ 有提交时间
      }
    }
  }
]
```

---

## 结论

| API | 返回提交时间 | 默认排序 | 说明 |
|-----|------------|---------|------|
| Contents API | ❌ 否 | 按路径字母顺序 | 不包含时间信息 |
| Git Trees API | ❌ 否 | 按文件系统顺序 | 不包含时间信息 |
| Commits API | ✅ 是 | 按提交时间倒序 | 需要单独请求每个文件 |

### ❌ GitHub 不会在文件列表 API 中返回提交时间

**这意味着我们仍然需要获取提交时间**，除非：
1. 使用 Commits API（每个文件1次请求） ❌
2. 使用 GraphQL API（1次请求批量获取） ⚠️ 有技术限制
3. 去掉按时间排序功能 ✅ 最简单的方案

---

## 推荐方案

### 方案 A：去掉按时间排序（最简单）

**优点**：
- ✅ 只需 1 次请求（Git Trees API）
- ✅ 实现简单
- ✅ 性能最优

**缺点**：
- ❌ 失去按上传时间排序功能
- ✅ 但可以按**文件名**或**文件大小**排序

**实现**：
```typescript
// 删除获取提交时间的代码
// 只保留文件列表
const allFiles = await api.listAllFilesWithTree()
const imageFiles = allFiles.filter(/* 图片过滤 */)
// 不需要获取提交时间
return imageFiles
```

---

### 方案 B：降低并发 + 增加延迟（当前 REST API 方案）

**优点**：
- ✅ 保留时间排序功能

**缺点**：
- ❌ 仍然需要 N 次请求（每个文件1次）
- ⚠️ 加载时间较长

**优化后的参数**：
- 并发数：3（降低对 GitHub API 的压力）
- 批次延迟：1000ms（1秒，避免触发速率限制）

---

### 方案 C：使用文件名/路径作为排序依据（推荐）⭐

**思路**：
- 使用 Git Trees API 返回的文件路径或文件名排序
- 虽然不是真正的"上传时间"，但可以提供排序功能

**优点**：
- ✅ 只需 1 次请求
- ✅ 有排序功能
- ✅ 性能最优

**缺点**：
- ❌ 排序依据不是提交时间
- ✅ 但可以按字母顺序、路径深度等排序

**实现**：
```typescript
// 按文件路径排序（包含目录结构信息）
imageFiles.sort((a, b) => a.path.localeCompare(b.path))

// 或按文件名排序
imageFiles.sort((a, b) => a.name.localeCompare(b.name))

// 或按文件大小排序
imageFiles.sort((a, b) => a.size - b.size)
```

---

## 用户选择

请告诉我你希望采用哪个方案：

**A. 去掉时间排序** → 1次请求，最简单
**B. 保留时间排序** → N次请求（降低并发）
**C. 使用其他字段排序** → 1次请求，有排序功能

或者你有其他想法？
