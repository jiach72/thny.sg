#!/bin/bash
# ============================================================
# 通海南洋 - SSL 自签证书初始化脚本
# 
# 适用场景：Cloudflare 代理模式（SSL/TLS 设为 Full 或 Full (Strict)）
# Cloudflare 建议使用 Cloudflare Origin Certificate，
# 但自签证书配合 Full 模式也能正常工作。
# 
# 用法：bash init-ssl.sh
# ============================================================

set -e

CERT_DIR="./certs"
mkdir -p "$CERT_DIR"

DOMAINS=("thny.sg" "crm.thny.sg" "portal.thny.sg")

echo "🔐 生成自签 SSL 证书（Cloudflare Full 模式）..."
echo ""

for DOMAIN in "${DOMAINS[@]}"; do
    CERT_PATH="$CERT_DIR/$DOMAIN"
    
    if [ -f "$CERT_PATH/fullchain.pem" ] && [ -f "$CERT_PATH/privkey.pem" ]; then
        echo "✅ $DOMAIN 证书已存在，跳过"
        continue
    fi
    
    mkdir -p "$CERT_PATH"
    
    # 生成自签证书（有效期 10 年）
    openssl req -x509 -nodes \
        -days 3650 \
        -newkey rsa:2048 \
        -keyout "$CERT_PATH/privkey.pem" \
        -out "$CERT_PATH/fullchain.pem" \
        -subj "/CN=$DOMAIN/O=TongHai Nanyang/C=SG" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN" 2>/dev/null
    
    echo "✅ $DOMAIN 证书已生成"
done

echo ""
echo "📋 证书文件列表："
ls -la "$CERT_DIR"/*/

echo ""
echo "⚠️  重要提示："
echo "   1. 在 Cloudflare Dashboard 中，SSL/TLS 加密模式设为 Full（非 Full Strict）"
echo "   2. 自签证书仅用于 Cloudflare ↔ 源服务器之间，访客看到的是 Cloudflare 边缘证书"
echo "   3. 如需 Full (Strict) 模式，请使用 Cloudflare Origin Certificate（见下方说明）"
echo ""
echo "   生成 Cloudflare Origin Certificate 的替代方案："
echo "   1. 登录 Cloudflare Dashboard → SSL/TLS → Origin Server"
echo "   2. 点击 'Create Certificate'"
echo "   3. 域名填入 thny.sg, *.thny.sg"
echo "   4. 将生成的证书和私钥分别保存为 fullchain.pem 和 privkey.pem"
echo "   5. 放入 ./certs/thny.sg/ 目录（通配符证书可复用给子域名）"
