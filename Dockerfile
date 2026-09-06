# 构建阶段：产出纯静态站点（out/）
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装依赖（含 devDependencies，构建需要）
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 运行阶段：nginx 托管静态文件（无 Node 进程，内存占用极低）
FROM nginx:alpine

COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
