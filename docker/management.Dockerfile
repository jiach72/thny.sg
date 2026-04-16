# ==========
# Management 前端构建
# Context: Project Root
# ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 第一层：仅复制依赖声明文件
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY packages/management/package.json ./packages/management/package.json
COPY packages/website/package.json ./packages/website/package.json
COPY packages/customer-portal/package.json ./packages/customer-portal/package.json
COPY packages/mobile-client/package.json ./packages/mobile-client/package.json
COPY backend/package.json ./backend/package.json

# 安装依赖
RUN npm ci --legacy-peer-deps

# 第二层：复制源代码
COPY packages/management ./packages/management

# 构建 Management（跳过 vue-tsc，CI 已有独立 type-check）
WORKDIR /app/packages/management
RUN npx vite build

# ========== Nginx 静态服务 ==========
FROM nginx:alpine

COPY --from=builder /app/packages/management/dist /usr/share/nginx/html
COPY docker/nginx.spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
