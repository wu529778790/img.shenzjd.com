# 验证优化效果

## 测试步骤

### 准备工作
1. 确保开发服务器正在运行：`npm run dev`
2. 打开浏览器访问：http://localhost:3000
3. 登录并配置好 GitHub 仓库

### 测试方法

#### 1. 使用浏览器开发者工具

##### Chrome/Edge
1. 按 `F12` 或 `Ctrl+Shift+I` (Mac: `Cmd+Opt+I`)
2. 切换到 **Network**（网络）标签页
3. 勾选 **Preserve log**（保留日志）
4. 刷新页面（F5）
5. 观察请求列表

##### Firefox
1. 按 `F12` 或 `Ctrl+Shift+K`
2. 切换到 **网络** 标签页
3. 勾选 **持久化日志**
4. 刷新页面

#### 2. 识别关键请求

在 Network 标签页中筛选：
- **Filter by XHR/Fetch**：查看 API 请求
- **Filter by Img**：查看图片资源请求

#### 3. 统计请求数量

**预期结果（优化后）**：
- ✅ 首次加载：
  - 1次：`GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
  - N次：`GET /repos/{owner}/{repo}/commits?path={file_path}`（图片文件数）
  - **总计：图片数 + 1**

- ✅ 5分钟内刷新：
  - 1次：`GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
  - **总计：1次**（提交时间从缓存读取）

- ❌ 优化前（对比）：
  - 文件夹数 + 1 次：`GET /repos/{owner}/{repo}/contents/{path}`
  - 图片数 次：`GET /repos/{owner}/{repo}/commits?path={file_path}`
  - **总计：图片数 + 文件夹数 + 1**

#### 4. 实际对比示例

**场景**：50张图片，5层文件夹结构

| 指标 | 优化前 | 优化后（首次） | 优化后（缓存） |
|------|--------|--------------|--------------|
| 文件列表请求 | 6次（5层文件夹） | 1次 | 1次 |
| 提交时间请求 | 50次 | 50次 | 0次 |
| **总计** | **56次** | **51次** | **1次** |
| 加载时间 | ~30-60s | ~20-40s | ~1-2s |

---

## 优化验证检查清单

### ✅ Git Trees API 使用
- [ ] Network 中可以看到 `git/trees` 请求
- [ ] 只出现 **1次** `git/trees` 请求（无论文件夹多少层）
- [ ] 没有看到多个 `contents` API 请求（除了删除/预览等操作）

### ✅ 缓存机制生效
- [ ] 首次加载后，刷新页面
- [ ] 提交时间请求数明显减少
- [ ] 在 Network 中没有看到 `commits` 请求（或只有少量）

### ✅ 功能完整性
- [ ] 图片列表正常显示
- [ ] 图片缩略图正常加载
- [ ] 图片信息（名称、大小）正确显示
- [ ] 排序功能正常
- [ ] 搜索功能正常
- [ ] 删除功能正常
- [ ] 复制链接功能正常

### ✅ 性能提升
- [ ] 页面加载速度明显提升
- [ ] 无卡顿、无长时间等待
- [ ] GitHub API 速率限制警告减少

---

## 性能监控

### 使用 Performance API 测试

在浏览器控制台运行以下代码：

```javascript
// 开始监控
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`)
  }
})
observer.observe({ entryTypes: ['measure'] })

// 在页面加载完成后执行
performance.mark('imagesLoaded')
// ... 等待图片加载完成
performance.measure('Image Load Time', 'imagesLoaded')
```

### 使用 React Query DevTools

如果安装了 React Query DevTools：
1. 在页面右下角可以看到 Query 状态
2. 查看 `images` query 的 `status` 和 `fetchStatus`
3. 确认数据缓存状态

---

## 常见问题排查

### 问题 1：Git Trees API 请求失败

**可能原因**：
- GitHub 仓库为空
- 分支不存在
- API 权限不足

**排查方法**：
1. 查看 Console 中的错误日志
2. 确认是否回退到递归方式（可以看到 `contents` 请求）

**预期行为**：
- 自动回退到原来的递归方式
- 在 Console 看到警告：`Falling back to recursive listContents`

### 问题 2：缓存未生效

**可能原因**：
- 缓存时间已过期（5分钟）
- 页面刷新导致内存缓存清空

**解决方案**：
- 正常现象，等待代码优化（可考虑 localStorage 持久化缓存）

### 问题 3：提交时间显示为空

**可能原因**：
- GitHub API 速率限制
- 文件未提交到 Git

**排查方法**：
- 查看 Console 中的警告
- 检查 GitHub 仓库是否有提交记录

---

## 下一步优化方向

如果当前优化效果满足预期，可以考虑：

1. **持久化缓存**（IndexedDB / localStorage）
   - 跨会话缓存
   - 彻底消除提交时间请求

2. **Web Worker 处理**
   - 大量文件时，使用 Web Worker 处理数据
   - 避免阻塞主线程

3. **虚拟滚动**
   - 数千张图片时的性能优化
   - 仅渲染可视区域图片

4. **增量更新**
   - 仅请求修改时间戳
   - 智能判断是否需要刷新
