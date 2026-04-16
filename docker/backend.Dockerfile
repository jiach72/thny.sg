# ==========
# 后端服务构建
# Context: Project Root
# ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 1. 安装依赖 (Monorepo Root)
COPY package.json package-lock.json ./
# 如果有 shared 包，也需要复制
COPY packages/shared ./packages/shared
# npm workspaces 需要所有 workspace 包的 package.json
COPY packages/website/package.json ./packages/website/package.json
COPY packages/management/package.json ./packages/management/package.json
COPY packages/customer-portal/package.json ./packages/customer-portal/package.json
COPY packages/mobile-client/package.json ./packages/mobile-client/package.json
COPY backend ./backend

# 安装依赖
RUN npm ci --legacy-peer-deps

# 2. 生成 Prisma Client
WORKDIR /app/backend
RUN npx prisma generate

# 3. 构建后端
RUN npm run build

# ==========
# 生产运行环境
# ==========
FROM node:20-alpine AS runner

# curl: Docker healthcheck 需要; openssl: Prisma 需要
RUN apk add --no-cache openssl curl

WORKDIR /app
ENV NODE_ENV=production

# 构建必要的 Monorepo 层级结构，使得 Node 能够正确往上寻找模块
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

WORKDIR /app/backend

# 复制后端相关文件
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./

# 创建上传目录并设置权限，以非 root 用户运行（安全加固）
RUN mkdir -p /app/backend/uploads && chown -R node:node /app
USER node

EXPOSE 4000

CMD ["npm", "run", "start"]
