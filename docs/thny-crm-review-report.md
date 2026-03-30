# 通海南洋 CRM 项目审阅报告

> **项目**: tonghai-nanyang (thny.sg)  
> **类型**: 全栈 CRM 系统（公司服务型 CRM，服务新加坡企业客户）  
> **审阅日期**: 2026-03-20  
> **审阅范围**: 代码结构、架构设计、安全性、性能、可维护性  
> **⚠️ 注意**: 本报告仅做审查，未修改任何代码

---

## 1. 项目概览

### 架构总览

```
thny.sg/
├── backend/          → Express + Prisma + PostgreSQL + Redis
├── packages/
│   ├── website/      → 公司官网 (Vue 3 + vite-ssg SSG)
│   ├── management/   → CRM 管理后台 (Vue 3 + Element Plus)
│   ├── customer-portal/ → 客户门户 (Vue 3 + Tailwind + Lucide)
│   └── shared/       → 共享代码
├── docker/           → Docker Compose (Postgres + Redis)
├── k8s/              → Kubernetes 配置
└── design-system/    → 设计系统文档
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Express 4, TypeScript, Prisma ORM, PostgreSQL, Redis |
| 管理端 | Vue 3, Element Plus, ECharts, Pinia, vue-i18n |
| 客户门户 | Vue 3, Element Plus, Tailwind CSS, Lucide Icons |
| 官网 | Vue 3, vite-ssg (SSR/SSG), Element Plus |
| 实时通讯 | Socket.io, WebSocket |
| 部署 | Docker Compose, Kubernetes |
| 监控 | Sentry, Winston 日志 |

### 数据模型规模

Prisma Schema 约 **1179 行**，包含 **30+ 个数据模型**，覆盖：

- **核心 CRM**: Lead, Customer, Project, Task, Document
- **RBAC 权限**: Role, Permission, RolePermission（数据表驱动，非枚举）
- **通讯**: Message, ChatSession, ChatMessage（AI 聊天机器人）
- **财务**: Invoice, Payment, PaymentGatewayTransaction, Claim（报销）
- **工作流**: WorkflowDefinition, WorkflowExecution
- **新闻**: RssFeed, NewsArticle, FaqItem
- **供应商**: Vendor, VendorAssignment
- **审计**: AuditLog, WebhookEndpoint/Log
- **其他**: SignatureRequest, MeetingRoom, MeetingMinutes, ScoringRule

---

## 2. ✅ 做得好的地方

### 2.1 架构规范
- **Monorepo 工作区**结构清晰，前后端分离良好
- 后端采用 **MVC 分层** (controllers → services → repositories)，职责分明
- RBAC 使用**数据表驱动**而非硬编码枚举，灵活度高，适合扩展

### 2.2 安全措施到位
- JWT + Refresh Token 双令牌机制
- Token 黑名单（Redis）支持登出失效
- bcrypt 密码哈希
- API 全局限流 (express-rate-limit, 100次/分钟/IP)
- CORS 白名单配置
- 审计日志全覆盖
- Sentry 错误监控集成
- 支持 2FA (TOTP)

### 2.3 运维友好
- **平滑退出** (Graceful Shutdown) 处理完善：HTTP 关闭 → Redis → Prisma
- 数据库连接**带重试**（5次重试 + 3秒间隔）
- Redis 降级模式（失败不阻断启动）
- 邮件服务降级（失败不阻断启动）
- Morgan + Winston 双重日志
- 健康检查端点 `/health` 含数据库和 Redis 状态
- API 版本控制中间件

### 2.4 前端设计
- 管理后台功能齐全：Dashboard、销售漏斗、线索管理、项目管理、财务、报销等
- 客户门户独立部署，与管理端解耦
- 官网 SSG 渲染（SEO 友好）
- 多语言支持 (vue-i18n)
- 设计系统文档完善（Liquid Glass 风格、色彩/字体/响应式规范）

### 2.5 业务功能丰富
- **线索评分系统** (ScoringRule) — 可配置规则自动评分
- **工作流引擎** — 可视化流程定义 + 自动执行
- **AI 聊天机器人** — 集成 OpenAI，FAQ 知识库 + 未识别问题追踪
- **RSS 新闻聚合** — 自动抓取行业资讯
- **报销流程** — 完整的多级审批链
- **电子签署** — DocuSign 集成
- **Webhook 事件推送** — 外部系统集成

---

## 3. ⚠️ 问题与风险

### 3.1 🔴 构建失败（网站）

**严重程度：高**

`packages/website` 构建失败，报错：

```
Error: [vite-ssg] Error on page: about
TypeError: DOMPurify.sanitize is not a function
```

**原因分析**：vite-ssg 在 SSR 环境下，DOMPurify（依赖浏览器 DOM）无法直接调用。需要使用 `isomorphic-dompurify` 或在 SSR 中做条件导入。

**影响**：官网静态页面无法通过 SSG 构建生成，可能导致部署的不是最新版本。

**建议**：将 DOMPurify 改为动态导入或使用 SSR 兼容方案：
```typescript
const sanitize = (html: string) => {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html)
  }
  return html // SSR 降级
}
```

### 3.2 🔴 测试用例失败

**严重程度：中高**

`notificationService.test.ts` 测试失败：

```
ReferenceError: Cannot access 'mockMessageService' before initialization
```

**原因**：`vi.mock` 是 hoisted 的，但 factory 函数中引用了尚未初始化的变量。这是 Vitest 的常见陷阱。

**建议**：在 `vi.mock` factory 中使用 `vi.fn()` 直接创建 mock，而不是引用外部变量。

### 3.3 🟡 单一 JS 包体积过大

**严重程度：中**

管理后台主包 `app-xxx.js` 达到 **1,222 KB**（gzip 后 410 KB），构建警告：
> Some chunks are larger than 500 kB after minification

**影响**：首屏加载慢，尤其在移动网络环境下。

**建议**：
- 路由懒加载（动态 `import()`）
- Element Plus 按需引入
- ECharts 按需引入
- 配置 `rollupOptions.output.manualChunks` 拆分 vendor 包

### 3.4 🟡 硬编码凭据风险

**严重程度：中**

- `docker-compose.yml` 中 PostgreSQL 密码硬编码为 `crm_password`
- `.env.example` 中 JWT_SECRET 写的是 `your-super-secret-jwt-key-change-in-production`

虽然 `.env` 不在 Git 中，但 docker-compose 文件通常会被提交。

**建议**：
- docker-compose 使用 `${POSTGRES_PASSWORD}` 环境变量
- 确保 `.env` 已加入 `.gitignore`

### 3.5 🟡 软删除模式不统一

**严重程度：低**

部分模型有 `deletedAt` 字段实现软删除（Lead, Customer, Project, Task, Document），但不是所有模型都有。查询时需要确保每次查询都加 `deletedAt: null` 过滤，否则可能泄露已删除数据。

**建议**：
- 使用 Prisma Middleware 统一过滤软删除记录
- 或创建 Prisma 扩展自动追加 `where: { deletedAt: null }`

### 3.6 🟡 错误日志空

**严重程度：低**

`backend/error.log` 实际上是 Vitest 的测试输出，不是运行时错误日志。Winston 日志系统已配置 `winston-daily-rotate-file`，但需要确认日志目录权限和磁盘空间监控。

### 3.7 🟡 依赖版本注意

| 依赖 | 当前版本 | 注意事项 |
|------|----------|----------|
| Prisma | 5.8.0 | 较旧，新版有性能改进 |
| Express | 4.18.2 | Express 5 已发布，但升级需评估 |
| Node.js | v24.13.0 (构建环境) | 注意与部署环境版本一致 |
| TypeScript | 5.3.3 | 可以升级到 5.4+ |

---

## 4. 📋 改进建议（优先级排序）

### P0 — 必须修复
1. **修复官网 SSG 构建** — DOMPurify SSR 兼容问题
2. **修复测试失败** — notificationService mock 问题
3. **确认 `.env` 在 `.gitignore` 中** — 防止密钥泄露

### P1 — 应该改进
4. **JS 包体积优化** — 路由懒加载 + 按需引入
5. **统一软删除过滤** — Prisma Middleware
6. **Docker Compose 密码外部化** — 环境变量注入

### P2 — 可以优化
7. **Prisma 版本升级** — 5.x → 最新稳定版
8. **添加 E2E 测试** — 目前只有单元测试
9. **API 文档完善** — Swagger 已集成但需确认覆盖率
10. **监控报警** — Sentry 已集成，考虑添加业务指标报警

---

## 5. 安全评估

| 维度 | 状态 | 说明 |
|------|------|------|
| 认证 | ✅ 良好 | JWT + Refresh + 黑名单 + 2FA |
| 授权 | ✅ 良好 | RBAC 数据表驱动，细粒度权限 |
| 输入校验 | ⚠️ 待确认 | 使用了 express-validator 和 zod，需确认覆盖面 |
| 速率限制 | ✅ 良好 | 全局 + 可扩展 per-route |
| 日志审计 | ✅ 良好 | AuditLog 覆盖关键操作 |
| CORS | ✅ 良好 | 白名单配置 |
| 文件上传 | ⚠️ 待确认 | 使用 multer，需确认文件类型/大小限制 |
| SQL 注入 | ✅ 安全 | Prisma ORM 参数化查询 |
| XSS | ⚠️ 注意 | 官网 DOMPurify 问题待修复 |

---

## 6. 总结

这是一个**功能相当完整的中大型 CRM 系统**，架构设计合理，安全措施到位，业务功能覆盖面广。主要问题集中在：

1. **构建/测试问题**（官网 SSG 构建失败 + 测试 mock 失败）— 需优先修复
2. **前端性能**（包体积过大）— 需做代码分割
3. **运维细节**（Docker 密码、软删除统一）— 需要完善

整体代码质量良好，分层清晰，有良好的降级策略和错误处理。如果上述 P0 问题修复后，这个系统可以稳定运行。

---

*报告由 OpenClaw AI 生成，仅基于静态代码分析，未进行运行时测试或渗透测试。*
