# 使用官方 Next.js 镜像作为构建阶段
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装所有依赖（包括 devDependencies，因为构建需要）
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建 Next.js 应用
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 生产阶段
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./public/_next/static

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用（过滤已知的无害误报：浏览器缓存旧版页面导致的 "Failed to find Server Action"）
# 每次发新版后老用户浏览器仍引用旧版 Server Action ID，会触发该错误，属正常现象，无需告警
# awk 状态机：命中错误行后连带跳过其后的 "Read more" 与堆栈行（共 2 行），不影响其他错误日志
CMD ["sh", "-c", "exec node server.js 2>&1 | awk -W interactive 'skip>0{skip--; next} /Failed to find Server Action|failed-to-find-server-action/{skip=2; next} {print}'"]
