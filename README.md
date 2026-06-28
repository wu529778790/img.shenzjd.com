# ImgX

## 📖 项目简介

**ImgX** 是一个专为个人开发者、博主打造的现代化图床管理工具。使用 GitHub 作为存储后端，配合 CDN 加速，实现零成本的图片托管服务。

### ✨ 核心优势

- 🆓 **零成本**：Vercel 部署 + GitHub 存储 + jsDelivr CDN，完全免费
- 🎨 **现代化设计**：Soft UI Evolution 风格，20+ 流畅动画
- ⚡ **性能卓越**：骨架屏加载、虚拟列表、数据预加载
- 🛠️ **功能丰富**：图片压缩、水印添加、Base64 转换等工具箱
- 🔒 **隐私安全**：数据存储在您的 GitHub 仓库，完全掌控
- 📱 **响应式设计**：完美适配桌面、平板、手机

---

## ✨ 功能特性

### 🚀 核心功能

- 🔐 **GitHub OAuth 登录** - 安全认证
- ⚡ **一键配置图床** - 自动创建仓库，快速开始
- 📤 **拖拽上传** - 支持拖拽、粘贴、点击多种方式
- 🗜️ **自动压缩** - 可配置压缩质量
- 💧 **水印添加** - 自定义文字、颜色、位置
- 🔗 **链接生成** - Markdown / HTML / BBCode 格式
- 🌐 **CDN 加速** - jsDelivr / jsDMirror（国内推荐）

### 🛠️ 工具箱

- 🗜️ **图片压缩工具** - 独立压缩，前后对比
- 💧 **水印工具** - 实时预览水印效果
- 📊 **Base64 转换** - 快速转换图片编码

### 🎨 用户体验

- 📊 **图片管理** - 网格/列表视图、搜索筛选、批量操作
- 🌓 **主题切换** - 浅色/深色/跟随系统
- ⏳ **骨架屏加载** - 优雅的加载体验
- 🚀 **虚拟列表** - 500+ 图片流畅滚动
- ⏱️ **数据预加载** - 悬停预取，瞬间切换

---

## 📖 使用指南

### 首次使用流程

1. **登录** - 使用 GitHub 账号登录
2. **配置图床** - 一键自动创建仓库，或选择已有仓库
3. **上传图片** - 拖拽上传，自动压缩和水印处理
4. **管理图片** - 搜索、筛选、批量删除
5. **复制链接** - 一键复制 Markdown / HTML / BBCode 格式链接

### 工具箱

- **图片压缩**：压缩图片大小，支持质量调节
- **水印工具**：添加文字水印，实时预览
- **Base64 转换**：快速转换图片为 Base64 编码

### 设置选项

- 🌓 主题切换（浅色/深色/跟随系统）
- 🎚️ 默认压缩质量
- 💧 默认水印配置
- 🗑️ 清空配置或退出登录

---

## 🚢 部署

### 一键部署到 Vercel

[Deploy with Vercel](https://vercel.com/new/clone?repository-url=https://github.com/wu529778790/img.shenzjd.com)

### 手动部署

1. **推送代码到 GitHub**

```bash
git push origin main
```

1. **导入项目到 Vercel**

- 访问 [Vercel](https://vercel.com/new)
- 导入 GitHub 仓库
- 配置环境变量

2. **配置环境变量**

在 Vercel Dashboard → Settings → Environment Variables：

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

1. **更新 GitHub OAuth**

- **Homepage URL**: `https://your-project.vercel.app`
- **Authorization callback URL**: `https://your-project.vercel.app/api/auth/callback`
