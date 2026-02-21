# ==========
# Website 前端构建
# Context: Project Root
# ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 依赖文件
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY packages/website ./packages/website

# 安装依赖
RUN npm install --legacy-peer-deps

ARG VITE_PORTAL_URL=https://portal.thny.sg
ENV VITE_PORTAL_URL=$VITE_PORTAL_URL

# 构建 Website
WORKDIR /app/packages/website
RUN npm run build

# ==========
# Nginx 静态服务
# ==========
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/packages/website/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
