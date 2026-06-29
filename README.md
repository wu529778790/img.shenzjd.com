# ImgX

现代化图床管理工具，使用 GitHub 作为存储后端。

## 🚀 快速部署

### Vercel（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?https://github.com/wu529778790/img.shenzjd.com)

部署后配置环境变量：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`

### Docker

```bash
docker run -d -p 3000:3000 \
  -e GITHUB_CLIENT_ID=xxx \
  -e GITHUB_CLIENT_SECRET=<SECRET_3e7bd818>  \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  -e NEXTAUTH_URL=http://localhost:3000 \
  ghcr.io/wu529778790/img.shenzjd.com:latest
```

## ✨ 功能

- 🔐 GitHub OAuth 登录
- 📤 拖拽上传图片
- 🗜️ 自动压缩 & 水印
- 🔗 Markdown / HTML / BBCode 链接
- 🌐 CDN 加速（jsDelivr / jsDMirror）
- 📊 图片管理（网格/列表视图）
- 🌓 深色模式

## ⚙️ 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App Client Secret |
| `NEXTAUTH_SECRET` | ✅ | NextAuth 密钥（`openssl rand -base64 32`） |
| `NEXTAUTH_URL` | ✅ | 应用地址（如 `https://img.example.com`） |

## 📖 使用教程

详细使用教程（包含 PicGo 配置、GitHub 图床搭建等）：[USAGE.md](USAGE.md)
