# 部署指南 - 图床应用 (Nuxt 4 + GitHub OAuth)

## 📋 部署前准备

### 1. GitHub OAuth App 配置

访问: https://github.com/settings/developers → New OAuth App

**配置参数:**
- **Application name**: `Image Hosting` (自定义)
- **Homepage URL**: `https://your-domain.com` (生产环境)
- **Authorization callback URL**: `https://your-domain.com/api/auth/callback`

**获取凭证:**
- Client ID
- Client Secret (点击 "Generate a new client secret")

### 2. 环境变量配置

创建 `.env` 文件:

```env
# GitHub OAuth (必需)
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here

# JWT Secret (必需 - 生产环境请使用安全的随机字符串)
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# 可选: 自定义 OAuth 回调 URL
# NUXT_PUBLIC_OAUTH_REDIRECT_URL=https://your-domain.com/api/auth/callback
```

**安全提示:**
- ❌ 不要提交 `.env` 到 Git
- ✅ 使用强随机字符串作为 JWT_SECRET
- ✅ 生产环境使用 HTTPS

## 🚀 部署选项

### 选项 1: Node.js 服务器 (推荐)

```bash
# 1. 构建项目
pnpm build

# 2. 启动生产服务器
pnpm preview

# 或者直接运行
node .output/server/index.mjs
```

**PM2 部署:**
```bash
# 安装 PM2
npm install -g pm2

# 使用 PM2 启动
pm2 start .output/server/index.mjs --name "img-hosting"

# 保存配置
pm2 save
pm2 startup
```

### 选项 2: Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制依赖
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", ".output/server/index.mjs"]
```

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  img-hosting:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
```

运行:
```bash
docker-compose up -d
```

### 选项 3: Vercel 部署

1. 安装 Vercel CLI: `npm i -g vercel`
2. 登录: `vercel login`
3. 部署: `vercel`

或连接 GitHub 仓库在 Vercel 网站上自动部署。

**Vercel 配置:**
- Framework Preset: `Nuxt`
- Build Command: `pnpm build`
- Output Directory: `.output`

**环境变量 (Vercel Dashboard → Settings → Environment Variables):**
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET`

### 选项 4: Netlify 部署

1. 连接 GitHub 仓库
2. 构建设置:
   - Build command: `pnpm build`
   - Publish directory: `.output/public`
3. 添加环境变量

### 选项 5: 服务器部署 (Nginx + PM2)

**Nginx 配置** (`/etc/nginx/sites-available/img-hosting`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/img-hosting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 HTTPS 配置

使用 Let's Encrypt (Certbot):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

自动续期:
```bash
sudo systemctl enable certbot.timer
```

## 🎯 生产环境检查清单

- [ ] 设置 `.env` 环境变量
- [ ] 配置 GitHub OAuth App
- [ ] 使用 HTTPS
- [ ] 设置反向代理 (Nginx/Apache)
- [ ] 配置 PM2 或 Docker
- [ ] 设置日志监控
- [ ] 配置备份策略
- [ ] 设置错误监控 (可选)
- [ ] 配置域名 DNS

## 🐛 常见问题

### 问题 1: OAuth 回调失败

**原因**: 回调 URL 配置错误
**解决**: 检查 GitHub OAuth App 的回调 URL 是否与部署域名一致

### 问题 2: JWT 验证失败

**原因**: JWT_SECRET 不一致
**解决**: 确保生产环境使用与开发相同的 JWT_SECRET

### 问题 3: GitHub API 限流

**原因**: 请求频率过高
**解决**: 实现请求缓存或等待限流重置

### 问题 4: 构建失败

**原因**: 依赖问题或 TypeScript 错误
**解决**:
```bash
rm -rf node_modules .nuxt .output
pnpm install
pnpm build
```

## 📊 监控与维护

### 日志查看
```bash
# PM2
pm2 logs img-hosting

# Docker
docker logs img-hosting

# 查看访问日志
tail -f /var/log/nginx/access.log
```

### 性能监控
```bash
# 服务器资源
htop

# Node.js 进程
pm2 monit
```

### 备份策略
```bash
# 备份环境变量
cp .env .env.backup

# 备份配置
tar -czf backup-$(date +%Y%m%d).tar.gz .env nuxt.config.ts
```

## 🔄 更新部署

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
pnpm install

# 重新构建
pnpm build

# 重启服务 (PM2)
pm2 restart img-hosting

# 或 Docker
docker-compose down && docker-compose up -d --build
```

## 📝 生产环境优化

### 1. TypeScript 严格模式

移除 `nuxt.config.ts` 中的临时配置:

```typescript
typescript: {
  typeCheck: true, // 启用类型检查
  tsConfig: {
    compilerOptions: {
      strict: true, // 启用严格模式
      // ... 其他严格选项
    }
  }
}
```

### 2. 安全加固

```typescript
// nuxt.config.ts
security: {
  headers: {
    crossOriginEmbedderPolicy: 'require-corp',
    contentSecurityPolicy: {
      'img-src': ["'self'", "data:", "https:"],
      // ...
    }
  }
}
```

### 3. 性能优化

- 启用图片压缩
- 配置 CDN
- 启用缓存策略

## 📞 技术支持

如有问题，请查看:
- `REFACTORING_PLAN.md` - 重构规划
- `BUILD_SUMMARY.md` - 构建总结
- GitHub Issues

---

**部署完成!** 🎉

你的图床应用已经准备好服务用户了！
