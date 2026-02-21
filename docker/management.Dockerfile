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

# 安装依赖
RUN npm ci --legacy-peer-deps

# 构建 Management
WORKDIR /app/packages/management
RUN npm run build

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
