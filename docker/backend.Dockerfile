# ========== 后端服务构建
# Context: Project Root
# 关键优化:
#   1. 先复制 package.json 再 npm ci，利用 Docker 层缓存
#   2. 后续代码变更不会重新安装依赖
#   3. runner 阶段仅安装生产依赖，大幅减小镜像体积
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

# 安装全部依赖（含 devDependencies，构建需要 tsc 等）
RUN npm ci --legacy-peer-deps

# 第二层：复制源代码（代码变更只从此层开始重建）
COPY backend ./backend

# 生成 Prisma Client + 构建后端
WORKDIR /app/backend
RUN npx prisma generate && npm run build

# ========== 仅安装生产依赖 ==========
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY packages/website/package.json ./packages/website/package.json
COPY packages/management/package.json ./packages/management/package.json
COPY packages/customer-portal/package.json ./packages/customer-portal/package.json
COPY packages/mobile-client/package.json ./packages/mobile-client/package.json
COPY backend/package.json ./backend/package.json

RUN npm ci --legacy-peer-deps --omit=dev

WORKDIR /app/backend
RUN npx prisma generate

# ========== 生产运行环境 ==========
FROM node:20-alpine AS runner

# curl: healthcheck; openssl: Prisma 需要
RUN apk add --no-cache openssl curl

WORKDIR /app
ENV NODE_ENV=production

# 从 prod-deps 阶段复制生产依赖
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=prod-deps /app/backend/node_modules ./backend/node_modules
COPY --from=prod-deps /app/backend/package.json ./backend/package.json

# 从 builder 阶段复制构建产物和 Prisma
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

WORKDIR /app/backend

# 创建上传目录，以非 root 用户运行
RUN mkdir -p /app/backend/uploads && chown -R node:node /app
USER node

EXPOSE 4000

# 直接用 node 启动，避免 npm 包装进程（信号处理更可靠）
CMD ["node", "dist/index.js"]
