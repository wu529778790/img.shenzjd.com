# Docker 部署指南

## 🚀 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+ (可选)
- GitHub 仓库（已启用 GitHub Actions）

## 📦 镜像构建

### 自动构建（推荐）

推送到 `main` 分支会自动触发 GitHub Actions 构建镜像并发布到 GitHub Container Registry。

```bash
git push origin main
```

镜像地址：`ghcr.io/你的用户名/img.shenzjd.com:latest`

### 本地构建

```bash
# 克隆代码
git clone https://github.com/你的用户名/img.shenzjd.com.git
cd img.shenzjd.com

# 构建镜像
docker build -t imgx .

# 运行容器
docker run -d -p 3000:3000 imgx
```

## ⚙️ 配置

### 环境变量

所有配置通过环境变量注入，**无需修改代码**：

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App Client ID | `Iv1.xxxxxxxxxxxx` |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App Client Secret | `xxxxxxxxxxxx` |
| `NEXTAUTH_SECRET` | ✅ | NextAuth 加密密钥 | 运行 `openssl rand -base64 32` 生成 |
| `NEXTAUTH_URL` | ✅ | 应用访问地址 | `https://img.example.com` |
| `GITHUB_TOKEN` | ✅ | GitHub Personal Access Token | `ghp_xxxxxxxxxxxx` |
| `PORT` | ❌ | 服务端口 | `3000` (默认) |

### 创建 GitHub OAuth App

1. 访问 [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. 点击 **New OAuth App**
3. 填写信息：
   - **Application name**: `ImgX`
   - **Homepage URL**: `https://img.example.com`
   - **Authorization callback URL**: `https://img.example.com/api/auth/callback`
4. 生成 Client ID 和 Client Secret

### 创建 GitHub Personal Access Token

1. 访问 [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. 点击 **Generate new token**
3. 选择权限：
   - ✅ `repo` (Full control of private repositories)
4. 复制生成的 Token

### 使用 Docker Compose

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置
vim .env

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

## 🔧 高级配置

### 反向代理（Nginx 示例）

```nginx
server {
    listen 80;
    server_name img.example.com;

    # 重定向到 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name img.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 数据持久化

当前版本使用 GitHub 存储数据，无需本地持久化。如需持久化上传队列等临时数据：

```yaml
# docker-compose.yml
services:
  app:
    volumes:
      - ./data:/app/data
```

## 🚢 发布到 Docker Hub（可选）

如需发布到 Docker Hub，修改 `.github/workflows/docker.yml`：

```yaml
env:
  REGISTRY: docker.io
  IMAGE_NAME: yourusername/img.shenzjd.com

jobs:
  build-and-push:
    steps:
      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
```

然后在 GitHub Secrets 中添加：
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## 🐛 常见问题

### Q: 构建失败提示 `output: 'standalone'` 错误

**A:** 确保 `next.config.ts` 中包含 `output: 'standalone'` 配置。

### Q: 启动后无法访问

**A:** 检查以下几点：
1. 容器是否正常运行：`docker ps`
2. 日志是否有错误：`docker logs imgx-app`
3. 环境变量是否正确配置
4. 端口映射是否正确：`docker port imgx-app`

### Q: GitHub 登录失败

**A:** 检查环境变量：
- `NEXTAUTH_URL` 是否与实际访问地址一致
- `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` 是否正确
- GitHub OAuth App 的回调地址是否匹配

## 📝 更新日志

### 2025-06-29

- ✅ 添加 Docker 镜像打包支持
- ✅ 自动发布到 GitHub Container Registry
- ✅ 添加 Docker Compose 配置
- ✅ 优化 Dockerfile 多阶段构建，减小镜像体积
