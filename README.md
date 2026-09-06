# 🚀 img.shenzjd.com

> 基于 GitHub 的现代化图床 — 微信扫码即可登录，GitHub App 免密托管，拖拽上传、自动压缩、水印保护、多 CDN 加速。

👉 **立即体验：[img.shenzjd.com](https://img.shenzjd.com/)** — 打开即用，无需注册账号

---

## ✨ 功能特性

- 🔑 **微信登录** — 小程序 / 公众号双方式扫码验证，无需注册，凭证由 [wx-auth](https://wx-auth.shenzjd.com) 统一托管
- 🤖 **GitHub App 免密托管** — 不需要创建任何 Personal Access Token：绑定 GitHub 账号并安装 App 后自动初始化图床仓库，短命 installation token（8 小时）只在内存中流转，永不落盘
- 🖼️ **拖拽上传** — 拖拽、点击、`Ctrl/Cmd+V` 粘贴，支持批量
- 🗜️ **自动压缩** — 上传前智能压缩；可选 WebP 转换（默认关闭，SVG/GIF 始终保留原格式）
- 🎨 **水印保护** — 自定义文字水印，默认带上你的站点名
- 📁 **图片管理** — 在线浏览、搜索、按目录筛选、单张/批量删除
- 🌐 **多 CDN 加速** — GitHub Raw / jsDelivr / jsDMirror / GitHub Pages，国内直连可用
- 🔗 **多格式复制** — Markdown / HTML / BBCode / 纯链接，上传完成自动复制
- ☁️ **配置云同步** — 压缩、水印、CDN 等偏好跟随账号走，换设备无缝衔接
- ⚙️ **分支 / 目录可配置** — 数据分支自由切换，上传目录下拉选择或新建
- 📱 **PWA** — 可安装到桌面 / 主屏幕，断网时友好提示

---

## 🎯 快速开始

打开 [img.shenzjd.com](https://img.shenzjd.com/)，三步开始：

1. **登录** — 点击右上角头像，微信扫码验证
2. **绑定 GitHub** — 首次上传时自动引导：授权账号 → 安装 GitHub App → 自动创建图床仓库（`<你的用户名>/img.shenzjd.com`）
3. **上传** — 拖入图片，链接自动复制，完成 ✅

配置（目录、分支、压缩、水印、CDN）已自动生成默认值，随时可在「图床设置」和「高级配置」中调整。

---

## ☁️ 部署你自己的图床

### Vercel（推荐，零环境变量）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwu529778790%2Fimg.shenzjd.com)

登录与 GitHub 凭证全部由 [wx-auth](https://wx-auth.shenzjd.com) 统一托管，部署**不需要配置任何 GitHub OAuth / Token 环境变量**，站点域名属于 `*.shenzjd.com` 即可直接使用登录能力。

### Docker

```bash
docker run -d -p 3000:3000 ghcr.io/wu529778790/img.shenzjd.com:latest
```

> 同样无需注入任何 GitHub 相关环境变量。

---

## 🔐 安全设计

| 传统图床 | img.shenzjd.com |
|---|---|
| 用户创建长期有效的 Personal Access Token | 无需任何 Token，GitHub App 授权即可 |
| Token 明文存在浏览器 localStorage | 短命 installation token（8 小时），仅存内存 |
| Token 泄漏 = 整个 GitHub 仓库权限丢失 | 权限最小化，仅覆盖授权仓库，随时可撤销 |

---

## 🌐 CDN 加速

GitHub 国内访问速度较慢，内置多种 CDN 加速（上传后可在设置中切换）：

| CDN | 地址格式 | 说明 |
|-----|---------|------|
| GitHub Raw | `raw.githubusercontent.com/...` | 原始链接，支持动态 WebP 转换 |
| jsDelivr | `cdn.jsdelivr.net/gh/...` | 全球加速，仓库超 50MB 停止 |
| jsDMirror | `cdn.jsdmirror.com/gh/...` | 国内推荐，默认选项 |
| GitHub Pages | `{user}.github.io/{repo}/...` | 自定义域名友好 |

当 `cdn.jsdelivr.net` 被污染时，可替换为 `gcore.jsdelivr.net` / `fastly.jsdelivr.net` / `testingcf.jsdelivr.net`。

---

## 📝 配合 PicGo 使用（可选）

习惯在 VS Code 里写 Markdown？图床仓库同样兼容 [PicGo](https://github.com/Molunerfinn/PicGo)：

1. 安装 [PicGo 桌面版](https://github.com/Molunerfinn/PicGo/releases) 或 VS Code 插件 **vs-picgo**
2. 创建一个 [Personal Access Token](https://github.com/settings/tokens)（勾选 `repo` 权限）
3. 配置图床：`owner` = 你的用户名，`repo` = `img.shenzjd.com`，`branch` = `main`，`path` = 自定义目录

> 网页端与 PicGo 共用同一个仓库，图片在管理页统一可见。

---

## 🧰 技术栈

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand · TanStack Query · [wx-auth](https://wx-auth.shenzjd.com)

---

## 📄 License

[MIT](LICENSE)
