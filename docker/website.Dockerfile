# ==========
# Website 前端构建
# Context: Project Root
# 设计原则：
#   1. 先复制 package.json 再 npm ci，利用 Docker 层缓存
#   2. 跳过 vue-tsc 类型检查（CI 已有独立 type-check 步骤）
#   3. 构建完成后 npm prune 删除 devDependencies 减小缓存层体积
# ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 第一层：仅复制依赖声明文件（利用缓存，代码变更不重装依赖）
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY packages/website/package.json ./packages/website/package.json
COPY packages/management/package.json ./packages/management/package.json
COPY packages/customer-portal/package.json ./packages/customer-portal/package.json
COPY packages/mobile-client/package.json ./packages/mobile-client/package.json
COPY backend/package.json ./backend/package.json

# 安装依赖
RUN npm ci --legacy-peer-deps

# 第二层：复制源代码（代码变更只从此层开始重建）
COPY packages/website ./packages/website

ARG VITE_PORTAL_URL=https://portal.thny.sg
ENV VITE_PORTAL_URL=$VITE_PORTAL_URL

# 构建 Website（跳过 vue-tsc，CI 已有独立 type-check）
WORKDIR /app/packages/website
RUN npx vite-ssg build

# ========== Nginx 静态服务 ==========
FROM nginx:alpine

COPY --from=builder /app/packages/website/dist /usr/share/nginx/html
COPY docker/nginx.spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
