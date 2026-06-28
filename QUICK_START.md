# 🚀 快速开始指南

## 开发环境设置

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑并填入您的 GitHub OAuth 配置
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 4. 运行测试

```bash
# 运行单元测试
npm test

# 带 UI 界面
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

### 5. 代码检查

```bash
npm run lint
npm run build
```

---

## 📚 设计系统文档

了解 ImgX 的设计语言和组件规范：

- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - 完整设计系统文档
- **[COMPONENT_STYLE_GUIDE.md](./COMPONENT_STYLE_GUIDE.md)** - 组件样式规范
- **[ACCESSIBILITY.md](./ACCESSIBILITY.md)** - 可访问性声明
- **[ACCESSIBILITY_QUICK_REFERENCE.md](./ACCESSIBILITY_QUICK_REFERENCE.md)** - 可访问性快速参考

---

## 🎨 核心特性

### Soft UI Evolution 设计语言

- ✨ 柔和阴影系统
- 🌈 完整深色模式支持
- ⚡ 流畅动画（150-300ms）
- ♿ WCAG AA+ 可访问性

### 技术栈

- **框架**: Next.js 16 + React 19
- **样式**: Tailwind CSS 4
- **组件**: shadcn/ui + Base UI
- **动画**: Framer Motion
- **状态**: Zustand + React Query
- **认证**: NextAuth.js

---

## 🎯 核心功能

### 1. GitHub 图床管理

- 🔐 GitHub OAuth 认证
- 📤 拖拽上传图片
- 🗜️ 自动图片压缩
- 💧 水印添加
- 🔗 多格式链接生成
- 🌐 CDN 加速

### 2. 图片管理

- 📊 网格/列表视图
- 🔍 搜索和筛选
- 📁 文件夹管理
- 🗑️ 批量删除
- 📋 复制链接

### 3. 工具箱

- 🗜️ 图片压缩
- 💧 水印工具
- 📊 Base64 转换

### 4. 用户体验

- 🌓 主题切换（浅色/深色/系统）
- ⏳ 骨架屏加载
- 🚀 虚拟列表滚动
- ⏱️ 数据预加载
- 📱 响应式设计

---

## 🛠️ 开发规范

### 代码风格

- **TypeScript** - 严格模式
- **ESLint** - Next.js 推荐配置
- **Prettier** - 代码格式化（如已配置）

### 组件开发

```tsx
// ✅ 推荐：使用函数组件 + TypeScript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  return (
    <button className={cn(variant === 'primary' && 'bg-primary')}>
      {children}
    </button>
  );
}
```

### 样式最佳实践

```tsx
// ✅ 使用语义化颜色
<div className="bg-background text-foreground">

// ❌ 避免硬编码颜色
<div className="bg-white text-gray-900">
```

### 可访问性

```tsx
// ✅ 所有图标按钮必须添加 aria-label
<Button aria-label="删除">
  <Trash2 className="h-4 w-4" />
</Button>

// ✅ 自定义可点击元素添加键盘支持
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
```

---

## 📂 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── config/            # 配置页面
│   ├── login/             # 登录页面
│   ├── management/        # 图片管理
│   ├── settings/          # 设置页面
│   └── tools/             # 工具箱
├── components/
│   ├── ui/                # shadcn/ui 组件
│   ├── layout/            # 布局组件
│   ├── image/             # 图片相关组件
│   ├── upload/            # 上传相关组件
│   ├── loading/           # 加载组件
│   ├── management/        # 管理功能组件
│   └── providers/         # Context Providers
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具函数
├── stores/                # Zustand Stores
├── types/                 # TypeScript 类型定义
└── styles/                # 全局样式
```

---

## 🔧 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器

# 构建
npm run build            # 生产构建
npm run start            # 启动生产服务器

# 代码质量
npm run lint             # ESLint 检查
npm test                 # 运行测试
npm run test:coverage    # 测试覆盖率

# 其他
npm run lint:fix         # 自动修复 lint 错误（如有）
```

---

## 🌐 部署

### Vercel（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/wu529778790/img.shenzjd.com)

### 其他平台

参考 [README.md](./README.md) 中的部署说明。

---

## 🤝 贡献指南

我们欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### Pull Request 要求

- ✅ 遵循现有代码风格
- ✅ 添加必要的测试
- ✅ 更新相关文档
- ✅ 确保通过所有检查（lint、build、test）

---

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](./LICENSE) 文件了解详情。

---

## 💖 支持项目

如果 ImgX 对您有帮助，请考虑：

- ⭐ 给项目点 Star
- 🐛 提交 Issue 报告问题
- 💡 分享您的使用体验
- ☕ [请我喝杯咖啡](https://buymeacoffee.com/your-link)

---

## 📞 联系我们

- **GitHub**: [https://github.com/wu529778790/img.shenzjd.com](https://github.com/wu529778790/img.shenzjd.com)
- **Issues**: [https://github.com/wu529778790/img.shenzjd.com/issues](https://github.com/wu529778790/img.shenzjd.com/issues)

---

**Made with ❤️ by ImgX Team**
