# ==========
# 后端服务构建
# Context: Project Root
# 设计原则：
#   1. 两阶段构建（builder + runner），简单可靠
#   2. 先复制 package.json 再 npm ci，利用 Docker 层缓存
#   3. runner 从 builder 复制完整 node_modules（已含 prisma generate 产物）
#   4. 使用非 root 用户运行
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

# 安装全部依赖（含 devDependencies，构建需要 tsc、prisma 等）
RUN npm ci --legacy-peer-deps

# 第二层：复制后端源代码和 Prisma schema（代码变更只从此层开始重建）
COPY backend ./backend

# 生成 Prisma Client + TypeScript 编译
WORKDIR /app/backend
RUN npx prisma generate && npm run build

# 删除 devDependencies 减小最终镜像体积
RUN npm prune --omit=dev 2>/dev/null || true

# ========== 生产运行环境 ==========
FROM node:20-alpine AS runner

# curl: healthcheck; openssl: Prisma 需要
RUN apk add --no-cache openssl curl

WORKDIR /app
ENV NODE_ENV=production

# 从 builder 阶段复制运行所需文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

WORKDIR /app/backend

# 创建上传目录，以非 root 用户运行
RUN mkdir -p /app/backend/uploads && chown -R node:node /app
USER node

EXPOSE 4000

# 直接用 node 启动，避免 npm 包装进程（信号处理更可靠）
CMD ["node", "dist/index.js"]
