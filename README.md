# Image Hosting Application

一个基于 Nuxt 4 + GitHub OAuth 的现代化图床应用，支持用户将自己的 GitHub 仓库作为存储空间。

> **项目**: wu529778790/img.shenzjd.com
> **版本**: v3.0.0 (重构版)
> **日期**: 2026-01-07

---

## ✨ 特性

- 🔐 **GitHub OAuth 登录** - 无需手动输入 Token，安全便捷
- 📁 **个人仓库存储** - 数据保存在用户的 GitHub 仓库中
- ⚙️ **完全可配置** - 仓库、分支、目录路径均可自定义
- 📤 **批量上传** - 支持拖拽、多文件上传
- 🎨 **图片处理** - 压缩、加水印等工具
- 📋 **文件管理** - 查看、重命名、删除已上传文件
- 🎨 **深色模式** - 完整的深色模式支持
- 🔧 **工具箱** - Base64 转换、URL 生成、批量重命名等

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐) 或 npm
- GitHub OAuth App

### 1. 配置 GitHub OAuth

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建新的 OAuth App
3. 设置 Authorization callback URL 为: `http://localhost:3000/api/auth/callback`
4. 获取 Client ID 和 Client Secret

### 2. 环境配置

复制 `.env.example` 到 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

编辑 `.env`:

```env
# GitHub OAuth App 配置
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# JWT 密钥 (必须配置，生成命令: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 运行开发服务器

```bash
pnpm dev
```

访问 <http://localhost:3000>

### 5. 构建生产版本

```bash
pnpm build
pnpm preview
```

---

## 🏗️ 项目结构

```
img.shenzjd.com/
├── app.vue                    # 根组件
├── nuxt.config.ts             # Nuxt 配置
├── package.json               # 依赖配置
├── tailwind.config.ts         # Tailwind 配置
├── tsconfig.json              # TypeScript 配置
├── .env.example               # 环境变量模板
│
├── pages/                     # 7 个页面组件
│   ├── index.vue             # 首页
│   ├── login.vue             # 登录页
│   ├── config.vue            # 配置页
│   ├── upload.vue            # 上传页
│   ├── manage.vue            # 管理页
│   ├── settings.vue          # 设置页
│   └── tools.vue             # 工具箱
│
├── server/                    # 服务端代码
│   ├── api/                  # 16 个 API 路由
│   │   ├── auth/             # 认证相关 (4个)
│   │   │   ├── github.get.ts
│   │   │   ├── callback.get.ts
│   │   │   ├── logout.post.ts
│   │   │   └── verify.get.ts
│   │   ├── user/             # 用户配置 (2个)
│   │   │   ├── config.get.ts
│   │   │   └── config.put.ts
│   │   ├── repo/             # 仓库管理 (5个)
│   │   │   ├── list.get.ts
│   │   │   ├── create.post.ts
│   │   │   ├── init.post.ts
│   │   │   ├── branches.get.ts
│   │   │   └── contents.get.ts
│   │   ├── upload/           # 上传功能 (2个)
│   │   │   ├── image.put.ts
│   │   │   └── batch.post.ts
│   │   └── management/       # 文件管理 (3个)
│   │       ├── list.get.ts
│   │       ├── delete.delete.ts
│   │       └── rename.patch.ts
│   │
│   ├── utils/                # 工具函数
│   │   ├── github.ts         # GitHub API 封装
│   │   └── jwt.ts            # JWT 处理
│   │
│   └── middleware/           # 中间件
│       └── auth.ts           # 认证中间件
│
├── stores/                    # 5 个 Pinia 商店
│   ├── auth.ts               # 认证状态
│   ├── config.ts             # 配置状态
│   ├── upload.ts             # 上传状态
│   ├── management.ts         # 管理状态
│   └── toast.ts              # 通知状态
│
│
└── components/                # 组件
    └── Navigation.vue         # 导航菜单
```

---

## 🎯 核心功能

### GitHub OAuth 登录流程

```
用户访问首页
    ↓
点击"使用 GitHub 登录"
    ↓
重定向到 GitHub 授权页面
    ↓
用户授权后回调到 /api/auth/callback
    ↓
后端用 code 换取 access_token
    ↓
获取用户信息 (id, login, email, avatar)
    ↓
生成 JWT Token
    ↓
返回给前端并设置 Cookie
    ↓
自动跳转到配置/上传页面
```

### 数据存储架构

```
用户仓库: {username}/{repo} (可配置)
├── .image-hosting/              # 配置目录
│   ├── config.json             # 主配置文件
│   └── settings.json           # 用户偏好
├── images/                     # 图片存储
│   ├── 2024/                   # 按日期分类
│   │   ├── 01/
│   │   │   ├── 07/
│   │   │   │   ├── abc123.png
│   │   │   │   └── def456.jpg
│   └── uploads/                # 自定义目录
```

### 配置模型

```typescript
interface StorageConfig {
  repository: {
    owner: string        // 用户名
    name: string         // 仓库名
    branch: string       // 分支
  }
  directory: {
    mode: 'auto' | 'custom' | 'root'
    path: string         // 自定义路径
    autoPattern: 'date' | 'year/month' | 'custom'
  }
  naming: {
    strategy: 'hash' | 'timestamp' | 'original' | 'custom'
    prefix: string       // 前缀
    suffix: string       // 后缀
  }
  image: {
    autoCompress: boolean
    compressionQuality: number  // 0.1 - 1.0
    maxWidth: number
    maxHeight: number
    watermark: {
      enabled: boolean
      text: string
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
      opacity: number
    }
  }
  links: {
    format: 'markdown' | 'html' | 'bbcode' | 'plain'
    cdn: 'github' | 'jsdelivr'
  }
}
```

---

## 📤 页面功能预览

### 1. 首页 /index.vue

```
┌─────────────────────────────────────────┐
│           欢迎使用图床应用                │
├─────────────────────────────────────────┤
│                                         │
│  [使用 GitHub 登录]  ← 主要按钮          │
│                                         │
│  功能介绍:                              │
│  • GitHub OAuth 授权                    │
│  • 自动创建/配置图床仓库                │
│  • 图片上传与管理                       │
│  • 多格式链接生成                       │
│                                         │
│  已登录用户: 显示用户头像和快捷入口      │
└─────────────────────────────────────────┘
```

### 2. 配置页面 /config.vue

```
┌─────────────────────────────────────────┐
│        图床配置 (必须登录)               │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ 仓库配置 ─────────────────────────┐ │
│ │ 仓库: wu529778790/img.shenzjd.com  │ │
│ │ 分支: main                         │ │
│ │ [刷新仓库列表] [创建新仓库]        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 目录配置 ─────────────────────────┐ │
│ │ 模式: [自动] [自定义] [根目录]     │ │
│ │ 自定义路径: images/uploads         │ │
│ │ 自动模式: [按日期] [年/月] [自定义]│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 文件命名 ─────────────────────────┐ │
│ │ 策略: [哈希] [时间戳] [原名] [自定义]│ │
│ │ 前缀: img_                         │ │
│ │ 后缀:                              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 图片处理 ─────────────────────────┐ │
│ │ 自动压缩: [是] [否]                 │ │
│ │ 质量: 0.85 (滑块)                   │ │
│ │ 最大尺寸: 1920 x 1080               │ │
│ │ 水印: [启用] [禁用]                 │ │
│ │   文字:                            │ │
│ │   位置: [右下] [左下] [右上] [左上] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 链接格式 ─────────────────────────┐ │
│ │ 格式: [Markdown] [HTML] [BBCode]    │ │
│ │ CDN: [GitHub] [jsDelivr]            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [保存配置] [重置为默认] [导出配置]      │
└─────────────────────────────────────────┘
```

### 3. 上传页面 /upload.vue

```
┌─────────────────────────────────────────┐
│              图片上传                    │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ 上传区域 ─────────────────────────┐ │
│ │                                     │ │
│ │   [拖拽图片到此处或点击选择]         │ │
│ │   支持: JPG, PNG, GIF, WebP         │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 待上传列表 ───────────────────────┐ │
│ │ 1. screenshot.png (2.3 MB)         │ │
│ │ 2. photo.jpg (1.5 MB)              │ │
│ │ [移除] [预览]                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 上传信息 ─────────────────────────┐ │
│ │ 目标仓库: wu529778790/img.shenzjd.com│ │
│ │ 目标目录: images/2024/01/07         │ │
│ │ 命名方式: hash_abc123.png           │ │
│ │ 预计链接:                          │ │
│ │ https://github.com/wu529778790/...  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [重置] [开始上传] [上传并复制链接]      │
│                                         │
│ ┌─ 上传进度 ─────────────────────────┐ │
│ │ screenshot.png  ████████░░ 80%      │ │
│ │ photo.jpg       ██████████ 100%     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 4. 管理页面 /manage.vue

```
┌─────────────────────────────────────────┐
│              图床管理                    │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ 工具栏 ───────────────────────────┐ │
│ │ [刷新] [批量选择] [批量删除]        │ │
│ │ [批量复制链接] [搜索]               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 目录树 ───────────────────────────┐ │
│ │ 📁 images/                          │ │
│ │   ├── 📁 2024/                      │ │
│ │   │   ├── 📁 01/                    │ │
│ │   │   │   ├── 📁 07/                │ │
│ │   │   │   └── 📁 08/                │ │
│ │   └── 📁 uploads/                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 文件列表 ─────────────────────────┐ │
│ │ [✓] abc123.png  2.3MB  2024-01-07  │ │
│ │ [ ] def456.jpg  1.5MB  2024-01-07  │ │
│ │ [ ] ghi789.webp 890KB  2024-01-06  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 右键菜单:                               │
│ • 复制链接 (Markdown/HTML/BBCode)      │ │
│ • 重命名                               │ │
│ • 删除                                 │ │
│ • 查看详情                             │ │
└─────────────────────────────────────────┘
```

### 5. 设置页面 /settings.vue

```
┌─────────────────────────────────────────┐
│              应用设置                    │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ 外观设置 ─────────────────────────┐ │
│ │ 主题: [深色] [浅色] [自动]           │ │
│ │ 组件大小: [小] [默认] [大]           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 数据同步 ─────────────────────────┐ │
│ │ 云端配置: [同步] [下载] [上传]      │ │
│ │ 最后同步: 2024-01-07 12:00:00       │ │
│ │ [强制同步] [导出本地数据]           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 高级设置 ─────────────────────────┐ │
│ │ API 超时时间: 300秒                 │ │
│ │ 并发上传数: 3                       │ │
│ │ 自动清理缓存: [是] [否]             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 账户管理 ─────────────────────────┐ │
│ │ 用户: wu529778790                   │ │
│ │ 邮箱: user@example.com              │ │
│ │ [切换账户] [退出登录]               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 6. 工具箱 /tools.vue

```
┌─────────────────────────────────────────┐
│              工具箱                      │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ 图片压缩 ─────────────────────────┐ │
│ │ 选择图片 → 设置质量 → 下载压缩后    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ Base64 转换 ──────────────────────┐ │
│ │ 图片 → Base64 / Base64 → 图片       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 水印添加 ─────────────────────────┐ │
│ │ 图片 + 文字水印 → 下载              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 链接转换 ─────────────────────────┐ │
│ │ GitHub 链接 → CDN 链接              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 批量重命名 ───────────────────────┐ │
│ │ 批量处理文件 → 前缀/后缀/时间戳     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📊 项目统计

### 已完成功能 (8/10 阶段)

| 阶段 | 状态 | 说明 |
|------|------|------|
| 1. Nuxt 4 基础 | ✅ | 项目搭建、依赖安装、构建成功 |
| 2. OAuth 认证 | ✅ | GitHub OAuth + JWT + 登录页面 |
| 3. 仓库管理 | ✅ | 仓库操作 API + 配置页面 |
| 4. 上传功能 | ✅ | 单图/批量上传 + 图片处理 |
| 5. 文件管理 | ✅ | 列表/删除/重命名/预览 |
| 6. 设置系统 | ✅ | 主题/配置/备份 |
| 7. 工具箱 | ✅ | 5 个实用工具 |
| 8. UI 优化 | ✅ | 深色模式 + 响应式设计 |
| 9. 测试优化 | ⏳ | 单元测试 + E2E + 性能优化 |
| 10. 部署文档 | ⏳ | Docker + CI/CD + 文档 |

### 文件统计

| 类别 | 数量 |
|------|------|
| 页面组件 | 7 个 |
| API 端点 | 16 个 |
| Pinia 商店 | 5 个 |
| 工具函数 | 2 个 |
| 中间件 | 1 个 |
| 构建大小 | 2.31 MB (587 kB gzip) |

---

## 🔐 API 端点

### 认证

- `GET /api/auth/github` - 发起 OAuth 流程
- `GET /api/auth/callback` - OAuth 回调处理
- `POST /api/auth/logout` - 登出
- `GET /api/auth/verify` - 验证令牌

### 用户 & 配置

- `GET /api/user/config` - 获取配置
- `PUT /api/user/config` - 保存配置

### 仓库

- `GET /api/repo/list` - 列出仓库
- `POST /api/repo/create` - 创建仓库
- `POST /api/repo/init` - 初始化仓库
- `GET /api/repo/branches` - 列出分支
- `GET /api/repo/contents` - 列出目录内容

### 上传

- `PUT /api/upload/image` - 单图上传
- `POST /api/upload/batch` - 批量上传

### 管理

- `GET /api/management/list` - 列出文件
- `DELETE /api/management/delete` - 删除文件
- `PATCH /api/management/rename` - 重命名文件

---

## 🛠️ 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| **框架** | Nuxt 4.2.2 | 最新版本 |
| **语言** | TypeScript 5.7.2 | 类型安全 |
| **状态管理** | Pinia 2.2.6 | 现代化 |
| **UI 组件** | Element Plus 2.9.0 | 保持熟悉 |
| **样式** | TailwindCSS 3.4.0 | 实用优先 |
| **HTTP** | $fetch (Nuxt 内置) | 原生集成 |
| **JWT** | jose 5.9.6 | 安全处理 |
| **日期处理** | date-fns 3.6.0 | 日期格式化 |
| **压缩** | jszip 3.10.1 | 批量压缩 |

---

## 🌐 主题模式

- **Light**: 亮色模式
- **Dark**: 暗色模式
- **Auto**: 跟随系统设置

---

## 🔒 安全说明

1. **Client Secret**: 仅在服务端使用，绝不暴露给前端
2. **JWT Token**: 设置合理过期时间 (默认 7 天)
3. **Cookie-based Auth**: HTTP-only cookies 存储令牌
4. **Repository Isolation**: 每个用户数据在自己的仓库
5. **权限验证**: 所有 API 必须验证 JWT

---

## 🐛 问题排查

### 问题: "Cannot find module"

```bash
pnpm install
pnpm build
```

### 问题: "OAuth callback error"

检查 `.env` 中的 GitHub Client ID 和 Secret

### 问题: "Build failed"

```bash
rm -rf .nuxt .output node_modules/.cache
pnpm install
pnpm build
```

### 问题: GitHub API 限流

- 未授权: 60次/小时
- 授权: 5000次/小时
- **解决**: 实现请求缓存或等待重置

---

## 🚀 部署指南

### Node.js 服务器 (推荐)

```bash
pnpm build
pnpm preview
# 或
node .output/server/index.mjs
```

### Docker 部署

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### Vercel / Netlify

- 自动检测 Nuxt 项目
- 环境变量配置:
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `JWT_SECRET` (必须配置)

### 生产环境检查清单

- [ ] 设置 `.env` 环境变量
- [ ] 配置 GitHub OAuth App
- [ ] 使用 HTTPS
- [ ] 设置反向代理 (Nginx/Apache)
- [ ] 配置 PM2 或 Docker
- [ ] 设置日志监控
- [ ] 配置备份策略

---

## 🎯 核心优势

1. ✅ **零配置登录**: 用户只需点击授权，无需手动 Token
2. ✅ **数据自主**: 存储在用户自己的 GitHub 仓库
3. ✅ **完全可配**: 仓库、分支、目录、命名、格式均可配置
4. ✅ **云端同步**: 配置自动同步，多设备无缝使用
5. ✅ **现代化架构**: Nuxt 4 + TypeScript + Pinia
6. ✅ **SEO 友好**: SSR 支持，更好的搜索引擎收录
7. ✅ **易于扩展**: 清晰的模块化结构，易于添加新功能

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Nuxt.js](https://nuxt.com) - Vue 全栈框架
- [GitHub API](https://docs.github.com/en/rest) - GitHub REST API
- [Tailwind CSS](https://tailwindcss.com) - CSS 框架
- [Element Plus](https://element-plus.org) - UI 组件库
- [Pinia](https://pinia.vuejs.org) - 状态管理

---

**注意**: 本项目仅供学习和参考，请勿用于生产环境，使用前请仔细阅读 GitHub API 使用条款。
**构建时间**: 2026-01-07
**当前状态**: ✅ 核心功能完成，可运行
