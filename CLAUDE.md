# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (localhost:3000)
pnpm dev

# Type checking
pnpm typecheck

# Production build
pnpm build

# Preview production build
pnpm preview
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `GITHUB_CLIENT_ID` - From GitHub OAuth App settings
- `GITHUB_CLIENT_SECRET` - From GitHub OAuth App settings
- `JWT_SECRET` - Strong random secret for token signing

GitHub OAuth App callback URL: `http://localhost:3000/api/auth/callback`

## Architecture Overview

This is a **Nuxt 4 SSR application** with GitHub OAuth authentication. Users store images in their own GitHub repositories.

### Authentication Flow

1. User clicks "Login with GitHub" → redirects to `/api/auth/github`
2. GitHub OAuth flow → callback to `/api/auth/callback`
3. Server exchanges code for access_token, gets user info, generates JWT
4. JWT stored in HTTP-only cookie (`auth_token`)
5. All API routes (except auth endpoints) protected by server middleware

**Key files:**
- `server/middleware/auth.ts` - Auth middleware for protected routes
- `server/utils/jwt.ts` - JWT generation/verification using `jose`
- `server/utils/github.ts` - GitHub API wrapper using `ofetch`

### Data Storage Model

User configuration stored in their GitHub repo at `.image-hosting/config.json`:

```typescript
interface StorageConfig {
  repository: { owner, name, branch }
  directory: { mode, path, autoPattern }
  naming: { strategy, prefix, suffix }
  image: { autoCompress, compressionQuality, maxWidth, maxHeight, watermark }
  links: { format, cdn, customDomain }
}
```

### Server API Structure

```
server/api/
├── auth/          # GitHub OAuth flow (github.get.ts, callback.get.ts, logout.post.ts, verify.get.ts)
├── user/          # User config (config.get.ts, config.put.ts)
├── repo/          # Repository management (list, create, init, branches, contents)
├── upload/        # Image upload (image.put.ts, batch.post.ts)
└── management/    # File management (list, delete, rename)
```

All protected routes receive `event.context.auth` with user data from JWT.

### State Management (Pinia Stores)

- `stores/auth.ts` - Authentication state, `initAuth()` restores from cookie
- `stores/config.ts` - Storage configuration
- `stores/upload.ts` - Upload queue/progress
- `stores/management.ts` - File list/management
- `stores/toast.ts` - Notification system

### Internationalization

3 languages: `zh-CN`, `zh-TW`, `en`. Locale files in `locales/`. Uses `@nuxtjs/i18n` with prefix strategy (default: `zh-CN`).

### Styling

- **Tailwind CSS** - Utility classes, config in `tailwind.config.ts`
- **Element Plus** - UI components, dark theme enabled in `nuxt.config.ts`

## Important Constraints

1. **Never expose `GITHUB_CLIENT_SECRET` to client code** - server-side only via `runtimeConfig`
2. **TypeScript strict mode disabled** - project uses loose typing (`strict: false` in nuxt.config.ts)
3. **Server routes must use `getTokenFromCookie()` or `getTokenFromHeader()`** - from `server/utils/jwt.ts`
4. **All GitHub API calls go through `server/utils/github.ts`** - uses `ofetch` with Bearer auth
5. **JWT expires in 7 days** - hardcoded in `generateToken()`

## Common Patterns

### Creating a protected API endpoint:

```typescript
// server/api/some-route.get.ts
export default defineEventHandler(async (event) => {
  const auth = event.context.auth  // { id, login, email, avatarUrl }
  // ... your logic
})
```

### Making authenticated API calls from client:

```typescript
// JWT automatically sent via cookie
const data = await $fetch('/api/user/config')
```

### GitHub API calls from server:

```typescript
import { createGitHubFetcher } from '~/server/utils/github'

const fetcher = createGitHubFetcher(accessToken)
const repos = await fetcher('/user/repos?per_page=100')
```
