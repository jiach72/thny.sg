# 通海南洋 CRM 故障排查手册

> **版本**: v1.0 | **更新日期**: 2026-04-15 | **适用环境**: Docker Compose 生产部署

---

## 1. 故障响应流程

```
发现故障
    │
    ├── 1. 确认故障范围（全站/单服务/单功能）
    ├── 2. 查看监控指标（Metrics/Sentry/日志）
    ├── 3. 对照本手册定位原因
    ├── 4. 执行修复步骤
    ├── 5. 验证修复结果
    └── 6. 记录故障报告
```

**故障等级定义**：

| 等级 | 定义 | 响应时间 | 示例 |
|------|------|----------|------|
| P0 | 全站不可用 | 15 分钟 | 数据库宕机、Nginx 崩溃 |
| P1 | 核心功能不可用 | 30 分钟 | 登录失败、API 500 错误 |
| P2 | 非核心功能异常 | 4 小时 | 邮件发送失败、报表延迟 |
| P3 | 体验性问题 | 24 小时 | 页面加载慢、UI 错位 |

---

## 2. 常见故障及解决方案

### 2.1 数据库连接失败

**症状**: 后端日志出现 `PrismaClientInitializationError` 或 `Can't reach database server`

**排查步骤**:

```bash
# 1. 检查 PostgreSQL 容器状态
docker compose -f docker-compose.prod.yml ps postgres

# 2. 测试数据库连接
docker exec thny-postgres pg_isready

# 3. 检查数据库日志
docker logs thny-postgres --tail 50

# 4. 检查连接数
docker exec thny-postgres psql -U tonghai -d tonghai_crm -c "SELECT count(*) FROM pg_stat_activity;"
```

**常见原因及修复**:

| 原因 | 修复 |
|------|------|
| PostgreSQL 未启动 | `docker compose restart postgres` |
| 连接池耗尽 | 检查是否有未释放的连接，临时增大 `connection_limit` |
| 磁盘满 | 清理旧日志/备份：`find /backups -mtime +30 -delete` |
| 内存不足 | `docker stats` 确认，临时增大内存限制 |

---

### 2.2 Redis 连接失败

**症状**: 后端日志出现 `ioredis` 错误，但服务仍可运行（降级模式）

**排查步骤**:

```bash
docker exec thny-redis redis-cli -a <password> ping
docker logs thny-redis --tail 50
```

**修复**: Redis 连接失败不阻断启动（设计降级），但以下功能受影响：
- Rate Limit 限流不共享（多实例不一致）
- 缓存失效（查询性能下降）

修复方法：`docker compose restart redis`，后端会自动重连。

---

### 2.3 Nginx 502 Bad Gateway

**症状**: 浏览器显示 502 错误

**排查步骤**:

```bash
# 1. 检查后端服务是否运行
docker compose ps backend

# 2. 检查后端健康状态
docker exec thny-backend curl -s http://localhost:5000/api/v1/health

# 3. 检查 Nginx 配置
docker exec thny-nginx nginx -t

# 4. 查看 Nginx 错误日志
docker exec thny-nginx cat /var/log/nginx/error.log | tail -20
```

**常见原因及修复**:

| 原因 | 修复 |
|------|------|
| 后端未启动 | `docker compose restart backend` |
| 后端健康检查失败 | 查看后端日志定位 |
| Nginx 配置错误 | 修正配置后 `nginx -s reload` |
| 上游超时 | 增大 `proxy_read_timeout` |

---

### 2.4 登录失败

**症状**: 用户无法登录，返回 401 或 500

**排查步骤**:

```bash
# 1. 查看后端认证相关日志
docker logs thny-backend --since 10m 2>&1 | grep -i "auth\|login\|jwt"

# 2. 检查 JWT_SECRET 配置
docker exec thny-backend printenv JWT_SECRET

# 3. 检查数据库用户表
docker exec thny-postgres psql -U tonghai -d tonghai_crm -c "SELECT id, email, status FROM \"User\" WHERE email = 'problem@email.com';"
```

**常见原因**:

| 原因 | 修复 |
|------|------|
| JWT_SECRET 变更 | 所有已登录用户的 Token 失效，需重新登录 |
| 用户状态为 INACTIVE | 管理员在后台激活用户 |
| 密码错误超限 | 等待 15 分钟限流窗口过期 |
| 数据库连接失败 | 参照 2.1 修复 |

---

### 2.5 Stripe 支付失败

**症状**: 支付页面报错或 Webhook 未触发

**排查步骤**:

```bash
# 1. 查看 Stripe Webhook 日志
docker logs thny-backend --since 1h 2>&1 | grep -i "stripe\|webhook\|payment"

# 2. 验证 Webhook 签名密钥
docker exec thny-backend printenv STRIPE_WEBHOOK_SECRET

# 3. 在 Stripe Dashboard 查看事件日志
```

---

### 2.6 邮件发送失败

**症状**: 用户未收到邮件

**排查步骤**:

```bash
# 1. 查看邮件发送日志
docker logs thny-backend --since 1h 2>&1 | grep -i "email\|smtp\|sendgrid"

# 2. 检查邮件配置
docker exec thny-postgres psql -U tonghai -d tonghai_crm -c "SELECT key, value FROM \"SystemSetting\" WHERE key LIKE 'SMTP_%' OR key LIKE 'EMAIL_%';"

# 3. 测试 SMTP 连接
docker exec thny-backend curl -s http://localhost:5000/api/v1/settings/email/test
```

---

### 2.7 SSL 证书过期

**症状**: 浏览器显示不安全连接

**排查步骤**:

```bash
# 检查证书到期日期
echo | openssl s_client -connect crm.thny.sg:443 2>/dev/null | openssl x509 -noout -dates
```

**修复**:

```bash
# 手动续期
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

### 2.8 磁盘空间不足

**症状**: 服务异常，日志写入失败

```bash
# 查看磁盘使用
df -h

# 查看大文件
du -sh /var/lib/docker/* | sort -rh | head -10

# 清理 Docker 资源
docker system prune -af --volumes  # ⚠️ 会删除未使用的容器和卷

# 清理旧备份（保留最近 30 天）
find /backups -name "*.sql.gz" -mtime +30 -delete
```

---

## 3. 紧急操作

### 3.1 全站熔断

当遇到严重安全问题时，立即关闭外网访问：

```bash
# 在服务器上执行
iptables -A INPUT -p tcp --dport 443 -j DROP
iptables -A INPUT -p tcp --dport 80 -j DROP

# 恢复
iptables -D INPUT -p tcp --dport 443 -j DROP
iptables -D INPUT -p tcp --dport 80 -j DROP
```

### 3.2 数据库紧急备份

```bash
docker exec thny-postgres pg_dump -U tonghai tonghai_crm | gzip > /tmp/emergency_$(date +%Y%m%d_%H%M%S).sql.gz
```

---

## 4. 联系方式

| 角色 | 职责 | 联系方式 |
|------|------|----------|
| 运维负责人 | 基础设施、部署 | [填写] |
| 后端开发 | API、数据库 | [填写] |
| 前端开发 | 界面、交互 | [填写] |
| 安全负责人 | 安全事件响应 | [填写] |

---

*文档生成时间: 2026-04-15*
