FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm install

# 复制源码并构建
COPY . .
RUN npm run build
RUN npx prisma generate

# ========== 生产镜像 ==========
FROM node:20-alpine AS runner

# 安装 OpenSSL (Prisma 需要)
RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

# 仅复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 4000

# 启动命令
CMD ["npm", "run", "start"]
