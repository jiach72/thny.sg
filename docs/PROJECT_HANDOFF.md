# 通海南洋 (TongHai Nanyang) CRM 2.0 - 项目交接总结 (Handoff)

**更新日期**: 2026年02月  
**核心说明**: 本文档汇总了截至目前系统的**功能现状**、**架构实现**以及**最新升级成果**，作为项目后续开发与维护的单一真实数据源 (Single Source of Truth)。

---

## 1. 项目架构与技术栈

项目采用 **Monorepo (pnpm/npm workspaces)** 架构，实现了前后端分离的微服务化设计。

### 1.1 技术栈选型
| 分层 | 核心技术 | 说明 |
|------|----------|------|
| **Frontend** | Vue 3.4 + Vite 5.0 + TypeScript | 采用 Composition API 风格，Element Plus UI 组件库，Pinia 状态管理 |
| **Backend** | Node.js (Express 4.18) + TypeScript | 采用经典 Controller-Service-Repository 分层架构 |
| **Database** | PostgreSQL + Prisma ORM (v5.8) | 强类型数据校验，支持全量 migration |
| **Cache & WS** | Redis (ioredis) + Socket.io | 用于 Token 吊销、Dashboard 数据缓存、实时通知推送 |

### 1.2 后端目录规范
- `src/controllers/` - HTTP 请求层，负责参数提取与响应格式化
- `src/services/` - 核心业务逻辑层（通知调度、报表计算、工作流引擎等）
- `src/repositories/` - 数据库访问封装层（BaseRepository 抽象）
- `src/middlewares/` - 全局中间件（错误捕获、JWT鉴权、RBAC鉴权、统一验证）
- `src/config/` - 系统环境与第三方服务配置（Zod严格校验、Winston日志格式化）

---

## 2. 核心业务模块现状 (Capabilities)

系统底层的业务逻辑已非常完善，以下模块均已**完整实现并可用**：

1. **线索全生命周期管理 (Lead Management)**
   - 具备从录入、跟进 (Contacted, Qualified) 到转化 (Converted) 或流失 (Lost) 的全流程闭环。
   - 实现**线索智能打分引擎 (Scoring Service)** 及 **CSV 批量导入**功能。

2. **工作流自动化与分配引擎 (Workflow Engine)**
   - 支持基于规则的高级线索分配规则。
   - 包含销售团队工作负担 (Workload) 计算与自动调度算法。
   - 自动生成后续跟进待办与 SOP 序列任务。

3. **通信与通知中心 (Notification & Comm Center)**
   - 统一事件驱动的调度服务 (`notificationService.ts`)。
   - **WebSocket**: 实时前端推送弹窗机制 (`socket.io`)。
   - **站内消息**: `messageService` 实现的持久化公告与系统通知，支持未读计数。
   - **邮件系统**: 模板驱动 (`emailTemplateService`) 配合多云供应商驱动 (`emailSenderService` 支持 SMTP/SendGrid/SES)。

4. **数据洞察与报表 (Analytics & Export)**
   - `analyticsService` 实时计算销售漏斗转化率、团队绩效排名、渠道效果及未来流量预测。
   - 具备**全量业务数据导出**能力 (`exportService`)，支持线索、发票、审计日志转换为高规整度 Excel 下载。

5. **发票与收款管理 (Invoice & Payment)**
   - 高度标准化的财务模块，具备生成发票号、处理收款跟进、标记逾期计算的功能。

---

## 3. 最新升级成果 (CRM 2.0 Upgrade Phase 1 & 2)

在近期的系统重构中，移除了技术债，补充了大量企业级底层架构能力：

- ✅ **环境变量强校验**: 引入 Zod 解析 `config/env.ts`，Node 服务启动前会严格阻拦缺失或格式错误的配置（包括 SMTP、OpenAI 密钥等）。
- ✅ **Repository 模式重构**: 大范围消除了 Service 层直接高耦合调用 Prisma 对象的现象，引入了 `CustomerRepository`, `TaskRepository`, `ProjectRepository`。
- ✅ **OpenAPI (Swagger) 接入**: 核心路由已添加 JSDoc 装饰器，开发环境直接访问 `/api-docs` 查阅或调试接口。
- ✅ **Redis 高速缓存穿透保护**: `cacheService.ts` 实现了通用 `getOrSet` 原语，极大化解了 Dashboard 报表在高频刷新时给数据库造成的算力负担。
- ✅ **健康检查加强**: `/health` 端点已能联动反馈 PostgreSQL 和 Redis 的存活状态。

---

## 4. 后续演进建议 (Future Roadmap)

为进一步打造高可用企业级 SAAS 系统，建议后续阶段（原 Phase 3 规划）聚焦**系统可观测性 (Observability)** 与 **容灾可靠性 (Reliability)**：

1. **统一 HTTP 请求日志追踪**: 添加 `Winston+Morgan` 中间件追踪每一个 API 的耗时，并引入 UUID `RequestId` 贯穿整个日志链路。
2. **优雅停机 (Graceful Shutdown)**: 拦截 `SIGTERM` 信号以终止持久连接（等排队的 Web 请求刷满，断开 Socket 和 Redis 后最后交割 Prisma 查杀）。
3. **单元测试与 CI 门禁**: 为所有无状态的 Service（如最新加入的缓存与导出服务）撰写 Vitest / Jest 用例，配置 GitHub Action。

---

## 5. 开发快速启动

```bash
# 1. 安装项目所有依赖 (Monorepo 层级)
npm install

# 2. 准备环境变量 (参考 .env.example)
cp backend/.env.example backend/.env

# 3. 启动基础设施 (如果有 Docker)
docker-compose up -d postgres redis

# 4. 同步数据库
cd backend && npx prisma db push

# 5. 启动后端开发服务
npm run dev:backend
```
