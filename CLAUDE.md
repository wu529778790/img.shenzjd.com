# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ImgX** 是一个基于 Next.js 16 + React 19 的现代化图床管理工具，使用 GitHub 作为存储后端，提供拖拽上传、自动压缩、水印添加、CDN 加速等功能。

- **框架**: Next.js 16 (App Router) + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS 4 + shadcn/ui
- **状态管理**: Zustand + React Query (TanStack Query)
- **认证**: NextAuth.js (GitHub OAuth)
- **部署**: Vercel (推荐)

## Development Commands

```bash
# 开发环境
npm run dev              # 启动开发服务器 (http://localhost:3000)

# 构建
npm run build            # 生产构建
npm run start            # 启动生产服务器

# 代码质量
npm run lint             # ESLint 检查
npm run lint:fix         # ESLint 自动修复

# 测试
npm test                 # 运行所有测试 (vitest)
npm run test:ui          # 测试 UI 界面
npm run test:coverage    # 测试覆盖率报告
```

### 环境配置

```bash
# 复制环境变量模板
cp .env.example .env.local

# 必需的环境变量
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
NEXTAUTH_SECRET=<SECRET_d1b96e55>cl_rand_-base64_32
NEXTAUTH_URL=http://localhost:3000
```

## Architecture Overview

### 目录结构

```
src/
├── app/                      # Next.js App Router 页面
│   ├── api/                  # API 路由
│   │   ├── auth/            # NextAuth 认证
│   │   ├── images/          # 图片操作 API
│   │   └── repos/           # 仓库管理 API
│   ├── management/          # 图片管理页面
│   ├── settings/            # 设置页面
│   ├── tools/               # 工具箱页面
│   │   ├── base64/         # Base64 转换
│   │   └── watermark/      # 水印工具
│   ├── login/               # 登录页面
│   └── layout.tsx           # 根布局
│
├── components/              # React 组件
│   ├── animations/          # 动画组件
│   ├── auth/                # 认证相关组件
│   ├── image/               # 图片组件
│   ├── layout/              # 布局组件 (Header)
│   ├── management/          # 图片管理组件
│   ├── providers/           # Context Providers
│   ├── ui/                  # shadcn/ui 组件
│   └── upload/              # 上传相关组件
│
├── hooks/                   # 自定义 React Hooks
│   ├── useUpload.ts        # 上传逻辑
│   ├── useImages.ts        # 图片列表获取
│   ├── useConfigSync.ts    # 配置同步
│   └── useSyncGitHubToken.ts # Token 同步
│
├── lib/                     # 工具函数和核心逻辑
│   ├── compress.ts         # 图片压缩
│   ├── github.ts           # GitHub API 封装
│   ├── watermark.ts        # 水印处理
│   ├── link.ts             # 链接生成
│   └── debug.ts            # 调试工具
│
├── stores/                  # Zustand 状态管理
│   ├── configStore.ts      # 配置状态
│   └── uploadStore.ts      # 上传队列状态
│
└── types/                   # TypeScript 类型定义
```

### 核心数据流

**上传流程**:
1. `UploadArea` (拖拽/选择文件)
2. `useUpload` hook (处理队列)
3. `compressImage` (可选压缩)
4. `addWatermark` (可选水印)
5. GitHub API (上传到仓库)
6. `uploadStore` (更新队列状态)

**配置管理**:
- `configStore` (Zustand + persist 持久化)
- `ConfigDiscovery` (页面加载时自动检测远程配置)
- `useConfigSync` (配置静默同步)

**认证流程**:
- GitHub OAuth via NextAuth.js
- Token 存储在 localStorage (`github_token`)
- `SyncGitHubTokenToLocalStorage` 同步 Session Token

### 关键技术决策

**API 优化**:
- 使用 Git Trees API (`/git/trees/{branch}?recursive=1`) 一次性获取完整文件树
- 替代递归遍历，减少 API 请求从 N 次到 1 次
- 本地排序（文件名/大小/路径），不依赖 GitHub API 排序

**性能优化**:
- Next.js standalone 输出（Docker 部署）
- 图片优化：AVIF + WebP 格式
- 静态资源长期缓存（1年）
- 生产环境移除 console

**状态管理**:
- Zustand 用于全局配置和上传队列
- React Query 用于服务端状态（图片列表、仓库信息）
- LocalStorage 持久化配置

## Important Patterns

### 组件命名规范
- 页面组件：`*.page.tsx` 或 `page.tsx`
- 客户端组件：`'use client'` directive
- UI 组件：`src/components/ui/` (shadcn/ui)

### API Routes
- 所有 API 路由使用 Next.js Route Handlers
- 认证检查：`getServerSession(authOptions)`
- 使用用户的 OAuth Token (`session.accessToken`)，**不需要环境变量中的 GitHub Token**

### 环境变量
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `NEXTAUTH_SECRET` - NextAuth 加密密钥
- `NEXTAUTH_URL` - NextAuth 回调地址
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` - 自动从 GITHUB_CLIENT_ID 暴露

### 错误处理
- 使用 `debugLog` / `debugError` / `debugWarn` (src/lib/debug.ts)
- API 错误通过 NextResponse.json 返回统一格式

## Testing

测试框架：Vitest

```bash
# 运行所有测试
npm test

# UI 模式
npm run test:ui

# 覆盖率
npm run test:coverage
```

测试文件通常与源文件同目录：`*.test.ts` 或 `*.test.tsx`

## Documentation

- `README.md` - 项目简介、部署、功能列表
- `USAGE.md` - 详细使用教程（PicGo + GitHub 图床搭建）
- `docs/ARCHITECTURE_ANALYSIS.md` - 技术架构与性能分析报告
- `docs/quick-reference.md` - 代码快速参考手册

## Deployment

### Vercel（推荐）
一键部署按钮在 README.md 顶部

### Docker（可选）
```bash
docker run -d -p 3000:3000 \
  -e GITHUB_CLIENT_ID=xxx \
  -e GITHUB_CLIENT_SECRET=<SECRET_3e7bd818>  \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  -e NEXTAUTH_URL=http://localhost:3000 \
  ghcr.io/wu529778790/img.shenzjd.com:latest
```

注意：当前代码中 **Docker 相关文件已被删除**，如需使用 Docker 部署需重新添加。

## Common Issues

### NextAuth 错误
- 确保 `NEXTAUTH_URL` 与实际访问地址一致
- GitHub OAuth App 的回调地址必须匹配

### GitHub API 速率限制
- 使用用户 OAuth Token 而非 Personal Access Token
- Token 存储在 localStorage，自动同步

### 图片上传失败
- 检查仓库权限（需要 repo 权限）
- 验证文件大小（< 10MB）和格式（PNG/JPG/GIF/WEBP）
