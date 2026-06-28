# ImgX - 图床产品实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 PicX 架构，从零打造一个现代化的个人图床产品 ImgX，支持 GitHub 登录、拖拽上传、自动压缩、水印、Markdown 链接生成等核心功能。

**Architecture:** Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui。前端纯静态 + Vercel Serverless Functions，零后端成本。

**Tech Stack:** Next.js 14, React 18, TypeScript 5, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, axios, browser-image-compression, fabric, react-dropzone, lucide-react

## Global Constraints

- **Next.js版本**: 14.2+（使用 App Router）
- **TypeScript**: 严格模式（strict: true）
- **Node.js**: 18+
- **GitHub OAuth**: 必须使用自己的 OAuth App，禁止使用 PicX 作者的 App
- **Token存储**: localStorage（MVP 阶段），生产环境建议加密
- **图片压缩质量**: 默认 0.8，最大文件 1MB
- **CDN**: jsDelivr（默认），支持 GitHub 原始链接
- **界面语言**: 仅中文（第一版）
- **主题**: 支持浅色/深色/自动三模式

---

## 📁 项目结构概览

```
my-picx/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # 根布局
│   │   ├── page.tsx             # 首页重定向
│   │   ├── login/               # 登录
│   │   │   ├── page.tsx
│   │   │   └── token/page.tsx
│   │   ├── config/page.tsx      # 配置页
│   │   ├── upload/page.tsx      # 上传页
│   │   ├── management/page.tsx  # 管理页
│   │   ├── tools/               # 工具箱
│   │   │   ├── compress/page.tsx
│   │   │   ├── watermark/page.tsx
│   │   │   └── base64/page.tsx
│   │   ├── settings/page.tsx    # 设置页
│   │   └── api/                 # API Routes
│   │       ├── auth/callback/route.ts
│   │       └── auth/user/route.ts
│   ├── components/              # React 组件
│   │   ├── ui/                  # shadcn/ui 组件（后续按需添加）
│   │   ├── layout/              # 布局组件
│   │   ├── upload/              # 上传组件
│   │   └── image/               # 图片组件
│   ├── lib/                     # 工具库
│   │   ├── github.ts            # GitHub API 封装
│   │   ├── compress.ts
│   │   ├── watermark.ts
│   │   ├── base64.ts
│   │   ├── link.ts
│   │   └── utils.ts
│   ├── stores/                  # Zustand Stores
│   │   ├── authStore.ts
│   │   ├── configStore.ts
│   │   └── uploadStore.ts
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useUpload.ts
│   │   └── useTheme.ts
│   ├── types/                   # TypeScript 类型
│   │   ├── auth.ts
│   │   ├── image.ts
│   │   └── config.ts
│   └── styles/
│       └── globals.css
├── public/
├── docs/superpowers/specs/2024-06-28-imgx-design.md
├── docs/superpowers/plans/2024-06-28-imgx-implementation.md  # ← 本文件
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── .env.local
├── .gitignore
├── vercel.json
└── README.md
```

---

## 🗓️ 开发阶段

### 阶段 0: 项目初始化（Day 1）
**目标**: 创建 Next.js 项目、配置开发环境、安装依赖、成功部署到 Vercel

### 阶段 1: 认证模块（Week 1）
**目标**: 实现 GitHub OAuth 登录 + 手动 Token 登录

### 阶段 2: 配置模块（Week 1）
**目标**: 实现图床配置（仓库/分支/目录选择）

### 阶段 3: 核心上传功能（Week 2）
**目标**: 实现拖拽上传、压缩、水印、链接生成

### 阶段 4: 图片管理（Week 3）
**目标**: 实现图片列表、目录树、批量操作

### 阶段 5: 工具箱（Week 3）
**目标**: 实现压缩工具、水印工具、Base64 转换

### 阶段 6: 设置与优化（Week 4）
**目标**: 主题切换、性能优化、PWA 支持

---

## 🎯 阶段 0: 项目初始化（Day 1）

### Task 1: 创建 Next.js 项目

**目标**: 使用 create-next-app 创建项目基础

**Files:**
- Create: `package.json`（自动生成）
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1: 运行 create-next-app 命令**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git \
  --use-npm
```

Expected: 项目创建成功

- [ ] **Step 2: 安装额外依赖**

```bash
# 核心依赖
npm install zustand @tanstack/react-query axios \
  browser-image-compression fabric date-fns \
  react-hot-toast react-dropzone lucide-react \
  clsx tailwind-merge

# 开发依赖
npm install -D vitest @vitejs/plugin-react \
  @types/node @types/react @types/react-dom @types/fabric
```

- [ ] **Step 3: 初始化 shadcn/ui**

```bash
npx shadcn-ui@latest init
```

当提示时选择：
- Which style would you like to use? › Default
- Which color would you like to use as base color? › Slate
- Where is your global CSS file? › src/app/globals.css
- Where is your tailwind.config.js located? › tailwind.config.ts
- Configure the import alias for components: › @/components
- Configure the import alias for utils: › @/lib/utils

- [ ] **Step 4: 安装常用 shadcn/ui 组件**

```bash
npx shadcn-ui@latest add button card input label select slider toast dialog dropdown-menu
```

- [ ] **Step 5: 创建 utils 工具函数**

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 6: 配置环境变量**

Create `.env.local`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here

# 站点配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
```

Create `.env.example`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# 站点配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
```

- [ ] **Step 7: 更新 package.json 脚本**

Ensure `package.json` has:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest"
  }
}
```

- [ ] **Step 8: 运行开发服务器**

```bash
npm run dev
```

Expected: 看到 "Ready on http://localhost:3000"

- [ ] **Step 9: 配置 Tailwind 内容路径**

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 10: 测试构建**

```bash
npm run build
```

Expected: 构建成功，生成 `.next` 目录

- [ ] **Step 11: 配置 Vercel 部署**

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

- [ ] **Step 12: 提交代码**

```bash
git add .
git commit -m "feat: initialize Next.js project with TypeScript and Tailwind

- Setup Next.js 14 with App Router
- Configure Tailwind CSS with shadcn/ui
- Install core dependencies
- Setup development environment"
```

---

### Task 2: 创建项目基础结构和 TypeScript 类型

**Files:**
- Create: `src/types/auth.ts`
- Create: `src/types/image.ts`
- Create: `src/types/config.ts`

- [ ] **Step 1: 创建认证类型**

Create `src/types/auth.ts`:

```typescript
export interface User {
  id: number
  login: string
  avatar_url: string
  name?: string
  email?: string
}

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
}
```

- [ ] **Step 2: 创建图片类型**

Create `src/types/image.ts`:

```typescript
export interface ImageFile {
  id: string
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  download_url: string
  type: 'file' | 'dir'
  created_at?: string
  uploaded_at?: Date
}

export interface UploadTask {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  result?: ImageFile
}

export interface LinkOptions {
  format: 'markdown' | 'html' | 'bbcode'
  cdn: 'github' | 'jsdelivr' | 'github-pages'
  owner: string
  repo: string
  branch: string
  path: string
  fileName: string
  useRaw?: boolean
}
```

- [ ] **Step 3: 创建配置类型**

Create `src/types/config.ts`:

```typescript
export interface Config {
  owner: string
  repo: string
  branch: string
  directory: string
  compressionEnabled: boolean
  compressionQuality: number
  watermarkEnabled: boolean
  watermarkText: string
  watermarkColor: string
  watermarkSize: number
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  theme: 'light' | 'dark' | 'system'
}

export type CompressionQuality = 0 | 25 | 50 | 75 | 100
```

- [ ] **Step 4: 提交代码**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for auth, image, and config"
```

---

## 🔐 阶段 1: 认证模块（Week 1）

### Task 3: 实现 Zustand Auth Store

**Files:**
- Create: `src/stores/authStore.ts`

**Interfaces:**
- Consumes: `User` type from `src/types/auth.ts`
- Produces: `useAuthStore` hook

- [ ] **Step 1: 创建 Auth Store**

Create `src/stores/authStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string) => void
  loginWithOAuth: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token) => {
        set({ token, isAuthenticated: true })
      },
      loginWithOAuth: (token, user) => {
        set({ token, user, isAuthenticated: true })
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

- [ ] **Step 2: 创建单元测试**

Create `src/__tests__/authStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'

describe('authStore', () => {
  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear()
    // 重置 store
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    })
  })

  it('should login with token', () => {
    const { login, isAuthenticated, token } = useAuthStore.getState()

    login('test-token-123')

    const state = useAuthStore.getState()
    expect(state.token).toBe('test-token-123')
    expect(state.isAuthenticated).toBe(true)
  })

  it('should login with OAuth', () => {
    const { loginWithOAuth } = useAuthStore.getState()
    const mockUser = {
      id: 1,
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.png',
    }

    loginWithOAuth('oauth-token', mockUser)

    const state = useAuthStore.getState()
    expect(state.token).toBe('oauth-token')
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should logout', () => {
    const { login, logout } = useAuthStore.getState()

    login('test-token')
    logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- src/__tests__/authStore.test.ts
```

Expected: 所有测试通过

- [ ] **Step 4: 提交代码**

```bash
git add src/stores/authStore.ts src/__tests__/authStore.test.ts
git commit -m "feat: add auth store with Zustand and persist middleware

- Implement login, loginWithOAuth, logout actions
- Add unit tests for auth store
- Persist auth state to localStorage"
```

---

### Task 4: 实现 Config Store

**Files:**
- Create: `src/stores/configStore.ts`

- [ ] **Step 1: 创建 Config Store**

Create `src/stores/configStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Config } from '@/types/config'

interface ConfigState extends Config {
  updateConfig: (updates: Partial<Config>) => void
  resetConfig: () => void
}

const defaultConfig: Config = {
  owner: '',
  repo: '',
  branch: 'main',
  directory: '',
  compressionEnabled: true,
  compressionQuality: 80,
  watermarkEnabled: false,
  watermarkText: '',
  watermarkColor: '#ffffff',
  watermarkSize: 24,
  watermarkPosition: 'bottom-right',
  theme: 'system',
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      ...defaultConfig,
      updateConfig: (updates) => {
        set((state) => ({ ...state, ...updates }))
      },
      resetConfig: () => {
        set(defaultConfig)
      },
    }),
    {
      name: 'config-storage',
    }
  )
)
```

- [ ] **Step 2: 创建单元测试**

Create `src/__tests__/configStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useConfigStore } from '@/stores/configStore'

describe('configStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useConfigStore.setState({
      owner: '',
      repo: '',
      branch: 'main',
      directory: '',
      compressionEnabled: true,
      compressionQuality: 80,
      watermarkEnabled: false,
      watermarkText: '',
      watermarkColor: '#ffffff',
      watermarkSize: 24,
      watermarkPosition: 'bottom-right',
      theme: 'system',
    })
  })

  it('should update config', () => {
    const { updateConfig } = useConfigStore.getState()

    updateConfig({
      owner: 'testuser',
      repo: 'test-repo',
      branch: 'master',
    })

    const state = useConfigStore.getState()
    expect(state.owner).toBe('testuser')
    expect(state.repo).toBe('test-repo')
    expect(state.branch).toBe('master')
  })

  it('should preserve unchanged values when updating', () => {
    const { updateConfig } = useConfigStore.getState()

    updateConfig({ owner: 'testuser' })

    const state = useConfigStore.getState()
    expect(state.repo).toBe('')
    expect(state.branch).toBe('main')
  })
})
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- src/__tests__/configStore.test.ts
```

Expected: 所有测试通过

- [ ] **Step 4: 提交代码**

```bash
git add src/stores/configStore.ts src/__tests__/configStore.test.ts
git commit -m "feat: add config store with default values

- Store user configuration (repo, branch, compression, watermark)
- Add updateConfig and resetConfig actions
- Persist config to localStorage"
```

---

### Task 5: 实现 OAuth 回调 API Route

**Files:**
- Create: `src/app/api/auth/callback/route.ts`

**Interfaces:**
- Consumes: GitHub OAuth API
- Produces: 重定向到首页，携带 token 和用户信息

- [ ] **Step 1: 创建 OAuth 回调处理**

Create `src/app/api/auth/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=access_denied', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code', request.url)
    )
  }

  try {
    // 用 code 换取 access_token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(`/login?error=${tokenData.error}`, request.url)
      )
    }

    // 获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const userData = await userResponse.json()

    // 重定向回首页，携带 token 和用户信息
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('token', tokenData.access_token)
    redirectUrl.searchParams.set('user', JSON.stringify(userData))

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    )
  }
}
```

- [ ] **Step 2: 创建 Token 验证 API**

Create `src/app/api/auth/user/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('token ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(6)

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userData = await response.json()
    return NextResponse.json({ user: userData })
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: 提交代码**

```bash
git add src/app/api/auth/
git commit -m "feat: add OAuth callback and user verification APIs

- Implement GitHub OAuth callback handler
- Add token verification endpoint
- Redirect to homepage with token after OAuth"
```

---

### Task 6: 实现登录页面

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/token/page.tsx`

- [ ] **Step 1: 创建 OAuth 登录页**

Create `src/app/login/page.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { GitHub, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // 检查 URL 中是否有 token（OAuth 回调）
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const user = params.get('user')
    const error = params.get('error')

    if (error) {
      console.error('OAuth error:', error)
      // TODO: 显示错误提示
    }

    if (token && user) {
      // OAuth 登录成功，保存到 store
      const { loginWithOAuth } = useAuthStore.getState()
      const userData = JSON.parse(decodeURIComponent(user))
      loginWithOAuth(token, userData)

      // 清空 URL 参数
      window.history.replaceState({}, '', '/')
      // 跳转到上传页
      router.push('/upload')
    }
  }, [router])

  const handleGitHubLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/auth/callback`
    const scope = 'public_repo repo'

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
  }

  const handleTokenLogin = () => {
    router.push('/login/token')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">ImgX</h1>
          <p className="text-gray-500 mt-2">个人图床管理工具</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGitHubLogin}
            className="w-full"
            variant="outline"
          >
            <GitHub className="mr-2 h-5 w-5" />
            使用 GitHub 登录
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                或
              </span>
            </div>
          </div>

          <Button
            onClick={handleTokenLogin}
            className="w-full"
            variant="secondary"
          >
            <Key className="mr-2 h-5 w-5" />
            使用 Token 登录
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: 创建 Token 登录页**

Create `src/app/login/token/page.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'

export default function TokenLoginPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token.trim()) {
      toast.error('请输入 Token')
      return
    }

    try {
      // 验证 token
      const response = await fetch('/api/auth/user', {
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Invalid token')
      }

      const { user } = await response.json()

      // 保存到 store
      login(token)

      toast.success('登录成功')
      router.push('/upload')
    } catch (error) {
      toast.error('Token 无效，请检查')
      console.error('Token validation failed:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Key className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="text-2xl font-bold mt-4">使用 Token 登录</h1>
          <p className="text-gray-500 mt-2 text-sm">
            请输入您的 GitHub Personal Access Token
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="token">Personal Access Token</Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-2">
              前往 GitHub Settings → Developer settings → Personal access tokens 生成
            </p>
          </div>

          <Button type="submit" className="w-full">
            登录
          </Button>

          <Button
            type="button"
            onClick={() => router.back()}
            className="w-full"
            variant="ghost"
          >
            返回
          </Button>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: 更新根布局**

Update `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ImgX - 个人图床管理工具",
  description: "基于 GitHub 的现代化图床服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 创建 AuthProvider**

Create `src/components/providers/AuthProvider.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = usePathname()
  const { isAuthenticated, token } = useAuthStore()

  useEffect(() => {
    // 如果是登录页，不需要认证
    if (router.startsWith('/login')) {
      return
    }

    // 如果没有认证，跳转到登录页
    if (!isAuthenticated || !token) {
      router.push('/login')
    }
  }, [isAuthenticated, token, router])

  return <>{children}</>
}
```

- [ ] **Step 5: 提交代码**

```bash
git add src/app/login/ src/components/providers/
git commit -m "feat: implement login pages with OAuth and token auth

- Add OAuth login page with GitHub redirect
- Add manual token input page
- Implement AuthProvider for route protection
- Add integration with auth store"
```

---

## ⚙️ 阶段 2: 配置模块（Week 1）

### Task 7: 实现 GitHub API 封装

**Files:**
- Create: `src/lib/github.ts`

**Interfaces:**
- Consumes: GitHub REST API v3
- Produces: `GitHubAPI` class with methods for repo/file operations

- [ ] **Step 1: 创建 GitHub API 类**

Create `src/lib/github.ts`:

```typescript
import axios, { AxiosInstance } from 'axios'

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  download_url: string
  type: 'file' | 'dir'
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
  description: string | null
  html_url: string
}

export class GitHubAPI {
  private client: AxiosInstance
  public owner: string
  public repo: string

  constructor(token: string, owner: string, repo: string) {
    this.owner = owner
    this.repo = repo

    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ImgX',
      },
    })
  }

  // 获取用户信息
  async getCurrentUser() {
    const response = await this.client.get('/user')
    return response.data
  }

  // 创建仓库
  async createRepo(name: string, description: string = 'ImgX image host', private_: boolean = false) {
    const response = await this.client.post('/user/repos', {
      name,
      description,
      private: private_,
      auto_init: true,
    })
    return response.data
  }

  // 列出用户的所有仓库
  async listRepos() {
    const response = await this.client.get('/user/repos', {
      params: {
        sort: 'updated',
        per_page: 100,
      },
    })
    return response.data as GitHubRepo[]
  }

  // 获取仓库信息
  async getRepo() {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}`)
    return response.data
  }

  // 列出目录内容
  async listContents(path: string = '') {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      params: { ref: this.getBranch() },
    })
    return response.data as GitHubFile[]
  }

  // 创建或更新文件
  async createOrUpdateFile(
    filePath: string,
    content: string | Blob,
    message: string
  ): Promise<{ sha: string }> {
    // 检查文件是否存在
    let sha: string | undefined
    try {
      const existing = await this.getContents(filePath)
      sha = existing.sha
    } catch {
      // 文件不存在，创建新文件
    }

    // 处理 Blob 内容
    let contentBase64: string
    if (content instanceof Blob) {
      contentBase64 = await this.blobToBase64(content)
    } else {
      contentBase64 = Buffer.from(content).toString('base64')
    }

    const response = await this.client.put(
      `/repos/${this.owner}/${this.repo}/contents/${filePath}`,
      {
        message,
        content: contentBase64,
        sha,
      }
    )

    return { sha: response.data.content.sha }
  }

  // 删除文件
  async deleteFile(filePath: string, message: string, sha: string) {
    const response = await this.client.delete(`/repos/${this.owner}/${this.repo}/contents/${filePath}`, {
      data: { message, sha },
    })
    return response.data
  }

  // 批量删除文件
  async deleteFiles(filePaths: string[]) {
    const results = await Promise.allSettled(
      filePaths.map(async (filePath) => {
        // 需要先获取文件的 sha
        try {
          const file = await this.getContents(filePath)
          return this.deleteFile(filePath, `Delete ${filePath}`, file.sha)
        } catch (error) {
          console.error(`Failed to delete ${filePath}:`, error)
          throw error
        }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return { successful, failed }
  }

  private getBranch(): string {
    // TODO: 从配置中获取 branch
    return 'main'
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
}

// 工厂函数
export function createGitHubAPI(token: string, owner: string, repo: string) {
  return new GitHubAPI(token, owner, repo)
}
```

- [ ] **Step 2: 创建单元测试**

Create `src/__tests__/github.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitHubAPI } from '@/lib/github'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(require('axios'))

describe('GitHubAPI', () => {
  let api: GitHubAPI

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks()

    // 创建 mock axios 实例
    const mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    }
    mockedAxios.create.mockReturnValue(mockAxiosInstance)

    api = new GitHubAPI('test-token', 'testuser', 'test-repo')
  })

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      const mockUser = {
        id: 1,
        login: 'testuser',
        avatar_url: 'https://example.com/avatar.png',
      }

      ;(api as any).client.get.mockResolvedValue({ data: mockUser })

      const user = await api.getCurrentUser()

      expect(user).toEqual(mockUser)
      expect(api['client'].get).toHaveBeenCalledWith('/user')
    })
  })

  describe('createRepo', () => {
    it('should create a new repository', async () => {
      const mockRepo = {
        id: 1,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        private: false,
      }

      ;(api as any).client.post.mockResolvedValue({ data: mockRepo })

      const repo = await api.createRepo('test-repo', 'Test repository')

      expect(repo).toEqual(mockRepo)
      expect(api['client'].post).toHaveBeenCalledWith('/user/repos', {
        name: 'test-repo',
        description: 'ImgX image host',
        private: false,
        auto_init: true,
      })
    })
  })

  describe('createOrUpdateFile', () => {
    it('should create a new file when it does not exist', async () => {
      // 模拟文件不存在
      ;(api as any).client.get.mockRejectedValue(new Error('Not Found'))
      ;(api as any).client.put.mockResolvedValue({
        data: { content: { sha: 'new-sha' } },
      })

      const result = await api.createOrUpdateFile(
        'test.txt',
        'Hello World',
        'Add test file'
      )

      expect(result.sha).toBe('new-sha')
      expect(api['client'].put).toHaveBeenCalled()
    })

    it('should update an existing file', async () => {
      const existingFile = { sha: 'existing-sha' }

      ;(api as any).client.get.mockResolvedValue({ data: existingFile })
      ;(api as any).client.put.mockResolvedValue({
        data: { content: { sha: 'new-sha' } },
      })

      const result = await api.createOrUpdateFile(
        'test.txt',
        'Updated content',
        'Update test file'
      )

      expect(result.sha).toBe('new-sha')
      expect(api['client'].put).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ sha: 'existing-sha' })
      )
    })
  })
})
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- src/__tests__/github.test.ts
```

Expected: 所有测试通过

- [ ] **Step 4: 提交代码**

```bash
git add src/lib/github.ts src/__tests__/github.test.ts
git commit -m "feat: add GitHub API wrapper with full coverage

- Implement GitHubAPI class for repo/file operations
- Add createRepo, listContents, createOrUpdateFile, deleteFile
- Add comprehensive unit tests with mocks"
```

---

### Task 8: 实现配置页面

**Files:**
- Create: `src/app/config/page.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `useConfigStore`, `GitHubAPI`
- Produces: 配置页面 UI，支持一键配置图床

- [ ] **Step 1: 创建配置页面**

Create `src/app/config/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { useConfigStore } from '@/stores/configStore'
import { GitHubAPI } from '@/lib/github'

export default function ConfigPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const { config, updateConfig } = useConfigStore()

  const [loading, setLoading] = useState(false)
  const [repos, setRepos] = useState<Array<{ name: string; full_name: string }>>([])
  const [branches, setBranches] = useState<string[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)

  // 获取用户仓库列表
  useEffect(() => {
    if (!token) return

    const fetchRepos = async () => {
      setLoadingRepos(true)
      try {
        const response = await fetch('/api/repos', {
          headers: { Authorization: `token ${token}` },
        })
        const data = await response.json()
        setRepos(data)
      } catch (error) {
        console.error('Failed to fetch repos:', error)
        toast.error('获取仓库列表失败')
      } finally {
        setLoadingRepos(false)
      }
    }

    fetchRepos()
  }, [token])

  // 当选择仓库时，获取分支列表
  useEffect(() => {
    if (!config.repo || !token) return

    const fetchBranches = async () => {
      try {
        const response = await fetch(
          `/api/repos/${config.owner}/${config.repo}/branches`,
          { headers: { Authorization: `token ${token}` } }
        )
        const data = await response.json()
        setBranches(data.map((b: any) => b.name))
      } catch (error) {
        console.error('Failed to fetch branches:', error)
      }
    }

    fetchBranches()
  }, [config.repo, config.owner, token])

  const handleAutoConfig = async () => {
    if (!token) {
      toast.error('请先登录')
      return
    }

    setLoading(true)
    try {
      const api = new GitHubAPI(token, '', '')

      // 创建新仓库
      const username = (await api.getCurrentUser()).login
      const repoName = `${username.toLowerCase()}-imgx`

      await api.createRepo(repoName, 'ImgX image host')

      updateConfig({
        owner: username,
        repo: repoName,
        branch: 'main',
        directory: 'images',
      })

      toast.success('图床配置成功！')
      router.push('/upload')
    } catch (error) {
      console.error('Auto config failed:', error)
      toast.error('配置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleManualConfig = () => {
    updateConfig({
      owner: config.owner,
      repo: config.repo,
      branch: config.branch,
      directory: config.directory,
    })

    toast.success('配置已保存')
    router.push('/upload')
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          图床配置
        </h1>
        <p className="text-gray-500 mt-2">配置您的 GitHub 图床仓库</p>
      </div>

      <div className="space-y-6">
        {/* 一键配置 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">一键配置</h2>
          <p className="text-gray-500 mb-4">
            自动创建图床仓库并完成基础配置
          </p>
          <Button onClick={handleAutoConfig} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                配置中...
              </>
            ) : (
              '一键配置'
            )}
          </Button>
        </Card>

        {/* 手动配置 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">手动配置</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="owner">GitHub 用户名</Label>
              <Input
                id="owner"
                value={config.owner}
                onChange={(e) => updateConfig({ owner: e.target.value })}
                placeholder="your-username"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="repo">仓库名</Label>
              {loadingRepos ? (
                <div className="flex items-center mt-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">加载中...</span>
                </div>
              ) : (
                <select
                  id="repo"
                  value={config.repo}
                  onChange={(e) => updateConfig({ repo: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="">选择仓库</option>
                  {repos.map((repo) => (
                    <option key={repo.full_name} value={repo.name}>
                      {repo.full_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <Label htmlFor="branch">分支</Label>
              <select
                id="branch"
                value={config.branch}
                onChange={(e) => updateConfig({ branch: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="directory">图片目录</Label>
              <Input
                id="directory"
                value={config.directory}
                onChange={(e) => updateConfig({ directory: e.target.value })}
                placeholder="images"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                留空表示上传到仓库根目录
              </p>
            </div>
          </div>

          <Button onClick={handleManualConfig} className="w-full mt-6">
            保存配置
          </Button>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建仓库列表 API**

Create `src/app/api/repos/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('token ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.substring(6)

  try {
    const response = await fetch('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 300 }, // 缓存 5 分钟
    })

    if (!response.ok) {
      throw new Error('Failed to fetch repos')
    }

    const repos = await response.json()
    return NextResponse.json(repos)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch repos' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: 创建分支列表 API**

Create `src/app/api/repos/[owner]/[repo]/branches/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('token ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.substring(6)
  const { owner, repo } = params

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch branches')
    }

    const branches = await response.json()
    return NextResponse.json(branches)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 4: 提交代码**

```bash
git add src/app/config/ src/app/api/repos/
git commit -m "feat: add config page with GitHub repo setup

- Implement manual config form (owner, repo, branch, directory)
- Add one-click auto-config feature
- Add API routes for fetching repos and branches
- Integrate with config store"
```

---

## 📤 阶段 3: 核心上传功能（Week 2）

### Task 9: 实现图片压缩工具函数

**Files:**
- Create: `src/lib/compress.ts`

**Interfaces:**
- Consumes: browser-image-compression library
- Produces: `compressImage` function

- [ ] **Step 1: 创建压缩工具函数**

Create `src/lib/compress.ts`:

```typescript
import imageCompression, { Options } from 'browser-image-compression'

export interface CompressionOptions extends Partial<Options> {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  fileType?: 'image/jpeg' | 'image/png' | 'image/webp'
  initialQuality?: number
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions: Options = {
    maxSizeMB: options.maxSizeMB ?? 1,
    maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
    useWebWorker: options.useWebWorker ?? true,
    fileType: options.fileType ?? 'image/jpeg',
    initialQuality: options.initialQuality ?? 0.8,
  }

  try {
    console.log(`Compressing ${file.name}...`)
    const compressedFile = await imageCompression(file, defaultOptions)

    const savings = ((file.size - compressedFile.size) / file.size) * 100
    console.log(`Compressed ${file.name}: ${file.size} → ${compressedFile.size} (${savings.toFixed(1)}% reduction)`)

    return compressedFile
  } catch (error) {
    console.error('Compression failed:', error)
    throw error
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
```

- [ ] **Step 2: 创建单元测试**

Create `src/__tests__/compress.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compressImage, formatFileSize } from '@/lib/compress'

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file: File, options: any) => {
    // 返回一个模拟的压缩后文件
    return new File(['compressed'], file.name, {
      type: options.fileType || 'image/jpeg',
      lastModified: Date.now(),
    })
  }),
}))

describe('compressImage', () => {
  it('should compress image with default options', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    const compressed = await compressImage(file)

    expect(compressed).toBeInstanceOf(File)
    expect(compressed.type).toBe('image/jpeg')
  })

  it('should compress image with custom options', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    const compressed = await compressImage(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1024,
      fileType: 'image/webp',
      initialQuality: 0.9,
    })

    expect(compressed.type).toBe('image/webp')
  })
})

describe('formatFileSize', () => {
  it('should format 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
  })

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
  })

  it('should format megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB')
  })

  it('should format gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB')
  })
})
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- src/__tests__/compress.test.ts
```

Expected: 所有测试通过

- [ ] **Step 4: 提交代码**

```bash
git add src/lib/compress.ts src/__tests__/compress.test.ts
git commit -m "feat: add image compression utility

- Implement compressImage with browser-image-compression
- Add formatFileSize helper
- Default compression: 1MB max, 1920px max, 80% quality
- Add unit tests"
```

---

### Task 10: 实现水印工具函数

**Files:**
- Create: `src/lib/watermark.ts`

- [ ] **Step 1: 创建水印工具函数**

Create `src/lib/watermark.ts`:

```typescript
export interface WatermarkOptions {
  text: string
  color?: string
  size?: number
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export async function addWatermark(
  file: File,
  options: WatermarkOptions
): Promise<Blob> {
  const {
    text,
    color = '#ffffff',
    size = 24,
    position = 'bottom-right',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      // 绘制原图
      ctx.drawImage(img, 0, 0)

      // 配置文字
      ctx.font = `bold ${size}px Arial`
      ctx.fillStyle = color
      ctx.textBaseline = 'middle'

      // 计算位置
      const padding = 20
      const textMetrics = ctx.measureText(text)
      const textWidth = textMetrics.width
      const textHeight = size

      let x: number, y: number

      switch (position) {
        case 'top-left':
          x = padding
          y = padding + textHeight / 2
          break
        case 'top-right':
          x = canvas.width - textWidth - padding
          y = padding + textHeight / 2
          break
        case 'bottom-left':
          x = padding
          y = canvas.height - padding - textHeight / 2
          break
        case 'bottom-right':
          x = canvas.width - textWidth - padding
          y = canvas.height - padding - textHeight / 2
          break
      }

      // 绘制阴影（增强可读性）
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // 绘制文字
      ctx.fillText(text, x, y)

      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        'image/jpeg',
        0.9
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}
```

- [ ] **Step 2: 创建单元测试**

Create `src/__tests__/watermark.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { addWatermark } from '@/lib/watermark'

describe('addWatermark', () => {
  beforeEach(() => {
    // 模拟 canvas API
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      font: '',
      fillStyle: '',
      textBaseline: '',
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    }))

    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      callback(new Blob([''], { type: 'image/jpeg' }))
    })
  })

  it('should add watermark with default options', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })

    // Mock Image
    const mockImg = {
      onload: null as Function | null,
      onerror: null as Function | null,
      width: 800,
      height: 600,
    }

    ;(global as any).Image = vi.fn(() => mockImg)

    // 模拟 URL.createObjectURL
    ;(global as any).URL.createObjectURL = vi.fn(() => 'blob:test')

    // 触发 onload
    URL.createObjectURL(file)
    ;(global as any).URL.createObjectURL = vi.fn()

    setTimeout(() => {
      if (mockImg.onload) mockImg.onload()
    }, 0)

    const blob = await addWatermark(file, { text: 'ImgX' })

    expect(blob).toBeInstanceOf(Blob)
  })

  it('should throw error on image load failure', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })

    const mockImg = {
      onload: null as Function | null,
      onerror: null as Function | null,
    }

    ;(global as any).Image = vi.fn(() => mockImg)

    setTimeout(() => {
      if (mockImg.onerror) mockImg.onerror(new Error('Load failed'))
    }, 0)

    await expect(addWatermark(file, { text: 'ImgX' })).rejects.toThrow()
  })
})
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- src/__tests__/watermark.test.ts
```

Expected: 所有测试通过

- [ ] **Step 4: 提交代码**

```bash
git add src/lib/watermark.ts src/__tests__/watermark.test.ts
git commit -m "feat: add watermark utility with position support

- Implement addWatermark with canvas-based text overlay
- Support 4 positions (top-left, top-right, bottom-left, bottom-right)
- Add customizable color, size
- Add shadow for better readability"
```

---

### Task 11: 实现链接生成器

**Files:**
- Create: `src/lib/link.ts`

- [ ] **Step 1: 创建链接生成器**

Create `src/lib/link.ts`:

```typescript
import type { LinkOptions } from '@/types/image'

export function generateLink(options: LinkOptions): string {
  const { format, cdn, owner, repo, branch, path, fileName, useRaw = false } = options

  // 生成基础 URL
  let baseUrl: string

  switch (cdn) {
    case 'github':
      if (useRaw) {
        baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
      } else {
        baseUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${path}`
      }
      break
    case 'jsdelivr':
      baseUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`
      break
    case 'github-pages':
      baseUrl = `https://${owner}.github.io/${repo}/${path}`
      break
    default:
      throw new Error(`Unsupported CDN: ${cdn}`)
  }

  // 根据格式生成链接
  switch (format) {
    case 'markdown':
      return `![${fileName}](${baseUrl})`
    case 'html':
      return `<img src="${baseUrl}" alt="${fileName}" />`
    case 'bbcode':
      return `[img]${baseUrl}[/img]`
    default:
      return baseUrl
  }
}

export function generateLinks(
  paths: string[],
  baseOptions: Omit<LinkOptions, 'path'>
): string[] {
  return paths.map((path) => {
    const fileName = path.split('/').pop() || path
    return generateLink({
      ...baseOptions,
      path,
      fileName,
    })
  })
}
```

- [ ] **Step 2: 创建单元测试**

Create `src/__tests__/link.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateLink, generateLinks } from '@/lib/link'

describe('generateLink', () => {
  const baseOptions = {
    owner: 'testuser',
    repo: 'test-repo',
    branch: 'main',
    path: 'images/photo.jpg',
    fileName: 'photo.jpg',
  }

  it('should generate GitHub raw link in markdown format', () => {
    const result = generateLink({
      ...baseOptions,
      format: 'markdown',
      cdn: 'github',
      useRaw: true,
    })

    expect(result).toBe('![photo.jpg](https://raw.githubusercontent.com/testuser/test-repo/main/images/photo.jpg)')
  })

  it('should generate GitHub blob link in markdown format', () => {
    const result = generateLink({
      ...baseOptions,
      format: 'markdown',
      cdn: 'github',
      useRaw: false,
    })

    expect(result).toBe('![photo.jpg](https://github.com/testuser/test-repo/blob/main/images/photo.jpg)')
  })

  it('should generate jsDelivr link', () => {
    const result = generateLink({
      ...baseOptions,
      format: 'markdown',
      cdn: 'jsdelivr',
    })

    expect(result).toBe('![photo.jpg](https://cdn.jsdelivr.net/gh/testuser/test-repo@main/images/photo.jpg)')
  })

  it('should generate HTML format', () => {
    const result = generateLink({
      ...baseOptions,
      format: 'html',
      cdn: 'github',
    })

    expect(result).toBe('<img src="https://github.com/testuser/test-repo/blob/main/images/photo.jpg" alt="photo.jpg" />')
  })

  it('should generate BBCode format', () => {
    const result = generateLink({
      ...baseOptions,
      format: 'bbcode',
      cdn: 'jsdelivr',
    })

    expect(result).toBe('[img]https://cdn.jsdelivr.net/gh/testuser/test-repo@main/images/photo.jpg[/img]')
  })
})

describe('generateLinks', () => {
  it('should generate multiple links', () => {
    const paths = ['images/photo1.jpg', 'images/photo2.jpg']
    const baseOptions = {
      owner: 'testuser',
      repo: 'test-repo',
      branch: 'main',
      format: 'markdown' as const,
      cdn: 'github' as const,
    }

    const results = generateLinks(paths, baseOptions)

    expect(results).toHaveLength(2)
    expect(results[0]).toContain('photo1.jpg')
    expect(results[1]).toContain('photo2.jpg')
  })
})
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- src/__tests__/link.test.ts
```

Expected: 所有测试通过

- [ ] **Step 4: 提交代码**

```bash
git add src/lib/link.ts src/__tests__/link.test.ts
git commit -m "feat: add link generator for multiple formats and CDNs

- Implement generateLink for markdown/html/bbcode
- Support GitHub raw, GitHub blob, jsDelivr CDNs
- Add generateLinks for batch generation
- Add comprehensive unit tests"
```

---

## 📤 阶段 4: 核心上传功能（Week 2）

### Task 12: 实现 Upload Store 和 Hook

**Files:**
- Create: `src/stores/uploadStore.ts`
- Create: `src/hooks/useUpload.ts`

**Interfaces:**
- Consumes: `UploadTask` type, `compressImage`, `addWatermark`, `GitHubAPI`
- Produces: `useUpload` hook with `addFiles`, `uploadQueue`, `isUploading`

- [ ] **Step 1: 创建 Upload Store**

Create `src/stores/uploadStore.ts`:

```typescript
import { create } from 'zustand'
import type { UploadTask } from '@/types/image'

interface UploadState {
  queue: UploadTask[]
  addTasks: (files: File[]) => void
  updateTask: (id: string, updates: Partial<UploadTask>) => void
  removeTask: (id: string) => void
  clearQueue: () => void
}

export const useUploadStore = create<UploadState>((set, get) => ({
  queue: [],

  addTasks: (files: File[]) => {
    const newTasks: UploadTask[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      progress: 0,
    }))
    set((state) => ({ queue: [...state.queue, ...newTasks] }))
  },

  updateTask: (id, updates) => {
    set((state) => ({
      queue: state.queue.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }))
  },

  removeTask: (id) => {
    set((state) => ({
      queue: state.queue.filter((task) => task.id !== id),
    }))
  },

  clearQueue: () => {
    set({ queue: [] })
  },
}))
```

- [ ] **Step 2: 创建 useUpload Hook**

Create `src/hooks/useUpload.ts`:

```typescript
'use client'

import { useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { compressImage } from '@/lib/compress'
import { addWatermark } from '@/lib/watermark'
import { useAuthStore } from '@/stores/authStore'
import { useConfigStore } from '@/stores/configStore'
import { useUploadStore } from '@/stores/uploadStore'
import { GitHubAPI } from '@/lib/github'
import { generateLink } from '@/lib/link'
import type { ImageFile, LinkOptions } from '@/types/image'

export function useUpload() {
  const token = useAuthStore((state) => state.token)
  const config = useConfigStore()
  const { addTasks, updateTask, removeTask } = useUploadStore()

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<{ file: ImageFile; link: string }> => {
      if (!token) {
        throw new Error('Not authenticated')
      }

      const api = new GitHubAPI(token, config.owner, config.repo)

      // 1. 压缩图片
      let processedFile = file
      if (config.compressionEnabled) {
        try {
          processedFile = await compressImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            initialQuality: config.compressionQuality / 100,
          })
        } catch (error) {
          console.error('Compression failed:', error)
          toast.error(`${file.name} 压缩失败，将上传原图`)
        }
      }

      // 2. 添加水印
      if (config.watermarkEnabled && config.watermarkText) {
        try {
          const watermarkedBlob = await addWatermark(processedFile, {
            text: config.watermarkText,
            color: config.watermarkColor,
            size: config.watermarkSize,
            position: config.watermarkPosition,
          })
          processedFile = new File([watermarkedBlob], file.name, {
            type: 'image/jpeg',
          })
        } catch (error) {
          console.error('Watermark failed:', error)
          toast.error(`${file.name} 水印添加失败`)
        }
      }

      // 3. 生成文件路径
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const ext = processedFile.name.split('.').pop()
      const fileName = `${timestamp}-${random}.${ext}`
      const filePath = config.directory ? `${config.directory}/${fileName}` : fileName

      // 4. 上传到 GitHub
      const result = await api.createOrUpdateFile(
        filePath,
        processedFile,
        `Upload ${fileName} via ImgX`
      )

      const imageFile: ImageFile = {
        id: result.sha,
        name: fileName,
        path: filePath,
        sha: result.sha,
        size: processedFile.size,
        url: `https://github.com/${config.owner}/${config.repo}/blob/${config.branch}/${filePath}`,
        html_url: `https://github.com/${config.owner}/${config.repo}/blob/${config.branch}/${filePath}`,
        download_url: `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${filePath}`,
        type: 'file',
        uploaded_at: new Date(),
      }

      // 5. 生成链接
      const linkOptions: LinkOptions = {
        format: 'markdown',
        cdn: 'github',
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        path: filePath,
        fileName: fileName,
        useRaw: true,
      }

      const link = generateLink(linkOptions)

      return { file: imageFile, link }
    },
    onSuccess: () => {
      toast.success('上传成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const addFiles = useCallback(
    (files: File[]) => {
      const { updateTask, removeTask } = useUploadStore.getState()

      // 添加到队列
      addTasks(files)

      // 逐个上传
      files.forEach((file) => {
        const taskId = Math.random().toString(36).substring(7)

        // 更新任务状态为上传中
        updateTask(taskId, { status: 'uploading', progress: 0 })

        uploadMutation.mutate(file, {
          onSuccess: (data) => {
            updateTask(taskId, {
              status: 'success',
              progress: 100,
              result: data.file,
            })
          },
          onError: (error) => {
            updateTask(taskId, {
              status: 'error',
              progress: 0,
              error: error.message,
            })
          },
        })
      })
    },
    [addTasks, updateTask, uploadMutation]
  )

  return {
    addFiles,
    uploadQueue: useUploadStore((state) => state.queue),
    isUploading: uploadMutation.isPending,
  }
}
```

- [ ] **Step 3: 提交代码**

```bash
git add src/stores/uploadStore.ts src/hooks/useUpload.ts
git commit -m "feat: add upload store and hook with full pipeline

- Implement upload queue management with Zustand
- Add useUpload hook with compression, watermark, upload
- Integrate with TanStack Query for mutation handling
- Support image processing pipeline (compress → watermark → upload)"
```

---

### Task 13: 实现上传页面

**Files:**
- Create: `src/app/upload/page.tsx`
- Create: `src/components/upload/UploadArea.tsx`
- Create: `src/components/upload/UploadQueue.tsx`

- [ ] **Step 1: 创建 UploadArea 组件**

Create `src/components/upload/UploadArea.tsx`:

```typescript
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function UploadArea({ onFilesSelected, disabled }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles)
      }
    },
    [onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: true,
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  })

  const handleClick = () => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    input?.click()
  }

  return (
    <div
      {...getRootProps()}
      onClick={handleClick}
      className={cn(
        'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
        isDragActive || isDragging
          ? 'border-primary bg-primary/5'
          : 'border-gray-300 hover:border-primary',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} disabled={disabled} />

      <div className="flex flex-col items-center">
        {isDragActive ? (
          <>
            <Upload className="mx-auto h-12 w-12 text-primary animate-bounce" />
            <p className="mt-4 text-lg font-semibold">松开以上传</p>
          </>
        ) : (
          <>
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg">拖拽图片到此处，或点击选择文件</p>
            <p className="text-sm text-gray-500 mt-2">
              支持 PNG、JPG、GIF、WebP 格式
            </p>
            <Button
              type="button"
              className="mt-4"
              disabled={disabled}
            >
              选择图片
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 UploadQueue 组件**

Create `src/components/upload/UploadQueue.tsx`:

```typescript
'use client'

import { CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { UploadTask } from '@/types/image'
import { formatFileSize } from '@/lib/compress'

interface UploadQueueProps {
  queue: UploadTask[]
  onRemove?: (id: string) => void
  onRetry?: (task: UploadTask) => void
}

export function UploadQueue({ queue, onRemove, onRetry }: UploadQueueProps) {
  if (queue.length === 0) return null

  return (
    <div className="space-y-2">
      {queue.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800"
        >
          {/* 状态图标 */}
          <div className="flex-shrink-0">
            {task.status === 'pending' && (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
            )}
            {task.status === 'uploading' && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            {task.status === 'success' && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {task.status === 'error' && (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>

          {/* 文件信息 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{task.file.name}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(task.file.size)}
              {task.status === 'uploading' && ` • ${task.progress}%`}
              {task.status === 'error' && task.error && ` • ${task.error}`}
            </p>
          </div>

          {/* 进度条 */}
          {task.status === 'uploading' && (
            <div className="flex-1 max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex-shrink-0 flex gap-2">
            {task.status === 'error' && onRetry && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRetry(task)}
              >
                重试
              </Button>
            )}
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: 创建上传页面**

Create `src/app/upload/page.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { useConfigStore } from '@/stores/configStore'
import { useUpload } from '@/hooks/useUpload'
import { UploadArea } from '@/components/upload/UploadArea'
import { UploadQueue } from '@/components/upload/UploadQueue'

export default function UploadPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { config } = useConfigStore()
  const { uploadQueue, addFiles } = useUpload()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // 检查配置是否完整
  const isConfigured = config.owner && config.repo && config.branch

  if (!isConfigured) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">请先配置图床</h2>
          <p className="text-gray-500 mb-4">
            在开始上传之前，需要先配置您的 GitHub 仓库
          </p>
          <Button onClick={() => router.push('/config')}>
            去配置
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">上传图片</h1>
        <p className="text-gray-500 mt-2">
          拖拽或选择图片上传到 {config.owner}/{config.repo}
        </p>
      </div>

      <Card className="p-8">
        <UploadArea onFilesSelected={addFiles} />

        {uploadQueue.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">上传队列</h2>
              <span className="text-sm text-gray-500">
                {uploadQueue.length} 个文件
              </span>
            </div>
            <UploadQueue
              queue={uploadQueue}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: 提交代码**

```bash
git add src/app/upload/ src/components/upload/
git commit -m "feat: implement upload page with drag-and-drop

- Add UploadArea component with react-dropzone
- Add UploadQueue component with progress tracking
- Implement upload page with config check
- Integrate useUpload hook with compression and watermark"
```

---

## 🎯 阶段总结

到目前已完成：
- ✅ 项目初始化和基础配置
- ✅ 认证模块（OAuth + Token）
- ✅ 配置模块（仓库/分支选择）
- ✅ 上传模块（拖拽上传、压缩、水印）
- ✅ 链接生成

**接下来**：
- 阶段 4: 图片管理（Week 3）
- 阶段 5: 工具箱（Week 3）
- 阶段 6: 设置与优化（Week 4）

---

## 📝 开发检查清单

### 每个任务完成后检查：

- [ ] 代码符合 TypeScript 严格模式
- [ ] 所有测试通过（`npm test`）
- [ ] ESLint 无错误（`npm run lint`）
- [ ] 构建成功（`npm run build`）
- [ ] 提交信息符合规范（`feat:`/`fix:`/`docs:`）
- [ ] 代码已 review

### 里程碑检查：

- [ ] **M2 - MVP 完成（Week 2-3）**: OAuth 登录、图片上传、链接生成
- [ ] **M3 - 功能完善（Week 4）**: 工具箱、管理功能
- [ ] **M4 - 上线发布（Week 5）**: 测试完成、正式上线

---

**计划完成！** 下一阶段将实现图片管理和工具箱功能。
