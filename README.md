# 🚀 ImgX

> **基于 GitHub 的现代化图床管理工具** — 拖拽上传，自动压缩，CDN 加速。

👉 立即体验：[**img.shenzjd.com**](https://img.shenzjd.com/)

---

## ✨ 功能特性

- 🖼️ **拖拽上传** — 支持拖拽、点击、粘贴多种方式
- 🗜️ **自动压缩** — 智能压缩图片，节省存储空间
- 🔄 **WebP 转换** — 上传时自动转为 WebP 格式，体积更小
- 🎨 **水印保护** — 自定义文字水印，保护原创内容
- 🌐 **多 CDN 加速** — GitHub Raw / jsDelivr / jsDMirror / GitHub Pages
- 🔗 **多格式复制** — Markdown / HTML / BBCode / 纯链接一键复制
- 📁 **图片管理** — 在线浏览、搜索、删除已上传图片
- 🌓 **深色模式** — 自动跟随系统，护眼舒适

---

## 🚀 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwu529778790%2Fimg.shenzjd.com&env=GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,NEXTAUTH_SECRET,NEXTAUTH_URL&envDescription=GitHub%20OAuth%20%E5%92%8C%20NextAuth%20%E9%85%8D%E7%BD%AE&envLink=https%3A%2F%2Fgithub.com%2Fwu529778790%2Fimg.shenzjd.com%23-%25E5%BF%25AB%E9%80%259F%E5%BC%80%E5%A7%258B)

---

## 📖 使用指南

### 什么是图床？

写博客文章时，图片的上传和存放是一个常见问题。如果直接把图片放到博客仓库中使用相对路径引用，后期维护会非常麻烦。如果要在多个平台发布同一篇文章，每个平台都要重新上传图片。

**图床**就是为了解决这些问题：将图片统一上传到一个在线静态资源库中，获取图片 URL，使用 Markdown 引用，实现一次编写、到处使用。

### 为什么选择 GitHub 作为图床？

- ✅ **完全免费** — GitHub 提供免费的仓库存储
- ✅ **稳定可靠** — GitHub 基础设施，99.9% 在线时间
- ✅ **版本控制** — 图片变更历史可追溯
- ✅ **易于管理** — 通过 Web 界面管理所有图片

---

## 方式一：网页上传

直接访问 [img.shenzjd.com](https://img.shenzjd.com/) 使用：

1. **登录** — 使用 GitHub 账号 OAuth 登录，系统自动创建并配置仓库
2. **上传图片** — 拖拽或选择图片，自动压缩、转 WebP、加水印
3. **复制链接** — 上传完成后一键复制 Markdown / HTML / BBCode / 纯链接

---

## 方式二：VSCode 插件上传（PicGo）

推荐在写 Markdown 时使用 PicGo 插件，截图后直接粘贴上传。

### 1. 安装 PicGo

- **桌面版**：[PicGo 下载地址](https://github.com/Molunerfinn/PicGo/releases)
- **VS Code 插件**：在扩展中搜索安装 **vs-picgo**

### 2. 获取 GitHub Token

1. 访问 [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. 点击 **Generate new token**
3. 选择权限：✅ `repo` (Full control of private repositories)
4. 复制生成的 Token（只会显示一次）

### 3. 配置 PicGo

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

### 4. 测试上传

配置完成后，拖拽一张图片到 PicGo，检查是否上传成功并获取 Markdown 格式的链接。

---

## CDN 加速

GitHub 国内访问速度较慢，ImgX 内置多种 CDN 加速：

| CDN | 地址格式 | 说明 |
|-----|---------|------|
| GitHub Raw | `raw.githubusercontent.com/...` | 原始链接，支持动态 WebP 转换 |
| jsDelivr | `cdn.jsdelivr.net/gh/...` | 全球加速，仓库超 50MB 停止 |
| jsDMirror | `cdn.jsdmirror.com/gh/...` | 国内推荐，默认选项 |
| GitHub Pages | `{user}.github.io/{repo}/...` | 自定义域名友好 |

### jsDelivr 域名替换

当 `cdn.jsdelivr.net` 被污染时，可替换为：
- `gcore.jsdelivr.net`
- `fastly.jsdelivr.net`
- `originfastly.jsdelivr.net`
- `testingcf.jsdelivr.net`

---
