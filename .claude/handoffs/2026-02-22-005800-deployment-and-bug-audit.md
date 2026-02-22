# Handoff: 部署配置修复 & 生产环境 Bug 审计

## Session Metadata
- Created: 2026-02-22 00:58 (SGT+8)
- Project: c:\Users\jiach\Documents\AntigravityCode\thny.sg
- Branch: main
- Session duration: ~2 小时

## Current State Summary

本次会话完成了两件事：**1) 部署配置修复** — 成功将项目首次部署到腾讯云轻量服务器；**2) 生产环境 Bug 审计** — 用户在线验收发现 13 个 Bug/缺陷，全部记录在 `bugs.md` 中，尚未开始修复。

## Codebase Understanding

### Architecture Overview

Monorepo 项目，包含：
- `backend/` — Express + Prisma + PostgreSQL (端口 4000)
- `packages/website/` — Next.js 官网 (www.thny.sg)
- `packages/management/` — Vue 3 CRM 管理端 (crm.thny.sg)
- `packages/portal/` — Vue 3 客户门户 (portal.thny.sg)
- `docker/` — 生产 Docker 配置
- `.github/workflows/deploy.yml` — CI/CD 流水线

部署架构：Docker Compose (PostgreSQL + Redis + Backend + 3 前端 + Nginx 反向代理)

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `.github/workflows/deploy.yml` | GitHub Actions 部署流程 | 本次大量修改，所有 docker 命令需 sudo |
| `docker/docker-compose.prod.yml` | 生产 Docker Compose | 添加了 uploads 卷、443 端口 |
| `docker/backend.Dockerfile` | 后端镜像 | 安装了 curl (healthcheck)、改 npm ci |
| `docker/nginx.conf` | Nginx 配置 | 添加了默认 server 拒绝未知域名 |
| `backend/src/config/env.ts` | 环境变量 | PORT 默认改为 4000 |
| `backend/prisma/schema.prisma:137` | User 模型 | two_factor_enabled 字段缺迁移已修复 |
| `bugs.md` (artifact) | Bug 追踪 | 13 个已发现问题 |

### Key Patterns Discovered

- 腾讯云 Docker 模板的 `ubuntu` 用户 **不在 docker 组**，所有 docker 命令需要 `sudo`
- Prisma schema 中有 `two_factor_enabled` 字段但缺少迁移文件，手动创建了迁移
- seed 文件在 `backend/prisma/` 目录下，Docker 构建时会 COPY 进容器
- 在容器内运行额外 seed 脚本需放到 `/app/backend/prisma/` 目录（不能在 /tmp，否则找不到 node_modules）

## Work Completed

### Tasks Finished

- [x] 修复 backend.Dockerfile — 安装 curl, 改 npm ci
- [x] 修复 website/management/portal Dockerfile — 改 npm ci
- [x] 修复 docker-compose.prod.yml — uploads 卷、443 端口
- [x] 修复 nginx.conf — 默认 server 块
- [x] 修复 deploy.yml — GHCR 登录、echo .env、seed 逻辑、SSH 密钥认证、sudo
- [x] 简化 server-init.sh — 适配腾讯云 Docker 模板
- [x] 修复 env.ts — PORT 默认 4000
- [x] 手动创建 two_factor_fields 迁移并在服务器上执行 SQL
- [x] 在服务器上运行 seed.ts / seed-sdq.ts / seed-faq.ts
- [x] 完成 13 个 Bug 审计记录

### Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `.github/workflows/deploy.yml` | 添加 sudo、GHCR 登录、echo .env、seed 逻辑 | 解决权限、认证、环境变量问题 |
| `docker/backend.Dockerfile` | 安装 curl、npm ci | healthcheck 和可复现构建 |
| `docker/docker-compose.prod.yml` | uploads 卷、443 端口 | 数据持久化、SSL 准备 |
| `docker/nginx.conf` | 默认 server 块 | 安全性 |
| `backend/src/config/env.ts` | PORT 8000→4000 | 匹配 docker-compose |
| `scripts/server-init.sh` | 移除 host Nginx、简化 | 架构调整 |
| `backend/prisma/migrations/20260222000800_add_two_factor_fields/migration.sql` | 新增迁移 | 补齐缺失字段 |

### Decisions Made

| Decision | Options | Rationale |
|----------|---------|-----------|
| SSH 密钥认证（非密码） | SSH Key vs Password | 腾讯云默认禁用密码认证 |
| 所有 docker 命令加 sudo | sudo vs 加入 docker 组 | docker 组需要重新登录，sudo 立即生效 |
| 仅用 Docker Nginx | Docker Nginx vs Host Nginx | 避免端口冲突 |

## Pending Work

### Immediate Next Steps

1. **修 P0 Bug #3** — API 全局超时：排查后端路由和数据库查询性能
2. **修 P1 Bug #1** — 用户列表过滤：后端 API 添加角色过滤，排除 CUSTOMER 角色
3. **修 P1 Bug #7** — 保险库上传：实现 `POST /api/documents/upload` 路由
4. **修 P1 Bug #9** — 联系表单 400：检查 leads webhook 字段校验
5. **修 P1 Bug #13** — 工作台数据为空：检查 Dashboard 查询逻辑

### Blockers/Open Questions

- [ ] 邮件服务 (Bug #10)：需用户决定使用哪个 SMTP 服务商（阿里云/SendGrid/其他）
- [ ] SSL 证书：尚未配置 HTTPS (Certbot)，目前只有 HTTP

### Deferred Items

- Bug #8 — 存储限额（5MB/100MB）需设计方案
- Bug #11 — 日历关联预约/任务（功能开发）
- Bug #12 — 客户画像增强（功能开发）

## Context for Resuming Agent

### Important Context

- **Bug 清单**在 artifact `bugs.md` 中，路径：`C:\Users\jiach\.gemini\antigravity\brain\7eed0aab-9a67-4da8-a645-452ceaf70295\bugs.md`
- **服务器 7.25GB 内存**，资源不是瓶颈，API 超时是代码问题
- **部署已成功运行**，所有容器正常，三个域名可访问
- **seed 数据已全部导入**（RBAC + 管理员 + 测试客户 + 苏大强 + FAQ）

### Assumptions Made

- 用户使用腾讯云轻量服务器，ubuntu 系统，Docker 预装
- 三个域名 (www/crm/portal).thny.sg 的 DNS 已指向服务器
- GitHub Packages 需要 DEPLOY_GHCR_TOKEN 拉取镜像

### Potential Gotchas

- 容器内运行 tsx 脚本 **必须** 放在 `/app/backend/prisma/` 下，不能放 `/tmp/`
- `prisma migrate deploy` 只应用已有迁移文件，不会自动生成新迁移
- deploy.yml 中 heredoc 在 YAML 多层缩进下会出问题，用逐行 echo 替代

## Environment State

### GitHub Secrets 配置

- `SERVER_HOST` — 服务器 IP
- `SERVER_USER` — ubuntu
- `SSH_PRIVATE_KEY` — 腾讯云绑定的 SSH 密钥
- `JWT_SECRET` / `DB_PASSWORD` — 应用密钥
- `DEPLOY_GHCR_TOKEN` — GitHub PAT (read:packages)

### Active Processes (Server)

- Docker Compose 运行中：postgres, redis, backend, website, management, portal, nginx
- 无 cron 或后台任务配置

## Related Resources

- [Implementation Plan](file:///C:/Users/jiach/.gemini/antigravity/brain/7eed0aab-9a67-4da8-a645-452ceaf70295/implementation_plan.md)
- [Bug List](file:///C:/Users/jiach/.gemini/antigravity/brain/7eed0aab-9a67-4da8-a645-452ceaf70295/bugs.md)
- [deploy.yml](file:///c:/Users/jiach/Documents/AntigravityCode/thny.sg/.github/workflows/deploy.yml)
- [docker-compose.prod.yml](file:///c:/Users/jiach/Documents/AntigravityCode/thny.sg/docker/docker-compose.prod.yml)
