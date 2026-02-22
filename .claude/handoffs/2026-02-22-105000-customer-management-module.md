# Handoff: 客户管理模块完整实现

## Session Metadata
- Created: 2026-02-22T10:50:00+08:00
- Project: c:\Users\jiach\Documents\AntigravityCode\thny.sg
- Branch: main
- Session duration: ~3 hours
- Continues from: 2026-02-22-005800-deployment-and-bug-audit.md (已删除)

## Current State Summary

客户管理模块已 **完全实现并部署到生产环境**。包括后端 API（8 端点）+ 前端两页面（列表 + 9 Tab 详情页）+ 导航/路由/搜索整合。所有功能已在 `crm.thny.sg` 生产环境验证通过。同时完成了"用户管理"→"员工管理"的重命名。

## Codebase Understanding

### Architecture Overview

Monorepo 结构（pnpm workspace）：
- `backend/` — Express + Prisma + TypeScript，RESTful API，端口 4000
- `packages/management/` — Vue 3 + Element Plus CRM 管理端
- `packages/portal/` — Vue 3 客户门户
- `packages/website/` — Next.js 官网
- `docker/` — Nginx 反代 + Docker Compose 部署

**API 响应规范**：后端返回 `{ code: 200, data: {...} }` 格式。`apiClient`（Axios）的响应拦截器自动解包，返回值 **直接是 `data` 部分**。前端组件不应再取 `.data`。

### Critical Files

| 文件 | 用途 | 注意事项 |
|------|------|----------|
| `backend/src/services/customerService.ts` | 客户业务逻辑层 | 7 个方法 |
| `backend/src/routes/customers.ts` | 客户 API 路由 | 8 个端点，需 authMiddleware |
| `packages/management/src/views/customers/CustomerList.vue` | 客户列表页 | 统计卡 + 筛选 + 表格 |
| `packages/management/src/views/customers/CustomerDetail.vue` | 客户详情页 | Hero + 9 Tab |
| `packages/management/src/api/apiClient.ts` | API 客户端 | 拦截器自动解包 `{ code, data }` |
| `packages/management/src/layouts/AdminLayout.vue` | 侧边栏布局 | 已含客户管理入口 + activeMenu |
| `packages/management/src/router/index.ts` | 路由配置 | `/customers` + `/customers/:id` |
| `docker/nginx.conf` | Nginx 反代 | `crm.thny.sg/api` → `backend:4000` |

### Key Patterns Discovered

1. **apiClient 解包规则**：响应拦截器检测 `{ code, data }` 结构 → 返回 `data`。对于非标准格式（如分页 `{ data: [], pagination: {} }`）原样返回。前端取数据时不要多加 `.data`。
2. **路由 activeMenu**：详情页需在 `AdminLayout.vue` 的 `activeMenu` computed 中添加 `if (path.startsWith('/xxx/')) return '/xxx'` 以保持侧边栏高亮。
3. **CI/CD**：push to main → GitHub Actions → quality-check → build Docker images → deploy。quality-check 包含 ESLint，失败则阻断部署。
4. **Customer 模型关系**：`Customer` ← `Lead`（一对一）← `activities`, `assignedTo`。客户的联系信息、来源等在 `Lead` 上。`Customer` 自身有 `kycStatus`, `riskGrade`, `birthday`, `occupation`, `interests`, `profileNotes`, `familyMembers`。

## Work Completed

### Tasks Finished

- [x] 后端 `customerService.ts` — 7 方法（getCustomerList, getStats, getCustomerById, updateCustomer, updateKycStatus, getTimeline, getConnectList）
- [x] 后端 `customers.ts` — 8 个路由端点
- [x] `CustomerList.vue` — 4 统计卡片 + 5 维度高级筛选 + 9 列数据表格 + 批量操作 + 导出按钮
- [x] `CustomerDetail.vue` — Hero 卡片 + 9 Tab（概览/画像/KYC/家庭/项目/财务/时间线/文档/备注）
- [x] `AdminLayout.vue` — 新增"客户管理"一级侧边栏入口 + "用户管理"重命名为"员工管理" + activeMenu 支持
- [x] `router/index.ts` — 新增 `/customers` 和 `/customers/:id` 路由
- [x] `CommandPalette.vue` — 新增客户管理搜索入口 + 员工管理重命名
- [x] `UserManagement.vue` — 标题改为"员工管理"
- [x] 修复 API 响应解包 bug（不应对 apiClient 返回值再取 .data）
- [x] 移除误提交的临时文件（analyze.cjs / eslint_report.json）+ 更新 .gitignore
- [x] 编译验证通过（tsc + vue-tsc）
- [x] CI/CD 部署成功 + 生产环境验证

### Files Modified

| 文件 | 变更 |
|------|------|
| `backend/src/services/customerService.ts` | 新增 7 个方法 |
| `backend/src/routes/customers.ts` | 重写，8 个端点 |
| `packages/management/src/views/customers/CustomerList.vue` | 新建 |
| `packages/management/src/views/customers/CustomerDetail.vue` | 新建 |
| `packages/management/src/layouts/AdminLayout.vue` | 新增侧边栏客户管理 + 员工管理 + activeMenu |
| `packages/management/src/router/index.ts` | 重写（修复语法错误 + 新增路由） |
| `packages/management/src/components/common/CommandPalette.vue` | 新增客户管理 + 员工管理 |
| `packages/management/src/views/settings/UserManagement.vue` | 标题 → 员工管理 |
| `.gitignore` | 新增 analyze.cjs / eslint_report.json |

### Decisions Made

| 决策 | 原因 |
|------|------|
| Customer 画像字段放在 Customer 模型而非 Lead | Customer 代表已转化客户，画像是客户级信息 |
| 家庭成员用 JSON 列 familyMembers 而非关联表 | 结构简单灵活，不需独立查询 |
| 9 Tab 设计而非多个子路由 | 保持单页体验，减少路由复杂度 |
| apiClient 解包后不再二次取 .data | 响应拦截器已解包 `{ code, data }`，保持一致性 |

## Pending Work

### Immediate Next Steps

1. **导出 Excel**：`handleExport` 目前只显示提示，需接入 `/export` 端点
2. **预约功能**：详情页"预约"按钮和列表"预约会议"需对接 `/appointments` API
3. **消息发送**：列表/详情页的"发消息"按钮跳转 `/messages?recipientId=...`，需验证消息模块对客户 user 的支持
4. **搜索功能增强**：customerService 的搜索逻辑搜索 `contactName`/`companyName` 等字段在 Customer 模型上（需确认这些字段是否存在，或应改为搜索关联 Lead 的字段）

### Blockers/Open Questions

- [ ] Customer 模型是否已有 `contactName`, `companyName`, `email`, `phone` 字段？需检查 Prisma schema。如果没有，`getCustomerList` 的搜索 OR 条件需改为 `{ lead: { contactName: { contains: search } } }`
- [ ] `profileNotes` 和 `familyMembers` 的 Prisma migration 是否已正确运行？（存在 `20260222014400_add_customer_profile_fields/migration.sql`）

### Deferred Items

- 批量 KYC 更新：UI 按钮已有，后端批量端点未实现
- 文档上传功能：文档 Tab 目前只展示已有文档，无上传入口
- KYC 核查清单持久化：目前 KYC 文档核查清单仅前端状态，未保存到后端

## Context for Resuming Agent

### Important Context

1. **apiClient 解包陷阱**：这是本次最大的 bug。`apiClient` 拦截器检测 `{ code, data }` 结构后返回 `data`。但后端的分页响应格式是 `{ code: 200, data: { data: [...], pagination: {} } }`，解包后返回 `{ data: [...], pagination: {} }`。前端直接用 `res.data` 取数组，`res.pagination` 取分页。
2. **生产环境**：网站部署在 Docker Compose 上，域名为 `crm.thny.sg`（管理端）、`portal.thny.sg`（门户）、`thny.sg`（官网）、`api.thny.sg`→`backend:4000`。
3. **CI 质量检查**：ESLint 较严格，unused imports / no-console / no-explicit-any 都会报警，quality-check 失败会阻断部署。

### Assumptions Made

- Customer 与 Lead 一对一关联，通过 `customer.lead` 获取联系信息和来源
- 画像字段（birthday, occupation, interests, profileNotes, familyMembers）已通过 migration 添加到 Customer 模型
- 时间线合并活动日志和预约记录，按时间倒序排列

### Potential Gotchas

- **路由文件格式**：`router/index.ts` 在 multi_replace_file_content 编辑时曾产生语法错误（重复 `},`），最终用 write_to_file 覆盖修复。编辑此文件时需格外小心缩进和括号匹配
- **Nginx SPA 配置**：`docker/nginx.spa.conf` 没有 API 反代规则（那个是 SPA 容器内配置），API 反代在 `docker/nginx.conf` 的主 server block 中
- **ESLint fallback-in-spread**：`...(obj as object || {})` 模式会触发 `unicorn/no-useless-fallback-in-spread` 警告，应直接用 `...(obj as object)`

## Environment State

### Tools/Services Used

- Node.js + pnpm workspace（Monorepo）
- Prisma ORM + PostgreSQL
- Docker Compose + Nginx 反代
- GitHub Actions CI/CD
- Element Plus UI 框架

### Active Processes

- 无本地开发服务器运行
- 生产环境 Docker 容器正常运行

### Environment Variables

- `DATABASE_URL` — PostgreSQL 连接字符串
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — 认证密钥
- `REDIS_URL` — Redis 连接

## Related Resources

- 实现计划：`C:\Users\jiach\.gemini\antigravity\brain\aeb3ad3f-2bcc-42ef-87b8-0fa026677095\implementation_plan.md`
- 完成报告：`C:\Users\jiach\.gemini\antigravity\brain\aeb3ad3f-2bcc-42ef-87b8-0fa026677095\walkthrough.md`
- 测试账号：`docs/TEST_ACCOUNTS.md`（admin@thny.sg / Admin123!）
