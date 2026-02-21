# Handoff: 通海南洋 CRM Phase 2 完成与系统基线

## Session Metadata
- Created: 2026-02-20
- Project: `c:\Users\jiach\Documents\AntigravityCode\thny.sg`
- Branch: main (或本地工作区)
- Session duration: 约 2 小时

## Current State Summary

通海南洋 CRM 2.0 后端的 Phase 1 (基础强化) 和 Phase 2 (功能补齐) 已全面完成。后端现已具备强制环境变量验证、完善的核心模块 Repository 架构、跨渠道统一通知分发引擎 (WS/内置消息/邮件)、防穿透的 Redis 缓存层，以及全量的 Excel 数据导出能力。原 `docs` 目录下的过往架构蓝图和由于实际进度更新而失效的需求文档已经被清理干净，本交接文档与 `docs/PROJECT_HANDOFF.md` 为当前系统能力与上下文的唯一真实数据源。

## Codebase Understanding

### Architecture Overview

本系统采用基于 npm workspaces 的 Monorepo 架构开发，子包包括 website、management、customer-portal、shared 及 backend。
后端 (backend) 强依赖 Node.js (Express) + TypeScript，底层数据持久化通过 Prisma 5.8 与 PostgreSQL 通信，并配置了 Redis 处理缓存和实时通知。
核心分层为 `Routes` -> `Middlewares` (身份、Zod参数验证、错误兜底) -> `Services` (业务核心逻辑) -> `Repositories` (统一数据库出入口)。

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `backend/src/services/notificationService.ts` | 统一事件调度中心 | 将诸如“线索分配”、“发票付款”等不同业务流转事件，分别推向 WS、消息盒子和邮件，所有对外通知必经此处。 |
| `backend/src/services/exportService.ts` | 数据导出服务 | 集成 `exceljs`，提供线索、发票、审计流的表格文件生成逻辑。 |
| `backend/src/services/cacheService.ts` | 统一高级缓存层 | 实现 `getOrSet` 缓存穿透防范范式，被用于保护极高昂计算逻辑（如仪表盘统计）对性能的影响。 |
| `backend/src/config/env.ts` | 环境变量边界防御 | 依托 Zod Schema 进行初始化校验，拒绝不合规的配置启动 Node 服务器。 |

### Key Patterns Discovered

1. **Repository 隔离模式:** 切勿在新的 Service 逻辑中直接调用 `prisma.*.findMany` 等源发操作。核心实体一律调用对应的 Repository（例如 `CustomerRepository.ts`），以利用基类 `BaseRepository` 中封装好的过滤、分页与统一返回结构。
2. **驱动响应式通知:** 当新开业务需触发用户强提示时，直接调用 `notificationService.dispatch()`，无需考虑底层的 Websocket 实现逻辑。
3. **缓存前置策略:** 数据大屏 (Analytics) 的逻辑非常消耗 DB 时间片，一定要经过 `cacheService.getOrSet` 并设定 5-10 分钟 TTL 过期。

## Work Completed

### Tasks Finished

- [x] Phase 1: 增加了环境变量强校验保护（在 `env.ts` 内通过 Zod 解析）。
- [x] Phase 1: 将 Customer、Task 与 Project 添加了 Repository 层分离改造。
- [x] Phase 1: 为底层标准核心路由打上了 JSDoc 并引入 Swagger 页面。
- [x] Phase 2: 开发了跨越三端的 `notificationService.ts` 通知调度服务。
- [x] Phase 2: 开发了基于流的独立 `exportService.ts` Excel 下载模块。
- [x] Phase 2: 为 Dashboard 的安全并发能力配置了 `cacheService.ts` (Redis)。
- [x] 架构清理: `docs/CRM.md`（极巨型已过时 PRD）等 7 份冗余干扰型文档已被强制删除。

### Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `backend/src/config/env.ts` | 增加 Zod 类型化规则 | 强制启动检查，规避生产因 `.env` 问题引发隐性漏洞 |
| `backend/src/routes/export.ts` | 新增下载 API | Frontend 前端面板可以对接数据落盘操作 |
| `backend/src/services/notificationService.ts` | 从零设立中心路由 | 让邮件与站内信等系统彻底解耦 |

### Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| 重拳清空旧版技术蓝图与陈旧 PRD (`docs/*.md`) | 保留作为历史参考档案 | 它们的内容极易污染诸如 Claude 等上下文窗口模型的记忆判断，重置是为了给未来的 Agent 放手编程建立零歧义干净环境。 |

## Pending Work

### Immediate Next Steps

1. [配置全路由覆盖的 HTTP 请求响应日志拦截统计（引入 Morgan 结合当前 Winston）]
2. [实现 Node.js 退出机制时的优雅停机 (Graceful Shutdown) 以按序关闭 Socket、Redis 及 Prisma 连接]
3. [为 Phase 2 新引入的服务撰写全面的 Vitest 单元测试覆盖防侧漏]

### Blockers/Open Questions

- [ ] Question: 遗留了原 Phase 3 的基础建设（见 Next Steps），后续是由用户端人工补全对应前端的 UI，还是继续指派 AI 直接完成基础设施（日志/停机/单元测试）的收尾工作？ - Suggested: 请求使用者给出下步明确重心指令。

## Context for Resuming Agent

### Important Context

接手本项目的 Agent 应当熟知，目前大范围的业务功能 CRUD（用户、角色、报表导出、邮件生成、线索自动化分配评分）均已完全建构完毕并高度可用。绝不可盲目自我推断并重建诸如邮件通知、导出、查询过滤等模块机制。若需查询系统的实现程度全貌，**仅仅**参阅 `docs/PROJECT_HANDOFF.md` 以及本 Handoff。

### Assumptions Made

- 假设下一个 Session 接手的 Agent 能够更从容地围绕项目最后的基础可用与质量红线去冲刺，并优先聚焦代码的测试保护机制。
- 假设所有的操作严格遵偱已设定的全中文响应需求设定。

### Potential Gotchas

- **软删除隐形雷区:** 原本设计的系统中很多数据包含 `deletedAt` 软删除字段，通过 BaseRepository 查询已默认包裹过此条件，再次重复叠加 `prisma` 裸查极易破坏逻辑并取回僵尸数据。
- **环境必填项:** 请切记无论扩展了什么需要依赖外界凭证（API Token/密钥）的业务逻辑，**必须**回补 `src/config/env.ts`，Node 服务器具有“无凭证不点火”机制。

## Environment State

### Tools/Services Used

- Node.js (Express), Prisma 5.8 数据库引擎, ioredis 内存加速, Socket.io, Vitest, Zod, ExcelJS。

### Environment Variables

- `DATABASE_URL`、`REDIS_URL`、`JWT_SECRET`、`SMTP_HOST` 及 `SMTP_USER` 等。相关校验逻辑写在 `env.ts` 中。

## Related Resources

- `docs/PROJECT_HANDOFF.md` (总览)
- `backend/package.json`
