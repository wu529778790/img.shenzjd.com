# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**ImgX** 是一个基于 Next.js 16 + React 19 的现代化图床管理工具，使用 GitHub 作为存储后端，提供拖拽上传、自动压缩、水印添加、CDN 加速等功能。

- **框架**: Next.js 16 (App Router) + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS 4 + shadcn/ui
- **状态管理**: Zustand + React Query (TanStack Query)
- **认证**: wx-auth（wx-auth.shenzjd.com 统一托管登录态与 GitHub 凭证）
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

# 无需任何必需环境变量：登录态与 GitHub 凭证由 wx-auth 托管
# （登录态 = *.shenzjd.com 根域共享 Cookie wxauth-token，本地开发自动生效）
```

## Architecture Overview

### 目录结构

```
src/
├── app/                      # Next.js App Router 页面
│   ├── management/          # 图片管理页面
│   ├── settings/            # 设置页面
│   ├── tools/               # 工具箱页面
│   │   ├── base64/         # Base64 转换
│   │   └── watermark/      # 水印工具
│   └── layout.tsx           # 根布局（挂载 site-navbar 公共导航）
│
├── components/              # React 组件
│   ├── animations/          # 动画组件
│   ├── image/               # 图片组件
│   ├── management/          # 图片管理组件
│   ├── providers/           # Context Providers (WxAuthProvider / ConfigDiscovery)
│   ├── ui/                  # shadcn/ui 组件
│   └── upload/              # 上传相关组件
│
├── hooks/                   # 自定义 React Hooks
│   ├── useUpload.ts        # 上传逻辑
│   ├── useImages.ts        # 图片列表获取
│   ├── useConfigSync.ts    # 配置同步
│   ├── useConfigCheck.ts   # 远程配置检查
│   └── useWxAuthSession.ts # wx-auth 登录会话与 GitHub 凭证
│
├── lib/                     # 工具函数和核心逻辑
│   ├── compress.ts         # 图片压缩
│   ├── github.ts           # GitHub API 封装
│   ├── watermark.ts        # 水印处理
│   ├── link.ts             # 链接生成
│   ├── wxauth.ts           # wx-auth 端点封装 / 状态判定 / 凭证缓存
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
2. `useUpload` → `ensureReady()` (wx-auth 登录 → 绑定/安装/开通引导 → 领取 installation token，每次上传会话一次)
3. `compressImage` (可选压缩)
4. `addWatermark` (可选水印)
5. GitHub API 浏览器直传 (PUT contents，token 为 wx-auth 签发的短命 installation token)
6. `uploadStore` (更新队列状态)

**配置管理**:
- `configStore` (Zustand + persist 持久化；owner/repo 由 wx-auth 下发，不被远程配置覆盖)
- `ConfigDiscovery` (登录后自动加载远程配置，自动同步回 GitHub)
- `useConfigSync` (配置静默同步)

**认证流程（wx-auth）**:
- 登录 UI 由 `<site-navbar>` 公共导航组件处理（unpkg 引入，子站零代码）
- 登录态 = 根域共享 Cookie `wxauth-token`；`useWxAuthSession` 挂载时 `WxAuth.init({ silent: true, required: false })` 静默校验，交互动作走 `WxAuth.requireAuth()`
- GitHub 凭证唯一持有方是 wx-auth：`GET /api/github/setups` 状态判定 → 按需引导（授权/安装新窗口完成，postMessage `github-bound`/`github-installed` 回传）→ `POST /api/github/token` 领 8 小时 installation token
- 开通能力（setup）：返回 `status: 'pending_grant'` 时**不得自动重试**——展示 `message` 并用 `installUrl` 新窗口弹「去 GitHub 授权」，用户完成仓库勾选回来后重新调 setup 直到 `active`；409 + `data.action === 'grant'` 同理用 `data.installUrl`（`runSetupFlow` 已实现）
- 红线：installation token 只存内存、不落 localStorage；缓存不超过 `expiresAt`（剩余 <30min 重领）；401/409 引导完成后必须重查 setups

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
- 图片上传/列表/删除均为浏览器直连 GitHub API（`src/lib/github.ts`），凭证由 `useWxAuthSession` 的 `tryGetCredential()` / `ensureReady()` 提供
- 登录/凭证端点在 wx-auth（`src/lib/wxauth.ts`），本站无自管 GitHub Token，也无需服务端代理

### 环境变量
- 无必需环境变量（wx-auth 托管登录与凭证，站点域名需属于 `*.shenzjd.com`）

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
  ghcr.io/wu529778790/img.shenzjd.com:latest
```

注意：当前代码中 **Docker 相关文件已被删除**，如需使用 Docker 部署需重新添加。镜像无需注入 GitHub/NextAuth 相关环境变量（wx-auth 托管）。

## Common Issues

### 登录 / 授权问题
- 登录态 Cookie `wxauth-token` 仅在 `*.shenzjd.com` 子域可读，本地开发用 localhost 映射测试
- 上传报「需要绑定 GitHub / 需要安装 GitHub App」时，按引导在新窗口完成授权/安装（App 建议选 All repositories），完成后自动重查
- 首次使用会调用 `POST /api/github/setup` 真实创建图床仓库（`repo` 固定传站点域名 `img.shenzjd.com`，换名重调会切换目标仓库），需要几秒

### GitHub API 速率限制
- 使用 wx-auth 签发的 installation token（仅覆盖授权仓库），401 时自动重领一次
- 429 / 502 / 503 提示稍后重试

### 图片上传失败
- 检查 GitHub App 安装范围是否覆盖目标仓库
- 验证文件大小（< 10MB）和格式（PNG/JPG/GIF/WEBP）
