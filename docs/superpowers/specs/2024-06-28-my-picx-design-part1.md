# MyPicX - 图床产品技术设计文档（Part 1）

## 📋 文档信息

- **项目名称**: MyPicX
- **版本**: V1.0 MVP
- **目标用户**: 个人开发者、博主
- **技术栈**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **创建日期**: 2024-06-28

---

## 🎯 产品定位

基于 PicX 架构参考，从零打造的个人图床产品。核心价值：**简单、快速、专注于上传图片并生成 Markdown 链接**。

### 核心理念
- ✅ **专注核心场景**：上传图片 → 生成 Markdown 链接
- ✅ **开发者优先**：GitHub 存储、API 友好、开源精神
- ✅ **零成本运营**：Vercel 部署 + GitHub 存储 + jsDelivr CDN
- ✅ **现代化体验**：深色模式、拖拽上传、实时预览

---

## 🏗️ 技术架构

### 技术栈选型

| 层级 | 技术 | 版本 | 理由 |
|------|------|------|------|
| **框架** | Next.js | 14.2+ | App Router、Vercel 原生支持、API Routes |
| **UI** | React | 18.2+ | Concurrent Mode、Suspense |
| **语言** | TypeScript | 5.4+ | 严格模式、类型安全 |
| **样式** | Tailwind CSS | 3.4+ | 原子化 CSS、开发效率高 |
| **组件库** | shadcn/ui | latest | Radix UI 基础、可定制、无障碍 |
| **状态管理** | Zustand | 4.5+ | 轻量、无样板代码 |
| **服务端状态** | TanStack Query | 5.25+ | 缓存、同步、自动重试 |
| **HTTP 客户端** | axios | 1.6+ | 拦截器、请求取消 |
| **图片压缩** | browser-image-compression | 2.0+ | 浏览器端压缩、支持 WebP |
| **水印处理** | fabric | 5.3+ | Canvas 操作、图片叠加 |
| **日期处理** | date-fns | 3.6+ | 轻量、tree-shaking |
| **Toast 通知** | react-hot-toast | 2.4+ | 简单易用 |
| **拖拽上传** | react-dropzone | 14.2+ | 功能完整、类型友好 |
| **图标** | lucide-react | 0.378+ | 轻量、美观、Tree-shaking |
| **工具函数** | clsx + tailwind-merge | 2.1+ / 2.3+ | 动态 className |

---

## 📁 项目结构

```
my-picx/
├── .github/
│   └── workflows/
│       ├── deploy.yml          # Vercel 自动部署
│       └── test.yml            # 自动化测试
├── public/
│   ├── favicon.ico
│   ├── logo.png
│   └── sw.js                   # PWA Service Worker
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页（重定向到 /upload）
│   │   ├── login/              # 登录页
│   │   │   ├── page.tsx
│   │   │   └── token/page.tsx
│   │   ├── config/page.tsx     # 配置页
│   │   ├── upload/page.tsx     # 上传页
│   │   ├── management/page.tsx # 管理页
│   │   ├── tools/              # 工具箱
│   │   │   ├── compress/page.tsx
│   │   │   ├── watermark/page.tsx
│   │   │   └── base64/page.tsx
│   │   ├── settings/page.tsx   # 设置页
│   │   └── api/                # API Routes
│   │       ├── auth/callback/route.ts
│   │       └── auth/user/route.ts
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件
│   │   ├── layout/             # 布局组件
│   │   ├── upload/             # 上传组件
│   │   └── image/              # 图片组件
│   ├── lib/                    # 工具库
│   │   ├── github.ts           # GitHub API 封装
│   │   ├── compress.ts
│   │   ├── watermark.ts
│   │   ├── base64.ts
│   │   └── utils.ts
│   ├── stores/                 # Zustand Stores
│   │   ├── authStore.ts
│   │   ├── configStore.ts
│   │   └── uploadStore.ts
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useUpload.ts
│   │   └── useTheme.ts
│   ├── types/                  # TypeScript 类型
│   │   ├── auth.ts
│   │   ├── image.ts
│   │   └── config.ts
│   └── styles/                 # 样式文件
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

---

## 💾 数据存储设计

### 本地存储结构

```typescript
// localStorage 存储结构
interface Storage {
  'auth-storage': {
    token: string
    user: User | null
    isAuthenticated: boolean
  }

  'config-storage': {
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
    theme: 'light' | 'dark' | 'system'
  }
}
```

### Zustand + Persist

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token) => set({ token, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
)
```

---

## 🔐 认证模块设计

### OAuth 流程

```
用户点击登录 → 跳转 GitHub 授权 → 回调获取 code → 换取 token → 保存到 localStorage
```

### OAuth 回调处理

**文件**: `src/app/api/auth/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/login?error=access_denied', request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
  }

  try {
    // 换取 access_token
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
      return NextResponse.redirect(new URL(`/login?error=${tokenData.error}`, request.url))
    }

    // 获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${tokenData.access_token}` },
    })

    const userData = await userResponse.json()

    // 重定向回首页，带上 token
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('token', tokenData.access_token)
    redirectUrl.searchParams.set('user', JSON.stringify(userData))

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}
```

---

## 🔧 核心模块设计

### GitHub API 封装

```typescript
import axios from 'axios'

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

class GitHubAPI {
  private client: axios.AxiosInstance

  constructor(token: string) {
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })
  }

  // 创建仓库
  async createRepo(name: string, description: string, private: boolean = false) {
    const response = await this.client.post('/user/repos', {
      name,
      description,
      private,
      auto_init: true,
    })
    return response.data
  }

  // 获取仓库内容
  async getContents(path: string, ref?: string) {
    const response = await this.client.get(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      params: { ref },
    })
    return response.data
  }

  // 上传文件
  async uploadFile(filePath: string, content: string, message: string, sha?: string) {
    const response = await this.client.put(`/repos/${this.owner}/${this.repo}/contents/${filePath}`, {
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    })
    return response.data
  }

  // 删除文件
  async deleteFile(filePath: string, message: string, sha: string) {
    const response = await this.client.delete(`/repos/${this.owner}/${this.repo}/contents/${filePath}`, {
      data: { message, sha },
    })
    return response.data
  }

  // 列出目录
  async listDirectory(path: string = '') {
    const data = await this.getContents(path)
    return Array.isArray(data) ? data : []
  }

  // 创建或更新文件
  async createOrUpdateFile(
    filePath: string,
    content: string | Blob,
    message: string
  ) {
    // 检查文件是否存在
    let sha: string | undefined
    try {
      const existing = await this.getContents(filePath)
      sha = existing.sha
    } catch {
      // 文件不存在，创建新文件
    }

    // 处理 Blob 内容
    const contentBase64 = content instanceof Blob
      ? await this.blobToBase64(content)
      : Buffer.from(content).toString('base64')

    return this.uploadFile(filePath, contentBase64, message, sha)
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
```

---

## 🖼️ 图片处理模块

### 图片压缩

```typescript
import imageCompression, { Options } from 'browser-image-compression'

export async function compressImage(
  file: File,
  options: Partial<Options> = {}
): Promise<File> {
  const defaultOptions: Options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.8,
    ...options,
  }

  try {
    const compressedFile = await imageCompression(file, defaultOptions)
    return compressedFile
  } catch (error) {
    console.error('Compression failed:', error)
    throw error
  }
}
```

### 水印处理

```typescript
import { Canvas, CanvasRenderingContext2D } from 'fabric'

export async function addWatermark(
  file: File,
  text: string,
  options: {
    color?: string
    size?: number
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  } = {}
): Promise<Blob> {
  const {
    color = '#ffffff',
    size = 24,
    position = 'bottom-right',
  } = options

  const image = await createImageBitmap(file)

  // 创建 Canvas
  const canvas = new Canvas({
    width: image.width,
    height: image.height,
  })

  const ctx = canvas.getContext('2d')!

  // 绘制原图
  ctx.drawImage(image, 0, 0)

  // 配置文字样式
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

  // 绘制文字（带阴影增强可读性）
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.fillText(text, x, y)

  // 转换为 Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      },
      'image/jpeg',
      0.9
    )
  })

  // 释放资源
  canvas.dispose()

  return blob
}
```

### Base64 转换

```typescript
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function filesToBase64(files: File[]): Promise<string[]> {
  return Promise.all(files.map(fileToBase64))
}
```

---

## 🔗 链接生成模块

### 链接生成器

```typescript
export type LinkFormat = 'markdown' | 'html' | 'bbcode'
export type CDNType = 'github' | 'jsdelivr' | 'github-pages'

export interface LinkOptions {
  format: LinkFormat
  cdn: CDNType
  owner: string
  repo: string
  branch: string
  path: string
  fileName: string
  useRaw?: boolean
}

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
```

---

## 🚨 错误处理策略

### 统一错误处理 Hook

```typescript
import { useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface ApiError {
  message: string
  status?: number
}

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, context: string) => {
    console.error(`${context} error:`, error)

    let message = '发生未知错误'

    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError
      message = apiError?.message || error.message
    } else if (error instanceof Error) {
      message = error.message
    }

    toast.error(`${context}失败: ${message}`)
  }, [])

  return { handleError }
}
```

### API 请求封装

```typescript
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
    })

      // 请求拦截器
      this.client.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
          // 添加认证 token
          const token = getAuthToken()
          if (token) {
            config.headers.Authorization = `token ${token}`
          }
          return config
        },
        (error) => Promise.reject(error)
      )

      // 响应拦截器
      this.client.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
          if (error.response?.status === 401) {
            // Token 过期，清除登录状态
            clearAuthToken()
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }
      )
    }
  }

  async get<T>(url: string, config?: any): Promise<T>
  async post<T>(url: string, data?: any, config?: any): Promise<T>
  async put<T>(url: string, data?: any, config?: any): Promise<T>
  async delete<T>(url: string, config?: any): Promise<T>
}

export const apiClient = new ApiClient()
```

---

## 🎨 组件设计规范

### shadcn/ui 组件使用原则

1. **优先使用 shadcn/ui** 组件，保持一致性
2. **自定义样式**通过 Tailwind CSS 类名
3. **组件变体**通过 `cn()` 工具函数组合

```typescript
import { cn } from '@/lib/utils'

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        className
      )}
      {...props}
    />
  )
}
```

### 主要页面组件

#### 登录页（`src/app/login/page.tsx`）

```typescript
'use client'

import { GitHubLogo, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const handleGitHubLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/auth/callback`
    const scope = 'public_repo repo'

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">MyPicX</h1>
          <p className="text-gray-500 mt-2">个人图床管理工具</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGitHubLogin}
            className="w-full"
            variant="outline"
          >
            <GitHubLogo className="mr-2 h-5 w-5" />
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
            onClick={() => window.location.href = '/login/token'}
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

#### 上传页（`src/app/upload/page.tsx`）

```typescript
'use client'

import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { useUpload } from '@/hooks/useUpload'
import { UploadQueue } from '@/components/upload/UploadQueue'

export default function UploadPage() {
  const { uploadQueue, addFiles, isUploading } = useUpload()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: addFiles,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: true,
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">上传图片</h1>
        <p className="text-gray-500 mt-2">拖拽或选择图片上传到 GitHub</p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-lg">
          {isDragActive
            ? '松开鼠标上传'
            : '拖拽图片到此处，或点击选择文件'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          支持 PNG、JPG、GIF、WebP 格式
        </p>
      </div>

      {uploadQueue.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">上传队列</h2>
          <UploadQueue queue={uploadQueue} />
        </div>
      )}
    </div>
  )
}
```

---

## 🔄 核心流程设计

### 上传流程

```
1. 用户选择/拖拽图片
   ↓
2. 图片压缩（可选）
   ↓
3. 添加水印（可选）
   ↓
4. 生成文件名（时间戳 + 哈希）
   ↓
5. 上传到 GitHub
   ↓
6. 生成链接（GitHub + jsDelivr）
   ↓
7. 复制 Markdown 链接
```

### 文件命名规则

```typescript
export function generateFileName(
  originalName: string,
  prefix?: string,
  addHash: boolean = true
): string {
  const ext = originalName.split('.').pop()
  const timestamp = Date.now()
  const hash = addHash ? Math.random().toString(36).substring(2, 8) : ''

  const parts = [prefix, timestamp, hash].filter(Boolean)
  return `${parts.join('-')}.${ext}`
}
```

---

## 🌐 国际化（预留）

虽然第一版只有中文，但预留 i18n 结构：

```typescript
// src/locales/zh-CN.ts
export const zhCN = {
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
  },
  upload: {
    title: '上传图片',
    dragDrop: '拖拽图片到此处',
    uploading: '上传中...',
    success: '上传成功',
    failed: '上传失败',
  },
}

// 使用
import { useTranslation } from 'react-i18next'

function UploadPage() {
  const { t } = useTranslation()
  return <h1>{t('upload.title')}</h1>
}
```

---

## ✅ 测试策略

### 单元测试（Vitest）

```typescript
// src/__tests__/link.test.ts
import { describe, it, expect } from 'vitest'
import { generateLink } from '@/lib/link'

describe('generateLink', () => {
  it('should generate markdown link', () => {
    const result = generateLink({
      format: 'markdown',
      cdn: 'github',
      owner: 'user',
      repo: 'repo',
      branch: 'main',
      path: 'images/photo.jpg',
      fileName: 'photo.jpg',
    })

    expect(result).toBe('![photo.jpg](https://github.com/user/repo/blob/main/images/photo.jpg)')
  })

  it('should generate jsdelivr link', () => {
    const result = generateLink({
      format: 'markdown',
      cdn: 'jsdelivr',
      owner: 'user',
      repo: 'repo',
      branch: 'main',
      path: 'images/photo.jpg',
      fileName: 'photo.jpg',
    })

    expect(result).toBe('![photo.jpg](https://cdn.jsdelivr.net/gh/user/repo@main/images/photo.jpg)')
  })
})
```

### E2E 测试（Playwright）

```typescript
// tests/e2e/upload.spec.ts
import { test, expect } from '@playwright/test'

test('should upload an image', async ({ page }) => {
  await page.goto('http://localhost:3000/login')

  // 点击 GitHub 登录
  await page.click('button:has-text("使用 GitHub 登录")')

  // 验证重定向到上传页
  await expect(page).toHaveURL('http://localhost:3000/upload')
})
```

---

## 🚀 部署配置

### Vercel 配置（`vercel.json`）

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "GITHUB_CLIENT_ID": "@github_client_id",
    "GITHUB_CLIENT_SECRET": "@github_client_secret"
  }
}
```

### GitHub Actions 自动部署（`.github/workflows/deploy.yml`）

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🔐 安全考虑

### Token 存储

- ✅ 使用 localStorage（简单项目足够）
- ⚠️ 生产环境建议加密存储
- ❌ 不要硬编码 token 在前端

### OAuth 安全

- ✅ HTTPS 必须
- ✅ State 参数防止 CSRF
- ✅ Token 不通过 URL 传递（实际应该加密）

### GitHub API 权限

```json
// .env.example
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
```

---

## 📊 性能优化

### 图片优化

- 使用 Next.js `next/image` 组件
- 自动 WebP/AVIF 转换
- 懒加载
- 响应式图片

### 代码分割

- 路由级代码分割（Next.js 自动）
- 组件懒加载
- 动态导入

### 缓存策略

- TanStack Query 缓存 API 请求
- Service Worker 缓存静态资源
- GitHub API 响应缓存

---

## 📝 开发规范

### 代码风格

- ✅ TypeScript 严格模式
- ✅ ESLint + Prettier
- ✅ 2 空格缩进
- ✅ 函数组件 + Hooks
- ✅ 命名规范：
  - 组件：PascalCase
  - 函数/变量：camelCase
  - 常量：UPPER_SNAKE_CASE

### Git 提交规范

```
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

---

## 🎯 里程碑

### M1 - 项目初始化（第 1 天）
- [x] 项目结构创建
- [x] 技术栈配置
- [x] 开发环境就绪

### M2 - MVP 完成（Week 2-3）
- [ ] OAuth 登录可用
- [ ] 图片上传可用
- [ ] 链接生成可用
- [ ] 部署到 Vercel

### M3 - 功能完善（Week 4）
- [ ] 工具箱完成
- [ ] 管理功能完成
- [ ] 设置页面完成

### M4 - 上线发布（Week 5）
- [ ] 测试完成
- [ ] Bug 修复
- [ ] 正式上线

---

## 📚 参考资源

### PicX 项目
- GitHub: https://github.com/topics/picx

### 文档
- [Next.js 文档](https://nextjs.org/docs)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [GitHub API 文档](https://docs.github.com/en/rest)
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)

### 工具
- [Fabric.js](http://fabricjs.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)

---

**设计文档完成！** 🎉

下一步：进入实现阶段，开始编写代码。
