#!/bin/bash
# ============================================================
# 通海南洋 - 服务器首次初始化脚本
# 
# 在全新安装 Docker 的服务器上执行此脚本，
# 完成从零到运行的一键部署。
# 
# 前提条件：
#   - Ubuntu 22.04/24.04
#   - Docker + Docker Compose 已安装
#   - 域名 DNS 已通过 Cloudflare 解析到本服务器 IP
#   - Cloudflare SSL/TLS 模式设为 Full
# 
# 用法：bash setup-server.sh
# ============================================================

set -e

echo "============================================"
echo "  通海南洋 CRM - 服务器初始化"
echo "============================================"
echo ""

PROJECT_DIR="/var/www/tonghai"

# ---------- 1. 创建项目目录 ----------
echo "📁 创建项目目录..."
sudo mkdir -p "$PROJECT_DIR"
sudo chown -R $USER:$USER "$PROJECT_DIR"
cd "$PROJECT_DIR"

# ---------- 2. 生成自签 SSL 证书 ----------
echo ""
echo "🔐 生成 SSL 证书..."
bash ./scripts/init-ssl.sh

# ---------- 3. 创建 .env 文件 ----------
echo ""
echo "📝 配置环境变量..."

if [ ! -f .env ]; then
    cat > .env << 'ENVEOF'
# ===== 数据库 =====
DB_PASSWORD=CHANGE_ME_STRONG_DB_PASSWORD

# ===== Redis =====
REDIS_PASSWORD=CHANGE_ME_STRONG_REDIS_PASSWORD

# ===== JWT =====
JWT_SECRET=CHANGE_ME_RANDOM_JWT_SECRET_AT_LEAST_32_CHARS

# ===== 前端 URL =====
FRONTEND_URL=https://thny.sg
MANAGEMENT_URL=https://crm.thny.sg
PORTAL_URL=https://portal.thny.sg

# ===== 管理员初始化（可选） =====
ADMIN_EMAIL=admin@thny.sg
ADMIN_PASSWORD=CHANGE_ME_ADMIN_PASSWORD
ENVEOF

    echo "⚠️  .env 文件已创建，请编辑 /var/www/tonghai/.env 修改密码和密钥！"
    echo ""
    read -p "是否现在编辑 .env？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
else
    echo "✅ .env 已存在，跳过"
fi

# ---------- 4. 登录 GHCR ----------
echo ""
echo "🐳 登录 GitHub Container Registry..."
read -p "请输入 GHCR Token (ghp_...): " GHCR_TOKEN
echo "$GHCR_TOKEN" | docker login ghcr.io -u jiach72 --password-stdin || {
    echo "❌ GHCR 登录失败，请检查 Token"
    exit 1
}

# ---------- 5. 拉取 Docker 镜像 ----------
echo ""
echo "📦 拉取最新 Docker 镜像..."
docker compose pull

# ---------- 6. 运行数据库迁移 ----------
echo ""
echo "🗄️  运行数据库迁移..."
docker compose run --rm --no-deps backend npx prisma migrate deploy

# ---------- 7. 初始化 RBAC 和管理员 ----------
echo ""
echo "👤 初始化角色和管理员..."
docker compose run --rm --no-deps backend npx tsx prisma/seed-rbac.ts
docker compose run --rm --no-deps -e ADMIN_EMAIL -e ADMIN_PASSWORD backend npx tsx prisma/seed-admin.ts 2>/dev/null || echo "⚠️ 管理员初始化跳过"

# ---------- 8. 启动所有服务 ----------
echo ""
echo "🚀 启动所有服务..."
docker compose up -d --remove-orphans

# ---------- 9. 等待后端就绪 ----------
echo ""
echo "⏳ 等待后端就绪..."
sleep 10
timeout 80 bash -c 'until docker compose exec -T backend curl -sf http://localhost:4000/api/v1/health > /dev/null 2>&1; do sleep 3; done' || {
    echo "❌ 后端健康检查失败"
    docker compose logs --tail=50 backend
    exit 1
}

# ---------- 10. 验证 ----------
echo ""
echo "============================================"
echo "  ✅ 部署完成！"
echo "============================================"
echo ""
echo "📋 服务状态："
docker compose ps
echo ""
echo "🌐 访问地址："
echo "   官网：       https://thny.sg"
echo "   CRM 管理端：  https://crm.thny.sg"
echo "   客户门户：    https://portal.thny.sg"
echo ""
echo "⚠️  重要提醒："
echo "   1. 确保 Cloudflare SSL/TLS 模式设为 Full（非 Full Strict）"
echo "   2. 确保 Cloudflare DNS 中三个域名都代理到本服务器"
echo "   3. 后续代码更新通过 git push 自动触发 CI/CD 部署"
