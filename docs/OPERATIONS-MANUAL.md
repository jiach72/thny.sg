# 通海南洋 CRM 运维手册

> **版本**: v1.0 | **更新日期**: 2026-04-15 | **适用环境**: Docker Compose 生产部署

---

## 1. 日常巡检

### 1.1 每日巡检清单

| # | 巡检项 | 命令/方法 | 正常标准 |
|---|--------|----------|----------|
| 1 | 服务存活状态 | `docker compose ps` | 所有 9 个容器状态为 `Up` |
| 2 | 后端健康检查 | `curl -s https://crm.thny.sg/api/v1/health` | 返回 `{"status":"ok"}` |
| 3 | 数据库连接 | `docker exec -t thny-postgres pg_isready` | `accepting connections` |
| 4 | Redis 连接 | `docker exec -t thny-redis redis-cli -a <password> ping` | 返回 `PONG` |
| 5 | 磁盘空间 | `df -h` | 使用率 < 80% |
| 6 | 内存使用 | `docker stats --no-stream` | 各容器 < 90% 限制值 |
| 7 | SSL 证书到期 | `echo | openssl s_client -connect crm.thny.sg:443 2>/dev/null | openssl x509 -noout -enddate` | > 30 天 |
| 8 | 日志错误数 | `docker logs thny-backend --since 24h 2>&1 \| grep -c "ERROR"` | < 100/天 |

### 1.2 每周巡检清单

| # | 巡检项 | 命令/方法 | 正常标准 |
|---|--------|----------|----------|
| 1 | 数据库备份验证 | `ls -la /backups/` | 每日有新备份文件 |
| 2 | 备份恢复测试 | 选取一份备份恢复到临时库 | 数据完整可查询 |
| 3 | 安全更新检查 | `docker compose pull` | 无高危安全更新 |
| 4 | 慢查询分析 | 查看 Prisma 日志 | 无 > 5s 慢查询 |
| 5 | Metrics 指标审查 | `curl -H "Authorization: Bearer <token>" https://crm.thny.sg/metrics` | 5xx < 1% |

---

## 2. 服务管理

### 2.1 启动服务

```bash
cd /opt/thny/docker
docker compose -f docker-compose.prod.yml up -d
```

### 2.2 停止服务

```bash
cd /opt/thny/docker
docker compose -f docker-compose.prod.yml down
# 注意：此操作不删除数据卷
```

### 2.3 重启单个服务

```bash
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart nginx
```

### 2.4 查看日志

```bash
# 实时查看后端日志
docker logs -f thny-backend

# 查看最近 100 行
docker logs --tail 100 thny-backend

# 查看指定时间段
docker logs --since "2026-04-15T08:00:00" --until "2026-04-15T09:00:00" thny-backend

# 查看 Nginx 访问日志
docker exec thny-nginx cat /var/log/nginx/access.log
```

### 2.5 进入容器

```bash
docker exec -it thny-backend sh
docker exec -it thny-postgres psql -U tonghai -d tonghai_crm
```

---

## 3. 数据库管理

### 3.1 数据库备份

备份服务 `pgbackups` 已自动运行，每日凌晨 3:00 执行全量备份。

手动备份：
```bash
docker exec thny-postgres pg_dump -U tonghai tonghai_crm | gzip > /backups/manual_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 3.2 数据库恢复

```bash
# 1. 停止后端服务
docker compose -f docker-compose.prod.yml stop backend

# 2. 恢复数据
gunzip -c /backups/backup_20260415.sql.gz | docker exec -i thny-postgres psql -U tonghai -d tonghai_crm

# 3. 重启后端
docker compose -f docker-compose.prod.yml start backend
```

### 3.3 数据库迁移

```bash
# 在后端容器内执行
docker exec -it thny-backend npx prisma migrate deploy
```

---

## 4. 配置管理

### 4.1 环境变量清单

| 变量 | 说明 | 示例值 | 必填 |
|------|------|--------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:pass@postgres:5432/db` | ✅ |
| `REDIS_URL` | Redis 连接串 | `redis://redis:6379` | ✅ |
| `JWT_SECRET` | JWT 签名密钥 | `openssl rand -hex 32` | ✅ 生产必须 |
| `JWT_REFRESH_SECRET` | Refresh Token 密钥 | `openssl rand -hex 32` | ✅ 生产必须 |
| `METRICS_BEARER_TOKEN` | Metrics 认证令牌 | `openssl rand -hex 32` | ✅ 生产必须 |
| `TWO_FA_ENCRYPTION_KEY` | 2FA 加密密钥 | `openssl rand -hex 16` | ✅ 生产必须 |
| `STRIPE_SECRET_KEY` | Stripe 密钥 | `sk_live_xxx` | 按需 |
| `SENTRY_DSN` | Sentry DSN | `https://xxx@sentry.io/xxx` | 推荐 |
| `SMTP_HOST` | SMTP 服务器 | `smtp.gmail.com` | 按需 |
| `SMTP_USER` | SMTP 用户名 | `xxx@gmail.com` | 按需 |
| `SMTP_PASS` | SMTP 密码 | `app-password` | 按需 |

### 4.2 更新环境变量

1. 编辑 `.env` 文件
2. 重启受影响的服务：`docker compose -f docker-compose.prod.yml up -d backend`

---

## 5. 版本更新

### 5.1 标准更新流程

```bash
# 1. 拉取最新镜像
docker compose -f docker-compose.prod.yml pull

# 2. 备份数据库
docker exec thny-postgres pg_dump -U tonghai tonghai_crm | gzip > /backups/pre_update_$(date +%Y%m%d).sql.gz

# 3. 执行数据库迁移
docker compose -f docker-compose.prod.yml up -d backend
docker exec thny-backend npx prisma migrate deploy

# 4. 重启所有服务
docker compose -f docker-compose.prod.yml up -d

# 5. 验证健康状态
curl -s https://crm.thny.sg/api/v1/health
```

### 5.2 回滚流程

```bash
# 1. 停止服务
docker compose -f docker-compose.prod.yml down

# 2. 恢复数据库
gunzip -c /backups/pre_update_20260415.sql.gz | docker exec -i thny-postgres psql -U tonghai -d tonghai_crm

# 3. 回退镜像版本（修改 docker-compose.prod.yml 中的镜像标签）
# 将 :latest 改为 :sha-abc1234

# 4. 重启
docker compose -f docker-compose.prod.yml up -d
```

---

## 6. SSL 证书管理

证书由 Certbot 自动续期。手动续期：
```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 7. 监控接入

- **Metrics 端点**: `https://crm.thny.sg/metrics` (需 Bearer Token)
- **健康检查**: `https://crm.thny.sg/api/v1/health`
- **Sentry 面板**: https://sentry.io

---

*文档生成时间: 2026-04-15*
