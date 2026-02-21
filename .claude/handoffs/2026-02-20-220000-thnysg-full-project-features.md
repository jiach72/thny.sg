# Handoff: 通海南洋 CRM 全系统功能盘点与交接总结

## Session Metadata
- Created: 2026-02-20
- Project: `c:\Users\jiach\Documents\AntigravityCode\thny.sg`
- Branch: main (或本地工作区)
- Context: 全系统现有功能深度盘点 (Full Features Audit Handoff)

## Current State Summary

本作是一份**全景式的项目功能交接档案**。目前通海南洋 (TongHai Nanyang) CRM 2.0 系统在技术架构（Monorepo 前后端分离）、核心数据层（PostgreSQL + Prisma）、以及缓存/实时机制（Redis + Socket.io）上已构建完毕并高度成熟。本系统涵盖了以销售线索 (Lead) 为核心从录入到成单的全生命周期管理，配有自动化工作流引擎、智能化打分机制、全渠道通信中心、多维报表分析乃至文件与财务发票模块。

## 系统全量功能清单 (Capabilities & Features)

### 1. 线索池与客户库管理 (Lead & Customer Mgmt)
系统提供标准化的 CRM 销售管线：
- **线索全生命周期状态机**: 新建 (New) -> 已联系 (Contacted) -> 合格 (Qualified) -> 方案 (Proposal) -> 谈判 (Negotiation) -> 转化 (Converted) / 丢失 (Lost)。
- **智能评分引擎 (Scoring Service)**: 动态规则集计算，基于互动频率、字段完整度、跟进反馈等为客户质量自动打分评级。
- **批量作业**: 支持标准的 CSV 格式线索列表解析与批量导入 (`leadService.importLeads`)。
- **关联拓展**: 一次转化为 Customer 后，业务线横向延伸至项目 (Project) 与联系人池。

### 2. 调度与工作流引擎 (Workflow & Automation)
化解人力瓶颈的后端核心算力模块：
- **动态线索分配**: 融合了销售人员当前工作负载 (Workload)、客户所属地域、行业匹配度等多维规则引擎计算的最优接单人分配机制。
- **SOP 检核清单流**: 当销售阶段发生跃迁（如进入 Proposal 阶段），系统会自动派发下一阶段必备的关联 Task 待办事项，形成强制推进闭环。
- **自动逾期清退**: 定时任务 (`schedulerService`) 检测久未跟进的死线索进入沉睡池。

### 3. 多渠道通知与通信中枢 (Communication Center)
以 `notificationService.ts` 领衔的跨时空触达中心：
- **系统内实时推送**: 依托 `Socket.io` 为登录用户播发类似 Web 弹窗或未读红点（针对线索分发、任务到期、文件变更等 10+ 种标准内部事件）。
- **永久站内信盒子**: `messageService` 处理的长效系统公告与操作轨迹流记录。
- **富文本邮件网关**: `emailTemplateService` 配合多云供应商驱动 (`emailSenderService` 支持 SMTP/SendGrid 等)。具备变量（如 `{UserName}`、`{InvoiceNo}`）的编译与群发能力。

### 4. 深度洞察与数据报表 (Analytics & Dashboard)
管理层的数字大屏能力：
- **销售漏斗与成单率计算**: 贯穿全时间的管线健康度与阶段转化率动态透视。
- **员工绩效风向标**: 按期统计座席跟进数、成单金额占比、逾期任务率的复合分析。
- **高性能 Redis 缓存层**: 报表计算均受 `cacheService.ts` 穿透保护，化解了多用户高频查看 Dashboard 导致的拖垮数据库灾难。
- **数据合规导出**: 提供高规整度的 Excel 文件流转换功能，可按日期切片导出 Leads（线索）、Invoices（发票）与 Audit Logs（系统审计日志）。

### 5. 财务发票体系 (Invoicing & Financial)
- **商机变现管理**: 发票全周期状态追踪（Draft -> Sent -> Paid -> Overdue -> Canceled）。
- **核帐单品跟踪**: 对明细项目（单价/数量）汇总，生成标准化结构数据供外部（或跨系统）对账。

## Codebase Understanding

### Architecture Overview

- **代码组织**: pnpm Workspace (Monorepo) 模式。前端包括 `website`、`management` 仪表盘、`customer-portal`；中间由 `shared` 包连接 DTO/Types；后端应用名 `@tonghai/backend`。
- **数据流转**: 后端 Express 请求通过校验后触达 `Service`。Service 层**严禁直接穿透**，均通过 `Repositories` 目录下的代理类访问 DB Prisma (包含软删除截获等底层魔法)。
- **守门机制**: 中间件组装严密。带有 `X-Request-ID` 注入、全局异常捕获过滤（AppError 等级分类）、环境强硬 Zod 验证体系（在 `src/config/env.ts` 内断言必需密钥）。

### Key Patterns Discovered

1. **缓存前置范式**: 对 `analyticsService` 请求与大量列表，普遍使用被预置好的 `cacheService.getOrSet('key', TTL, async () => { ... })` 方法包裹查询，后续来者亦应当坚守此规范。
2. **Repository 接口统一化**: 新增基础模块如若涉及数据表，必须遵循沿袭 `BaseRepository` 的创建原则，以获得一揽子的分页、事务控制、关联嵌套查询红利。
3. **安全准出**: 所有向 C 端发出的邮件与信件业务，永远不要调包发件对象，直接透传参数给 `notificationService.dispatch()` 完成事件包装。

## Pending Work / Roadmap

**如果开启新的需求篇幅或 Sprint，您可能需要完成这几处最后一公里的工程建设：**
1. **统一端点请求日志 (HTTP Request Logging)**: 当前日志库使用 Winston 打印控制信息。需要补齐类似 Morgan 的能力捕捉所有接口的用时分布、命中状态等行为特征（可观测性补缺）。
2. **平滑的优雅停机 (Graceful Shutdown)**: 给 `index.ts` 追加系统中止监听（`SIGTERM`），让服务器进程在毁灭前有尊严地断开 Redis 并排空待办网络事务，不暴力切断数据库。
3. **单元基准验证 (Vitest Coverage)**: 面向近期新追加的 `notificationService` 与 `cacheService` 添加业务单元护城河（已存在完整的 8 份早期测试用例供仿写参考）。

## Environment State

- 运行时：Node 18+ (使用 tsx 驱动)
- 存储库：Postgres 15+, Redis 7+
- 依赖树：Vitest, Prisma 5, Zod, Socket.io, Exceljs
- 核心变量参考：`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `SMTP_HOST`, `FRONTEND_URL`（全部要求写死验证并加载完毕方可放行服务）。
