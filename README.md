# Image Hosting Application

一个基于 Nuxt 4 + GitHub OAuth 的现代化图床应用，支持用户将自己的 GitHub 仓库作为存储空间。

## ✨ 特性

- 🔐 **GitHub OAuth 登录** - 无需手动输入 Token，安全便捷
- 📁 **个人仓库存储** - 数据保存在用户的 GitHub 仓库中
- ⚙️ **完全可配置** - 仓库、分支、目录路径均可自定义
- 📤 **批量上传** - 支持拖拽、多文件上传
- 🎨 **图片处理** - 压缩、加水印等工具
- 📋 **文件管理** - 查看、重命名、删除已上传文件
- 🌐 **多语言支持** - 简体中文、繁体中文、English
- 🎨 **深色模式** - 完整的深色模式支持
- 🔧 **工具箱** - Base64 转换、URL 生成、批量重命名等

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

# JWT 密钥 (生产环境请使用强密码)
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# 可选: 自定义域名
# CUSTOM_DOMAIN=https://cdn.example.com

# 可选: 自定义端口
# PORT=3000
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 运行开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 5. 构建生产版本

```bash
pnpm build
pnpm preview
```

## 🏗️ 项目结构

```
├── components/          # Vue 组件
│   └── Navigation.vue   # 导航菜单
├── pages/              # 页面路由
│   ├── login.vue       # 登录页
│   ├── index.vue       # 首页
│   ├── upload.vue      # 上传页
│   ├── manage.vue      # 管理页
│   ├── config.vue      # 配置页
│   ├── settings.vue    # 设置页
│   └── tools.vue       # 工具箱
├── server/             # 服务端代码
│   ├── api/            # API 路由
│   │   ├── auth/       # 认证相关
│   │   ├── repo/       # 仓库管理
│   │   ├── upload/     # 上传功能
│   │   ├── management/ # 文件管理
│   │   └── user/       # 用户配置
│   ├── middleware/     # 中间件
│   └── utils/          # 工具函数
├── stores/             # Pinia 状态管理
│   ├── auth.ts         # 认证状态
│   ├── config.ts       # 配置状态
│   ├── upload.ts       # 上传状态
│   ├── management.ts   # 管理状态
│   └── toast.ts        # 通知状态
├── locales/            # 国际化文件
│   ├── zh-CN.json
│   ├── zh-TW.json
│   └── en.json
├── nuxt.config.ts      # Nuxt 配置
├── package.json
├── .env.example
└── README.md
```

## 🔐 认证流程

1. 用户点击"登录"按钮
2. 重定向到 GitHub OAuth 授权页面
3. 用户授权后返回应用
4. 后端获取 access token 并验证用户
5. 生成 JWT token 存储在 Cookie 中
6. 用户登录成功，可以访问所有功能

## 📤 上传流程

1. 用户选择配置的仓库和目录
2. 上传文件到 GitHub 仓库
3. 生成可访问的 raw URL
4. 支持自定义域名替换
5. 可选：添加水印、压缩图片

## ⚙️ 配置说明

### 仓库配置
- **Repository Owner**: GitHub 用户名
- **Repository Name**: 仓库名称
- **Branch**: 分支名 (默认: main)
- **Directory**: 存储目录 (默认: images)

### 高级配置
- **Custom Domain**: 自定义 CDN 域名
- **Watermark Text**: 水印文字
- **Image Compression**: 图片压缩级别
- **Timestamp Directory**: 按日期创建子目录

## 🛠️ 工具箱功能

### Base64 转换器
- 文件转 Base64
- Base64 转图片
- 复制/下载结果

### URL 生成器
- 根据配置生成访问链接
- 支持自定义域名
- 批量生成

### 图片压缩器
- 调整压缩质量
- 实时预览
- 下载压缩后文件

### 水印工具
- 添加文字水印
- 调整位置和透明度
- 实时预览

### 批量重命名
- 批量处理文件
- 前缀/后缀设置
- 时间戳支持

## 🌐 国际化

应用支持三种语言：
- 简体中文 (zh-CN)
- 繁体中文 (zh-TW)
- English (en)

语言会根据浏览器设置自动选择，也可以在设置页面手动切换。

## 🎨 主题

支持三种主题模式：
- **Light**: 亮色模式
- **Dark**: 暗色模式
- **Auto**: 跟随系统设置

## 🔒 安全说明

- 所有敏感操作都需要认证
- GitHub Token 仅存储在服务端内存中
- 使用 JWT 进行状态管理
- 密码使用 bcrypt 哈希存储

## 🚧 开发计划

- [ ] 图片编辑器 (裁剪、旋转、滤镜)
- [ ] 图片 CDN 加速配置
- [ ] 统计数据面板
- [ ] 分享链接生成
- [ ] Webhook 支持
- [ ] 多仓库支持

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
