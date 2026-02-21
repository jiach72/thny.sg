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
COPY backend ./backend

# 安装依赖
RUN npm install --legacy-peer-deps

# 2. 生成 Prisma Client (需要依赖)
WORKDIR /app/backend
RUN npx prisma generate

# 3. 构建后端
RUN npm run build

# ==========
# 生产运行环境
# ==========
FROM node:20-alpine AS runner

# 安装 OpenSSL (Prisma 需要)
RUN apk add --no-cache openssl

WORKDIR /app

# 为了安全与镜像大小，生产阶段仅复制最小必要文件
# 因为是 Monorepo 提升的情况，根目录下有整体的 node_modules
COPY --from=builder /app/package.json /app/package-lock.json ./
# 提取出只应用于生产的依赖项 (隔离 monorepo 开发依赖)
RUN npm ci --omit=dev --legacy-peer-deps

WORKDIR /app/backend

# 复制产物和 Prisma schema/客户端
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/prisma ./prisma
# Prisma 客户端通常生成在 node_modules/.prisma 下，因为刚才在 runner 根目录运行了 npm ci，所以此时 runner 的 /app/node_modules 中只有生产依赖。
# 我们需要运行一次 Prisma generate 来给 runner 生成产物
# 为避免全局 npx 拉取最新不兼容版本(如 v7)，这里明确使用安装在环境中的 prisma 依赖 (我们在 deps npm ci 时会自动带入 dependencies 中的 @prisma/client，但可能没有 cli，所以显式使用特定版本)
RUN npx prisma@5 generate

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "run", "start"]
