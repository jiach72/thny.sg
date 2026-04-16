# ==========
# Management 前端构建
# Context: Project Root
# ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 依赖文件
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY packages/management ./packages/management
# npm workspaces 需要所有 workspace 包的 package.json
COPY backend/package.json ./backend/package.json
COPY packages/mobile-client/package.json ./packages/mobile-client/package.json
COPY packages/website/package.json ./packages/website/package.json
COPY packages/customer-portal/package.json ./packages/customer-portal/package.json

# 安装依赖
RUN npm ci --legacy-peer-deps

# 构建 Management（跳过 vue-tsc 类型检查，CI 已有独立 type-check 步骤）
WORKDIR /app/packages/management
RUN npx vite build

# ==========
# Nginx 静态服务
# ==========
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/packages/management/dist /usr/share/nginx/html

# 复制 SPA 专用 Nginx 配置
COPY docker/nginx.spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
