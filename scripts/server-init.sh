#!/bin/bash
# ============================================
# 通海南洋 服务器初始化脚本
# 适用于 腾讯云轻量应用服务器 (Docker 应用模板)
# 系统: Ubuntu 22.04 / 24.04
# 用户: ubuntu (sudo 权限)
# ============================================

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 通海南洋 服务器初始化脚本"
echo "=========================================="

# ========== 1. 系统更新 ==========
echo ""
echo "📦 [1/5] 更新系统包..."
sudo apt update && sudo apt upgrade -y

# ========== 2. 安装必要工具 ==========
echo ""
echo "🔧 [2/5] 安装必要工具..."
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    unzip \
    ufw

# ========== 3. 验证 Docker ==========
echo ""
echo "🐳 [3/5] 验证 Docker 安装..."

if command -v docker &> /dev/null; then
    echo "  ✅ Docker 版本: $(docker --version)"
else
    echo "  ❌ Docker 未安装！请使用腾讯云 Docker 应用模板重装系统"
    exit 1
fi

if command -v docker compose &> /dev/null; then
    echo "  ✅ Docker Compose: $(docker compose version)"
else
    echo "  ❌ Docker Compose 插件未安装！"
    echo "  正在安装..."
    sudo apt install -y docker-compose-plugin
fi

# 确保当前用户在 docker 组中
if ! groups | grep -q docker; then
    sudo usermod -aG docker $USER
    echo "  ⚠️ 已将 $USER 添加到 docker 组，需要重新登录生效"
fi

# ========== 4. 配置防火墙 ==========
echo ""
echo "🔒 [4/5] 配置防火墙..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

echo "  ✅ 防火墙状态:"
sudo ufw status

# ========== 5. 创建项目目录 ==========
echo ""
echo "📁 [5/5] 创建项目目录..."
sudo mkdir -p /var/www/tonghai
sudo chown -R $USER:$USER /var/www/tonghai
sudo chmod -R 755 /var/www/tonghai

echo "  ✅ 项目目录已创建: /var/www/tonghai"

# ========== 6. (可选) 安装 Certbot ==========
echo ""
echo "🔐 [附加] 安装 Certbot (SSL 证书)..."
sudo apt install -y certbot

echo ""
echo "=========================================="
echo "✅ 服务器初始化完成!"
echo "=========================================="
echo ""
echo "📋 下一步操作:"
echo ""
echo "1. 在 GitHub 仓库 Settings > Secrets 配置以下 secrets:"
echo "   - SERVER_HOST: 服务器 IP"
echo "   - SERVER_USER: ubuntu"
echo "   - SSH_PRIVATE_KEY: SSH 私钥"
echo "   - JWT_SECRET: openssl rand -base64 32"
echo "   - DB_PASSWORD: 强密码"
echo ""
echo "2. 在 GitHub 仓库 Packages 页面设置 4 个 package 为 public:"
echo "   - thny-backend"
echo "   - thny-website"
echo "   - thny-management"
echo "   - thny-portal"
echo ""
echo "3. Push 到 main 分支，GitHub Actions 将自动部署"
echo ""
echo "4. 部署成功后配置 DNS 并申请 SSL 证书:"
echo "   certbot certonly --standalone -d thny.sg -d www.thny.sg -d crm.thny.sg -d portal.thny.sg"
echo ""
echo "=========================================="
