# 使用教程

## 前言

### 为什么要使用图床？

写博客文章时，图片的上传和存放是一个常见问题。如果直接把图片放到博客仓库中使用相对路径引用，后期维护会非常麻烦。如果要在多个平台发布同一篇文章，每个平台都要重新上传图片。

**图床**就是为了解决这些问题：将图片统一上传到一个在线静态资源库中，获取图片 URL，使用 Markdown 引用，实现一次编写、到处使用。

### 为什么选择 GitHub 作为图床？

- ✅ **完全免费**：GitHub 提供免费的仓库存储
- ✅ **稳定可靠**：GitHub 基础设施，99.9% 在线时间
- ✅ **版本控制**：图片变更历史可追溯
- ✅ **易于管理**：通过 GitHub 界面管理所有图片

**限制说明：**
- 每个仓库大小限制：**1GB**
- 单个文件大小限制：**100MB**

### CDN 加速

GitHub 国内访问速度较慢，推荐使用 CDN 加速：

#### jsDelivr

- 国内访问速度较快
- 使用方式：`https://cdn.jsdelivr.net/gh/:user/:repo/:tag/:file`
- 限制：仓库总存储超过 50MB 会停止加速

**域名替换**（当 `cdn.jsdelivr.net` 被污染时）：
- `https://gcore.jsdelivr.net/gh/:user/:repo/:tag/:file`
- `https://fastly.jsdelivr.net/gh/:user/:repo/:tag/:file`
- `https://originfastly.jsdelivr.net/gh/:user/:repo/:tag/:file`
- `https://testingcf.jsdelivr.net/gh/:user/:repo/:tag/:file`

#### Statically

- 使用 Anycast CDN，中国大陆通常分配日本东京节点
- 国内访问速度不错，比 jsDelivr 稍快一些
- 使用方式：`https://cdn.statically.com/gh/:user/:repo/:tag/:file`
- ⚠️ 注意：`cdn.statically.io` 是海外域名，国内访问可能超时

**特点对比：**
- jsDelivr：主要用 CloudFlare，其次是 Fastly
- Statically：正好相反，主要用 Fastly

---

## 快速配置（PicGo + GitHub）

### 1. 创建 GitHub 仓库

1. 登录 GitHub
2. 创建一个新的仓库（如 `image`），用来存储图片
3. 可以设置为私有仓库，CDN 仍然可以访问

### 2. 安装 PicGo

推荐使用 PicGo 作为图片上传工具：

1. 下载 PicGo：<https://github.com/Molunerfinn/PicGo/releases>
2. 或使用 VS Code 插件：搜索安装 **vs-picgo**

### 3. 配置 GitHub

在 PicGo 设置中添加 GitHub 图床配置：

![配置示例](https://cdn.jsdelivr.net/gh/wu529778790/image@master/blog/20210606000138.png)

**配置项说明：**

| 配置项 | 说明 |
|--------|------|
| `owner` | GitHub 用户名 |
| `repo` | 图片仓库名 |
| `token` | GitHub Personal Access Token |
| `path` | 上传路径（如 `images/`） |
| `branch` | 分支名（通常为 `main` 或 `master`） |

### 4. 获取 GitHub Token

1. 访问 [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. 点击 **Generate new token**
3. 选择权限：
   - ✅ `repo` (Full control of private repositories)
4. 复制生成的 Token（只会显示一次）

### 5. 测试上传

配置完成后，拖拽一张图片到 PicGo，检查是否上传成功并获取 Markdown 格式的链接。

---

## 进阶配置

### 自定义域名

使用自己的域名配合 CDN 可以提升访问速度和稳定性。

### 自动化工作流

配合 CI/CD 可以实现：
- 图片自动压缩
- 自动生成缩略图
- 批量上传和同步

---

## 常见问题

### Q: jsDelivr 加速失效了怎么办？

A: 可能是仓库总存储超过 50MB 导致加速停止，可以：
1. 清理不用的图片
2. 使用 Statically CDN
3. 使用其他 CDN 服务

### Q: 上传后图片不显示？

A: 检查以下几点：
1. GitHub 仓库是否为公开（私有仓库 CDN 可能无法访问）
2. 图片链接是否正确
3. CDN 缓存是否已更新

### Q: 如何处理大文件？

A: GitHub 单文件限制 100MB，建议：
- 压缩图片后再上传
- 使用图片压缩工具减小体积
- 大文件考虑其他存储方案

---

## 参考资料

- [PicGo 官方文档](https://picgo.github.io/PicGo-Doc/zh/guide/config.html#github%E5%9B%BE%E5%BA%8A)
- [GitHub Personal Access Token 创建指南](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [jsDelivr 官网](https://www.jsdelivr.com/)
- [Statically 官网](https://statically.io/)
