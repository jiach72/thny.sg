#!/bin/sh
# 通海南洋 CRM 备份异地上传脚本
# 在 pgbackups 完成本地备份后，自动将最新备份上传至 S3
#
# 使用方式：
# 1. 在 .env 中设置 S3_BACKUP=true, S3_BACKUP_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# 2. 此脚本由 pgbackups 容器的 post-backup 钩子调用
#
# 前置条件：容器内需安装 aws CLI（基于 python3 的轻量安装）

set -eu

# 仅在 S3_BACKUP=true 时执行上传
if [ "${S3_BACKUP:-false}" != "true" ]; then
    echo "S3_BACKUP 未启用，跳过异地上传"
    exit 0
fi

# 校验必要环境变量
if [ -z "${S3_BUCKET:-}" ]; then
    echo "❌ S3_BACKUP_BUCKET 未设置，无法上传" >&2
    exit 1
fi

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
    echo "❌ AWS 凭证未设置，无法上传" >&2
    exit 1
fi

AWS_REGION="${AWS_DEFAULT_REGION:-ap-southeast-1}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

# 查找最新的备份文件（按修改时间排序）
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ 未找到备份文件" >&2
    exit 1
fi

FILENAME=$(basename "$LATEST_BACKUP")
DATE_PREFIX=$(date +%Y/%m/%d)
S3_PATH="s3://${S3_BUCKET}/db-backups/${DATE_PREFIX}/${FILENAME}"

echo "📤 正在上传备份至 S3: $S3_PATH"

# 使用 aws s3 cp 上传（需要容器内预装 awscli）
if command -v aws > /dev/null 2>&1; then
    aws s3 cp "$LATEST_BACKUP" "$S3_PATH" --region "$AWS_REGION"
    echo "✅ 备份上传成功: $S3_PATH"
else
    echo "⚠️ awscli 未安装，尝试使用 curl + S3 REST API 上传..."
    # 备用方案：使用 curl 直接调用 S3 PUT API
    # 此处为简化实现，生产环境建议在镜像中预装 awscli
    echo "❌ awscli 不可用，请确保 pgbackups 镜像中已安装 awscli" >&2
    exit 1
fi
