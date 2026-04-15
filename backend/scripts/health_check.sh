#!/bin/bash
# 通海南洋 CRM 健康检查与告警脚本
# 用法: ./health_check.sh [webhook_url]
# 建议通过 cron 定时执行，例如每 5 分钟:
# */5 * * * * /path/to/backend/scripts/health_check.sh

HEALTH_URL="http://localhost:4000/api/v1/health"
WEBHOOK_URL="${1:-$ALERT_WEBHOOK_URL}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@thny.sg}"

response=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" 2>&1)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" != "200" ]; then
    message="🚨 CRM 系统健康检查失败！HTTP 状态码: $http_code"
    echo "$message" | logger -t crm-health
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d "{\"text\": \"$message\"}" > /dev/null
    fi
    exit 1
fi

status=$(echo "$body" | grep -o '"status":"[^"]*"' | head -1)
if echo "$status" | grep -q "unhealthy"; then
    message="⚠️ CRM 系统部分服务不健康: $status"
    echo "$message" | logger -t crm-health
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d "{\"text\": \"$message\"}" > /dev/null
    fi
    exit 1
fi

echo "✅ CRM 系统健康检查通过 $(date)" | logger -t crm-health
exit 0
