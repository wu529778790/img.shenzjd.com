# 统一登录入口实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除登录流程中的重复点击，实现一步登录，统一管理所有需要登录的页面

**Architecture:** 通过 Next.js Middleware 实现未登录拦截，移除各页面中的"去登录"按钮，让 `/login` 成为唯一登录入口

**Tech Stack:** Next.js, NextAuth, TypeScript, React

## Global Constraints

- 使用 NextAuth 的 `withAuth` middleware 进行路由保护
- 保持现有组件结构和样式体系（Tailwind CSS, shadcn/ui）
- 不改变 `/login` 页面的现有功能
- 确保已登录用户不受影响

---

### Task 1: 创建 Middleware 实现未登录拦截

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: NextAuth middleware API
- Produces: 全局路由拦截逻辑

- [ ] **Step 1: 创建 middleware.ts 文件**

创建 `src/middleware.ts`：

```typescript
import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: ['/management/:path*', '/settings/:path*']
}
```

- [ ] **Step 2: 验证 middleware 语法正确**

运行类型检查：
```bash
npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 3: 提交更改**

```bash
git add src/middleware.ts
git commit -m "feat: add middleware for auth route protection"
```

---

### Task 2: 移除 Management 页面的登录按钮

**Files:**
- Modify: `src/app/management/page.tsx:48-77`

**Interfaces:**
- Consumes: 现有的登录提示 UI 结构
- Produces: 移除了按钮的登录提示卡片

- [ ] **Step 1: 修改 management 页面，移除登录按钮**

将登录提示卡片从：
```typescript
if (!session) {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageTransition>
        <CardAnimation className="max-w-md mx-auto p-8 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6"
          >
            <Lock className="h-10 w-10 text-gray-400" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
            需要登录
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            登录后才能管理图片
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => router.push('/login')} size="lg">
              去登录
            </Button>
          </motion.div>
        </CardAnimation>
      </PageTransition>
    </div>
  )
}
```

改为：
```typescript
if (!session) {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageTransition>
        <CardAnimation className="max-w-md mx-auto p-8 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6"
          >
            <Lock className="h-10 w-10 text-gray-400" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
            需要登录
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            登录后才能管理图片
          </p>
          <p className="text-sm text-gray-400">
            请先登录以继续
          </p>
        </CardAnimation>
      </PageTransition>
    </div>
  )
}
```

- [ ] **Step 2: 确认修改后页面正常显示**

运行开发服务器：
```bash
npm run dev
```
访问 `http://localhost:3000/management`，确认：
- 未登录时显示提示卡片（无按钮）
- 已登录时正常显示管理页面

- [ ] **Step 3: 提交更改**

```bash
git add src/app/management/page.tsx
git commit -m "refactor: remove login button from management page"
```

---

### Task 3: 移除 Settings 页面的登录按钮

**Files:**
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: 现有的登录提示 UI 结构
- Produces: 移除了按钮的登录提示卡片

- [ ] **Step 1: 修改 settings 页面，移除登录按钮**

找到登录提示卡片部分，将：
```typescript
<Button onClick={() => router.push('/login')} size="lg">
  去登录
</Button>
```

替换为：
```typescript
<p className="text-sm text-gray-400">
  请先登录以继续
</p>
```

- [ ] **Step 2: 确认修改后页面正常显示**

访问 `http://localhost:3000/settings`，确认：
- 未登录时显示提示卡片（无按钮）
- 已登录时正常显示设置页面

- [ ] **Step 3: 提交更改**

```bash
git add src/app/settings/page.tsx
git commit -m "refactor: remove login button from settings page"
```

---

### Task 4: 测试完整登录流程

**Files:**
- Test: 手动测试所有相关页面

**Interfaces:**
- Consumes: 所有修改后的页面和 middleware
- Produces: 验证登录流程正常工作

- [ ] **Step 1: 测试未登录访问受保护页面**

1. 清除浏览器缓存和 cookies（确保未登录状态）
2. 访问 `http://localhost:3000/management`
   - Expected: 自动重定向到 `/login`
3. 访问 `http://localhost:3000/settings`
   - Expected: 自动重定向到 `/login`

- [ ] **Step 2: 测试登录流程**

1. 在 `/login` 页面点击"使用 GitHub 登录"
2. 完成 GitHub OAuth 授权
3. Expected: 登录成功后重定向到 `/upload`（默认首页）

- [ ] **Step 3: 测试已登录访问受保护页面**

1. 登录状态下访问 `http://localhost:3000/management`
   - Expected: 正常显示管理页面
2. 访问 `http://localhost:3000/settings`
   - Expected: 正常显示设置页面

- [ ] **Step 4: 测试退出登录**

1. 在 Header 用户菜单中点击"退出登录"
2. Expected: 退出后跳转到 `/login`，再次访问受保护页面会被拦截

- [ ] **Step 5: 提交测试结果**

```bash
git add -A
git commit -m "test: verify unified login flow works correctly"
```

---

## 实现后检查清单

- [ ] `/login` 页面是唯一的登录入口
- [ ] `/management` 页面移除了登录按钮
- [ ] `/settings` 页面移除了登录按钮
- [ ] Middleware 正确拦截未登录访问
- [ ] 登录流程一步完成（点击 GitHub 登录 → 授权 → 完成）
- [ ] 已登录用户访问正常
- [ ] 退出登录后正确跳转到 `/login`
