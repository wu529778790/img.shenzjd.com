# ImgX - 基于 GitHub 的现代化图床服务

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3+-38BDF8.svg?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**简单、快速、专注于上传图片并生成 Markdown 链接**

[功能特性](#功能特性) • [快速开始](#快速开始) • [配置指南](#配置指南) • [部署](#部署) • [常见问题](#常见问题)

</div>

---

## 📖 项目简介

**ImgX** 是一个基于 GitHub 的现代化图床管理工具，专为个人开发者、博主打造。使用 GitHub 作为存储后端，配合 jsDelivr CDN，实现零成本的图片托管服务。

### 为什么选择 ImgX？

- ✅ **零成本**：Vercel 部署 + GitHub 存储 + jsDelivr CDN，完全免费
- ✅ **简单易用**：拖拽上传、自动压缩、一键复制 Markdown 链接
- ✅ **功能丰富**：图片压缩、水印添加、Base64 转换等工具箱
- ✅ **现代化界面**：深色/浅色主题、响应式设计、流畅交互
- ✅ **隐私安全**：数据存储在您的 GitHub 仓库，完全掌控

---

## ✨ 功能特性

### 🚀 核心功能

- **GitHub 登录**：支持 OAuth 和 Personal Access Token 两种认证方式
- **一键配置**：自动创建图床仓库，无需手动配置
- **拖拽上传**：支持拖拽、粘贴、点击选择多种上传方式
- **自动压缩**：上传时自动压缩图片，支持自定义质量
- **水印添加**：可配置文字、颜色、大小、位置
- **链接生成**：支持 Markdown、HTML、BBCode 格式
- **CDN 加速**：GitHub 原始链接 + jsDelivr CDN

### 🛠️ 工具箱

- **图片压缩**：独立压缩工具，支持质量调节、前后对比
- **水印工具**：独立水印工具，实时预览效果
- **Base64 转换**：快速转换图片为 Base64 编码

### 🎨 用户体验

- **图片管理**：网格/列表视图、搜索、批量删除
- **深色模式**：支持浅色、深色、跟随系统三种主题
- **响应式设计**：完美适配桌面、平板、手机
- **PWA 支持**：可安装到桌面，离线使用

---

## 🛠️ 技术栈

### 前端框架

- **[Next.js 14](https://nextjs.org/)** - React 全栈框架
- **[React 18](https://react.dev/)** - UI 库
- **[TypeScript 5](https://www.typescriptlang.org/)** - 类型安全
- **[Tailwind CSS 3](https://tailwindcss.com/)** - 原子化 CSS

### UI 组件

- **[shadcn/ui](https://ui.shadcn.com/)** - 高质量组件库
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast 通知
- **[Lucide React](https://lucide.dev/)** - 图标库

### 状态管理

- **[Zustand](https://github.com/pmndrs/zustand)** - 轻量状态管理
- **[TanStack Query](https://tanstack.com/query)** - 服务端状态管理

### 工具库

- **[browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)** - 图片压缩
- **[fabric](http://fabricjs.com/)** - Canvas 图片处理
- **[axios](https://axios-http.com/)** - HTTP 客户端
- **[react-dropzone](https://react-dropzone.js.org/)** - 拖拽上传

### 部署

- **[Vercel](https://vercel.com/)** - 前端托管
- **[GitHub](https://github.com/)** - 图片存储
- **[jsDelivr](https://www.jsdelivr.net/)** - CDN 加速

---

## 🚀 快速开始

### 环境要求

- **Node.js** 18+
- **GitHub 账号**
- **npm** 或 **yarn** 或 **pnpm**

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/imgx.git
cd imgx
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here

# 站点配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
```

### 4. 配置 GitHub OAuth App

前往 [GitHub Settings](https://github.com/settings/developers) → **New OAuth App**：

- **Application name**: ImgX
- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:3000/api/auth/callback`

创建完成后，将 `Client ID` 和 `Client Secret` 填入 `.env.local`

### 5. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，即可使用！

---

## 📖 使用指南

### 首次使用

1. **登录**
   - 点击"使用 GitHub 登录"，或
   - 使用 Personal Access Token 登录

2. **配置图床**
   - **一键配置**：自动创建仓库，快速开始
   - **手动配置**：选择已有仓库，自定义目录

3. **上传图片**
   - 拖拽图片到上传区域
   - 或点击选择文件
   - 自动压缩、添加水印（如已配置）
   - 生成 Markdown 链接，一键复制

4. **管理图片**
   - 查看所有已上传图片
   - 搜索、筛选、批量删除
   - 点击预览大图

5. **使用工具箱**
   - **压缩工具**：压缩图片大小
   - **水印工具**：添加文字水印
   - **Base64 转换**：图片转 Base64

### 配置说明

前往 **设置** 页面可以：

- 🌓 切换主题（浅色/深色/跟随系统）
- 🎚️ 调整默认压缩质量
- 💧 配置默认水印
- 🗑️ 清空配置或退出登录

---

## 🚢 部署

### 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/imgx)

### 手动部署

1. **推送代码到 GitHub**

```bash
git push origin main
```

2. **导入项目到 Vercel**

- 访问 [Vercel](https://vercel.com/new)
- 导入 GitHub 仓库
- 配置环境变量（参考步骤 3-4）

3. **配置环境变量**

在 Vercel Dashboard → Settings → Environment Variables：

```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
```

4. **更新 GitHub OAuth**

- **Homepage URL**: `https://your-project.vercel.app`
- **Authorization callback URL**: `https://your-project.vercel.app/api/auth/callback`

5. **部署完成！** 🎉

---

## 📁 项目结构

```
imgx/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # 认证相关
│   │   │   ├── repos/         # 仓库相关
│   │   │   └── images/        # 图片相关
│   │   ├── login/             # 登录页
│   │   ├── config/            # 配置页
│   │   ├── upload/            # 上传页
│   │   ├── management/        # 图片管理
│   │   ├── tools/             # 工具箱
│   │   ├── settings/          # 设置页
│   │   └── not-found/         # 404 页面
│   ├── components/            # React 组件
│   │   ├── ui/               # shadcn/ui 组件
│   │   ├── layout/           # 布局组件
│   │   ├── upload/           # 上传组件
│   │   └── image/            # 图片组件
│   ├── lib/                   # 工具库
│   │   ├── github.ts         # GitHub API
│   │   ├── compress.ts       # 图片压缩
│   │   ├── watermark.ts      # 水印处理
│   │   └── link.ts           # 链接生成
│   ├── stores/                # Zustand Stores
│   │   ├── authStore.ts      # 认证状态
│   │   ├── configStore.ts    # 配置状态
│   │   └── uploadStore.ts    # 上传状态
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useUpload.ts
│   │   ├── useImages.ts
│   │   └── useTheme.ts
│   └── types/                 # TypeScript 类型
├── public/                    # 静态资源
├── docs/                      # 文档
└── package.json
```

---

## 🔧 开发

### 脚本命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 运行测试
npm test
```

### 添加新组件

```bash
# 添加 shadcn/ui 组件
npx shadcn@latest add [component-name]
```

---

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### Commit 规范

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

---

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

---

## 🙏 致谢

本项目参考了以下优秀项目：

- **[PicX](https://github.com/topics/picx)** - 提供灵感和功能参考
- **[Next.js](https://nextjs.org/)** - 强大的 React 框架
- **[shadcn/ui](https://ui.shadcn.com/)** - 精美的组件库
- **[Tailwind CSS](https://tailwindcss.com/)** - 实用的 CSS 框架

---

## 📞 联系方式

- **项目主页**: https://github.com/你的用户名/imgx
- **问题反馈**: https://github.com/你的用户名/imgx/issues
- **文档**: [docs/](./docs)

---

<div align="center">

**如果觉得这个项目有用，请给一个 ⭐️ Star！**

Made with ❤️ by [Your Name](https://github.com/你的用户名)

</div>
