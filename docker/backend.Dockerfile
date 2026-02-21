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

# 2. 生成 Prisma Client
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
ENV NODE_ENV=production

# 构建必要的 Monorepo 层级结构，使得 Node 能够正确往上寻找模块
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

WORKDIR /app/backend

# 复制后端相关文件
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./

EXPOSE 4000

CMD ["npm", "run", "start"]
