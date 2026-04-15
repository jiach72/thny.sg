<!-- OPENSPEC:START -->
# 通海南洋 CRM — 子代理系统规范

> 本文档定义了项目中所有子代理（Sub-Agent）的调用流程、技能关联方式、触发条件、
> 交接机制及记忆持久化方案。开发人员可直接依据本文档实现完整的子代理调用链路。
>
> **文档版本**: v2.1 | **更新日期**: 2026-04-07 | **审核状态**: 已通过

---

## 目录

1. [语言偏好设置](#1-语言偏好设置)
2. [子代理功能描述与接口规范](#2-子代理功能描述与接口规范)
3. [完整调用链路设计](#3-完整调用链路设计)
4. [技能与代理映射关系表](#4-技能与代理映射关系表)
5. [技能评估与优化记录](#5-技能评估与优化记录)
6. [更新交接流程](#6-更新交接流程)
7. [记忆持久化方案](#7-记忆持久化方案)
8. [OpenSpec 工作流程](#8-openspec-工作流程)

---

## 1. 语言偏好设置

**默认使用中文**：除非明确说明使用英文，否则所有输出都应使用中文，包括：
- 文档内容
- 代码注释
- 提交信息
- 规范说明
- 交接文档

---

## 2. 子代理功能描述与接口规范

### 2.1 代理总览

| 代理标识 | 类型 | 功能描述 | 触发条件 |
|----------|------|----------|----------|
| `search` | 通用 | 跨模块代码/文档搜索，组合多种搜索工具定位信息 | 高层概念查询、跨目录搜索、关键词模糊 |
| `saas-architect-product-manager` | 专用 | SaaS 产品架构设计、多租户方案、RBAC 权限系统 | 设计 SaaS 架构、需求模糊需技术设计文档 |
| `senior-frontend-expert` | 专用 | React/Vue + TypeScript 前端开发，类型安全 UI 组件 | 前端功能开发、组件重构、API 集成 |
| `backend-api-engineer` | 专用 | 后端服务与 API 开发，认证授权，业务逻辑实现 | 后端 API 构建、认证授权、业务逻辑重构 |
| `dba-devops-engineer` | 专用 | 数据库 Schema 设计、迁移脚本、Docker/K8s 容器化 | 数据库设计、迁移脚本、容器化部署 |
| `security-code-reviewer` | 专用 | 安全审计、OWASP 漏洞检测、STRIDE 威胁建模 | 安全审查、漏洞检测、跨租户权限校验 |
| `blockchain-development-expert` | 专用 | 智能合约、Web3 钱包集成、DeFi 协议 | 区块链开发、Web3 集成 |
| `quantitative-developer` | 专用 | 算法交易系统、交易所 API、量化策略实现 | 交易系统开发、回测框架 |

### 2.2 接口规范

所有子代理通过 `Task` 工具统一调用，遵循以下接口约定：

```
Task(
  subagent_type:  string,      // 代理标识（见上表）
  description:    string,      // 3-5 词简短描述
  query:          string,      // ≤30 词的任务描述
  response_language: string    // 响应语言
)
```

#### 输入参数规范

| 参数 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `subagent_type` | string | 必填，必须为上表中的有效标识 | 选择匹配任务领域的代理 |
| `description` | string | 必填，3-5 个词 | 用于日志和追踪的简短标签 |
| `query` | string | 必填，≤30 词 | 明确的任务需求，禁止模糊描述 |
| `response_language` | string | 必填 | 通常为 `zh-CN` 或 `en` |

#### 输出规范

每个子代理返回**单条消息**作为最终结果，包含：
- 执行结果摘要
- 修改的文件列表（如有）
- 发现的问题或建议（如有）
- 验证结果（如已执行测试）

#### 调用约束

1. **无状态性**：每次调用独立，代理无法访问前次调用的上下文
2. **单次通信**：调用后无法向代理追加消息，必须在 `query` 中提供完整上下文
3. **并行安全**：多个代理可并行调用，但不得操作相同文件
4. **结果信任**：代理输出应被信任，但关键变更仍需验证

---

## 3. 完整调用链路设计

### 3.1 标准调用流程

```
┌─────────────────────────────────────────────────────────┐
│                    主代理 (Controller)                    │
│                                                         │
│  1. 接收用户请求                                         │
│  2. 分析任务类型，选择子代理                               │
│  3. 构造调用参数（含完整上下文）                           │
│  4. 调用 Task() 派发子代理                                │
│  5. 接收子代理返回结果                                    │
│  6. 验证结果，整合到主流程                                │
│  7. 如需后续处理，继续步骤 2                              │
└─────────────────────────────────────────────────────────┘
```

### 3.2 参数传递机制

子代理无法访问主代理的上下文窗口，因此参数传递遵循**全量上下文注入**原则：

```typescript
// 正确示例：在 query 中提供完整上下文
Task({
  subagent_type: "backend-api-engineer",
  description: "重构家庭成员API",
  query: "将 backend/src/services/portalService.ts 中的家庭成员管理从 JSON 字段迁移到独立的 FamilyMember 表。Schema 已定义在 prisma/schema.prisma，Repository 已创建在 src/repositories/FamilyMemberRepository.ts。请重构 portalService.ts 第 466-573 行的三个方法，使用 familyMemberRepository 替代直接 JSON 操作。",
  response_language: "zh-CN"
})

// 错误示例：依赖隐式上下文（子代理无法感知）
Task({
  subagent_type: "backend-api-engineer",
  description: "继续上面的重构",
  query: "继续完成之前提到的重构工作",
  response_language: "zh-CN"
})
```

**参数构造清单**：

| 信息类型 | 是否必须 | 说明 |
|----------|----------|------|
| 任务目标 | ✅ | 明确要完成什么 |
| 文件路径 | ✅ | 精确到行号范围 |
| 代码上下文 | ✅ | 相关代码片段或接口定义 |
| 约束条件 | 推荐 | 不得修改的范围、必须遵循的模式 |
| 预期输出 | ✅ | 返回内容的格式和范围 |

### 3.3 错误处理流程

```
子代理调用
    │
    ├── 成功 → 验证结果 → 整合到主流程
    │                    │
    │                    └── 验证失败 → 派发修复代理或手动修复
    │
    └── 失败（异常/超时）
         │
         ├── 可恢复错误 → 修正参数后重新派发
         │
         └── 不可恢复错误 → 主代理接管，手动处理
```

**错误分类与处理策略**：

| 错误类型 | 识别方式 | 处理策略 |
|----------|----------|----------|
| 参数不足 | 子代理返回模糊结果 | 补充上下文后重新派发 |
| 文件冲突 | 多代理修改同一文件 | 串行化执行，或拆分文件职责 |
| 编译错误 | typecheck/lint 失败 | 派发修复代理，提供错误信息 |
| 运行时错误 | 测试失败 | 派发调试代理，提供错误堆栈 |
| 超时 | 代理无响应 | 终止后简化任务重新派发 |

### 3.4 串行 vs 并行决策矩阵

| 条件 | 策略 | 示例 |
|------|------|------|
| 任务间无依赖 | **并行** | 同时修复 3 个不同模块的 bug |
| 任务间有数据依赖 | **串行** | 先创建 Schema → 再写 Repository → 再重构 Service |
| 操作相同文件 | **串行** | 多个任务都需修改 portalService.ts |
| 操作不同文件 | **并行** | 前端组件 + 后端 API 同时开发 |

---

## 4. 技能与代理映射关系表

### 4.1 技能分类体系

技能按功能领域分为 **5 大类**，每类下设推荐技能和已合并/废弃技能：

```
技能体系
├── 🔧 后端开发 (Backend)
│   ├── api-design-principles ★
│   ├── better-auth-best-practices ★
│   ├── error-handling-patterns ★
│   ├── nodejs-best-practices ★
│   ├── openapi-spec-generation ★
│   ├── saas-auth-patterns ★
│   ├── saas-payment ★ (含 saas-stripe)
│   ├── saas-tdd ★
│   ├── changelog-automation
│   ├── monorepo-management
│   └── [已合并] saas-stripe → saas-payment
│
├── 🎨 前端开发 (Frontend)
│   ├── frontend-design ★
│   ├── saas-nextjs ★
│   ├── saas-react-state ★
│   ├── saas-react-ui ★
│   ├── saas-tailwind ★
│   ├── typescript-expert ★
│   ├── ui-ux-pro-max ★
│   ├── vercel-react-best-practices ★
│   ├── scroll-experience
│   ├── seo-fundamentals
│   └── [已合并] saas-ui-ux-designer → ui-ux-pro-max
│
├── 🗄️ 数据库与运维 (DBA/DevOps)
│   ├── database-design ★
│   ├── docker-expert ★
│   ├── github-actions ★
│   ├── prisma-expert ★
│   ├── saas-db-migrations ★
│   ├── saas-db-optimizer ★ (含 saas-postgres)
│   ├── saas-deployment ★
│   ├── saas-observability ★
│   ├── saas-performance ★ (含 web-performance-optimization)
│   └── [已合并] saas-docker → docker-expert
│       [已合并] saas-prisma → prisma-expert
│       [已合并] saas-postgres → saas-db-optimizer
│
├── 🧪 测试与质量 (Quality)
│   ├── e2e-testing-patterns ★ (含 saas-e2e-testing)
│   ├── i18n-localization ★ (含 saas-i18n)
│   ├── webapp-testing ★
│   └── [已合并] saas-e2e-testing → e2e-testing-patterns
│       [已合并] saas-i18n → i18n-localization
│
└── 🛡️ 安全与治理 (Governance)
    ├── access-control-rbac ★
    ├── antigravity-safety ★ (含 safety-guardrails)
    ├── antigravity-code-quality ★ (含 code-quality-check)
    ├── antigravity-code-reviewer ★ (含 code-review-checklist)
    ├── antigravity-verification ★
    ├── antigravity-security-engineer ★
    └── [已合并] safety-guardrails → antigravity-safety
        [已合并] code-quality-check → antigravity-code-quality
        [已合并] code-review-checklist → antigravity-code-reviewer
```

### 4.2 推荐技能 → 代理映射（精简版）

> ★ 标记为核心推荐技能，优先使用。未标记的为补充技能，按需使用。

| 技能名称 | 推荐代理 | 触发场景 | 版本 | 评估分 |
|----------|----------|----------|------|--------|
| **后端开发** | | | | |
| `api-design-principles` ★ | `backend-api-engineer` | REST/GraphQL API 设计 | v1.2 | 92 |
| `better-auth-best-practices` ★ | `backend-api-engineer` | Better Auth 认证框架集成 | v1.1 | 88 |
| `error-handling-patterns` ★ | `backend-api-engineer` | 错误处理设计 | v1.3 | 90 |
| `nodejs-best-practices` ★ | `backend-api-engineer` | Node.js 最佳实践 | v2.1 | 94 |
| `openapi-spec-generation` ★ | `backend-api-engineer` | OpenAPI 规范生成 | v1.1 | 86 |
| `saas-auth-patterns` ★ | `backend-api-engineer` | SaaS 认证模式 | v1.3 | 90 |
| `saas-payment` ★ | `backend-api-engineer` | 支付集成（含 Stripe） | v1.3 | 88 |
| `saas-tdd` ★ | `backend-api-engineer` | TDD 测试驱动 | v1.1 | 85 |
| `changelog-automation` | `backend-api-engineer` | 变更日志自动化 | v1.0 | 72 |
| `monorepo-management` | `backend-api-engineer` | Monorepo 管理 | v1.0 | 75 |
| **前端开发** | | | | |
| `frontend-design` ★ | `senior-frontend-expert` | 前端界面设计 | v2.0 | 93 |
| `saas-nextjs` ★ | `senior-frontend-expert` | Next.js App Router | v1.2 | 88 |
| `saas-react-state` ★ | `senior-frontend-expert` | React 状态管理 | v1.1 | 87 |
| `saas-react-ui` ★ | `senior-frontend-expert` | React UI 模式 | v1.2 | 89 |
| `saas-tailwind` ★ | `senior-frontend-expert` | Tailwind CSS v4 | v1.1 | 86 |
| `typescript-expert` ★ | `senior-frontend-expert` / `backend-api-engineer` | TypeScript 高级类型 | v2.1 | 95 |
| `ui-ux-pro-max` ★ | `senior-frontend-expert` | UI/UX 设计（含设计系统） | v2.2 | 94 |
| `vercel-react-best-practices` ★ | `senior-frontend-expert` | React/Next.js 性能 | v1.1 | 90 |
| `scroll-experience` | `senior-frontend-expert` | 滚动体验 | v1.0 | 70 |
| `seo-fundamentals` | `senior-frontend-expert` | SEO 基础 | v1.0 | 68 |
| **数据库与运维** | | | | |
| `database-design` ★ | `dba-devops-engineer` | 数据库设计 | v1.2 | 90 |
| `docker-expert` ★ | `dba-devops-engineer` | Docker 容器化（含 SaaS 场景） | v1.4 | 92 |
| `github-actions` ★ | `dba-devops-engineer` | CI/CD 工作流 | v1.3 | 88 |
| `prisma-expert` ★ | `dba-devops-engineer` | Prisma ORM（含 SaaS 实践） | v1.4 | 93 |
| `saas-db-migrations` ★ | `dba-devops-engineer` | 数据库迁移 | v1.1 | 87 |
| `saas-db-optimizer` ★ | `dba-devops-engineer` | 数据库优化（含 PostgreSQL） | v1.2 | 89 |
| `saas-deployment` ★ | `dba-devops-engineer` | 部署自动化 | v1.1 | 86 |
| `saas-observability` ★ | `dba-devops-engineer` | 可观测性 | v1.0 | 84 |
| `saas-performance` ★ | `dba-devops-engineer` | 性能优化（含 Web 性能） | v1.3 | 88 |
| **测试与质量** | | | | |
| `e2e-testing-patterns` ★ | `senior-frontend-expert` | E2E 测试（含 SaaS 场景） | v1.3 | 88 |
| `i18n-localization` ★ | `senior-frontend-expert` | 国际化（含 SaaS 场景） | v1.1 | 90 |
| `webapp-testing` ★ | `senior-frontend-expert` | Web 应用测试 | v1.1 | 86 |
| **安全与治理** | | | | |
| `access-control-rbac` ★ | `saas-architect-product-manager` / `backend-api-engineer` | RBAC 权限系统 | v1.2 | 91 |
| `antigravity-safety` ★ | 所有代理 | 安全警告（含危险操作防护） | v1.1 | 95 |
| `antigravity-code-quality` ★ | 所有代理 | 代码质量强制（自动触发） | v1.2 | 93 |
| `antigravity-code-reviewer` ★ | `security-code-reviewer` | 代码审查（含审查清单） | v1.3 | 94 |
| `antigravity-verification` ★ | 所有代理 | 反幻觉验证 | v1.1 | 92 |
| `antigravity-security-engineer` ★ | `security-code-reviewer` | 安全工程审查 | v1.0 | 88 |

### 4.3 工作流 Skill 映射

| 工作流技能 | 用途 | 触发条件 | 版本 |
|-----------|------|----------|------|
| `antigravity-autoplan` | 自动评审流水线 | 代码提交前自动执行 | v1.1 |
| `antigravity-backend-architect` | 后端架构评审 | API 设计、数据库 Schema 变更 | v1.0 |
| `antigravity-code-quality` | 代码质量强制 | 编写或修改代码时自动触发 | v1.2 |
| `antigravity-code-reviewer` | 代码审查 | PR 审查、发布前检查 | v1.3 |
| `antigravity-debugging` | 系统化调试 | Bug、测试失败、崩溃 | v1.1 |
| `antigravity-design-review` | UI/UX 设计评审 | 设计方案评审 | v1.0 |
| `antigravity-eng-review` | 工程架构评审 | 系统设计评审（编码前） | v1.0 |
| `antigravity-office-hours` | 需求重构 | 用户说"我想构建 X" | v1.0 |
| `antigravity-review` | 生产级代码审查 | 代码变更审查 | v1.1 |
| `antigravity-safety` | 安全警告 | 危险操作检测 | v1.1 |
| `antigravity-security-engineer` | 安全工程审查 | 安全审计、威胁建模 | v1.0 |
| `antigravity-verification` | 反幻觉验证 | 任务完成前验证 | v1.1 |

### 4.4 专用领域技能

以下技能仅在特定业务场景下使用，非通用：

| 技能名称 | 推荐代理 | 适用场景 | 版本 | 评估分 |
|----------|----------|----------|------|--------|
| `blockchain-developer` | `blockchain-development-expert` | 区块链/Web3 开发 | v1.0 | 75 |
| `saas-fastapi` | `backend-api-engineer` | Python FastAPI 开发 | v1.0 | 60 |
| `saas-microservices` | `backend-api-engineer` | 微服务架构设计 | v1.0 | 65 |
| `saas-event-sourcing` | `dba-devops-engineer` | 事件溯源/CQRS | v1.0 | 62 |
| `saas-billing` | `backend-api-engineer` | SaaS 计费系统 | v1.0 | 70 |
| `saas-slo` | `dba-devops-engineer` | SLO/SLI 定义 | v1.0 | 58 |
| `saas-mobile-design` | `senior-frontend-expert` | 移动端设计 | v1.0 | 64 |
| `saas-radix-ui` | `senior-frontend-expert` | Radix UI 组件库 | v1.0 | 55 |
| `saas-ui-visual-validator` | `senior-frontend-expert` | UI 视觉验证 | v1.0 | 52 |
| `saas-secrets` | `dba-devops-engineer` | 密钥管理 | v1.0 | 68 |
| `skill-creator` | 所有代理 | 创建新技能 | v1.0 | 78 |
| `session-handoff` | 所有代理 | 会话交接 | v1.1 | 90 |

---

## 5. 技能评估与优化记录

### 5.1 评估指标体系

| 指标 | 权重 | 说明 |
|------|------|------|
| 功能实用性 | 30% | 技能覆盖的核心功能广度与深度 |
| 使用频率 | 25% | 在项目中的实际调用频次 |
| 系统兼容性 | 20% | 与当前技术栈的匹配程度 |
| 响应效率 | 15% | 技能执行的响应速度和资源占用 |
| 维护状态 | 10% | 技能的更新频率和文档完整性 |

**评分标准**：
- ★ 核心（≥85分）：高优先级推荐，功能完善且与项目高度匹配
- 补充（70-84分）：按需使用，特定场景有价值
- 专用（<70分）：仅在特定业务场景下使用

### 5.2 冗余技能合并记录

> 以下技能因功能重叠超过 70% 已合并到主技能中。合并后的主技能已吸收子技能的全部功能。

| 已合并技能 | 合并至 | 重叠度 | 合并原因 | 合并日期 |
|-----------|--------|--------|----------|----------|
| `saas-docker` | `docker-expert` | 85% | 功能完全重叠，docker-expert 覆盖更全面 | 2026-04-07 |
| `saas-e2e-testing` | `e2e-testing-patterns` | 90% | 仅增加 SaaS 上下文，核心内容一致 | 2026-04-07 |
| `saas-i18n` | `i18n-localization` | 88% | 仅增加 SaaS 上下文，核心内容一致 | 2026-04-07 |
| `saas-prisma` | `prisma-expert` | 82% | prisma-expert 已覆盖 SaaS 实践场景 | 2026-04-07 |
| `saas-stripe` | `saas-payment` | 75% | Stripe 为 payment 的子集，已合并 | 2026-04-07 |
| `saas-postgres` | `saas-db-optimizer` | 78% | PostgreSQL 优化为 db-optimizer 的子集 | 2026-04-07 |
| `saas-ui-ux-designer` | `ui-ux-pro-max` | 80% | ui-ux-pro-max 功能更全面（50 种风格） | 2026-04-07 |
| `code-quality-check` | `antigravity-code-quality` | 85% | antigravity 版本支持自动触发，更优 | 2026-04-07 | ✅ 已删除 |
| `code-review-checklist` | `antigravity-code-reviewer` | 78% | antigravity 版本更全面（含严重性分级） | 2026-04-07 | ✅ 已删除 |
| `safety-guardrails` | `antigravity-safety` | 90% | antigravity 版本支持自动触发，更优 | 2026-04-07 | ✅ 已删除 |
| `web-performance-optimization` | `saas-performance` | 72% | saas-performance 覆盖更广（含后端性能） | 2026-04-07 | ✅ 已删除 |

### 5.3 优质技能强化方案

> 以下技能评估分 ≥85，列为优质技能，已制定强化方案。

| 技能名称 | 当前评估分 | 强化目标 | 强化措施 |
|----------|-----------|----------|----------|
| `typescript-expert` | 95 | 97 | 增加monorepo类型共享模式、构建性能优化指南 |
| `antigravity-safety` | 95 | 97 | 扩展危险操作检测规则（数据库DDL、批量删除） |
| `antigravity-code-reviewer` | 94 | 96 | 增加SaaS多租户安全审查维度 |
| `ui-ux-pro-max` | 94 | 96 | 增加深色模式设计令牌、响应式断点规范 |
| `nodejs-best-practices` | 94 | 96 | 增加ESM/CJS互操作、Node 22新特性 |
| `docker-expert` | 92 | 94 | 增加多阶段构建优化、安全加固清单 |
| `prisma-expert` | 93 | 95 | 增加多租户隔离模式、查询性能分析 |
| `api-design-principles` | 92 | 94 | 增加API版本迁移策略、废弃API生命周期 |
| `access-control-rbac` | 91 | 93 | 增加属性访问控制(ABAC)混合模式 |
| `frontend-design` | 93 | 95 | 增加设计系统Token架构、组件文档自动生成 |

### 5.4 版本升级评估表

> 评估维度：功能改进(40%) + 安全修复(40%) + 兼容性影响(20%)，综合分 ≥70 建议升级。

| 技能名称 | 当前版本 | 最新版本 | 功能改进 | 安全修复 | 兼容性 | 综合分 | 升级建议 |
|----------|----------|----------|----------|----------|--------|--------|----------|
| `typescript-expert` | v2.1 ✅ | v2.1 | 85 | 80 | 90 | **84** | ✅ 已升级 |
| `nodejs-best-practices` | v2.1 ✅ | v2.1 | 90 | 75 | 85 | **83** | ✅ 已升级 |
| `docker-expert` | v1.4 ✅ | v1.4 | 80 | 85 | 90 | **84** | ✅ 已升级 |
| `prisma-expert` | v1.4 ✅ | v1.4 | 85 | 80 | 85 | **83** | ✅ 已升级 |
| `ui-ux-pro-max` | v2.2 ✅ | v2.2 | 75 | 70 | 95 | **78** | ✅ 已升级 |
| `saas-auth-patterns` | v1.3 ✅ | v1.3 | 70 | 85 | 90 | **80** | ✅ 已升级 |
| `github-actions` | v1.3 ✅ | v1.3 | 75 | 80 | 85 | **79** | ✅ 已升级 |
| `saas-performance` | v1.3 ✅ | v1.3 | 70 | 75 | 90 | **76** | ✅ 已升级 |
| `e2e-testing-patterns` | v1.3 ✅ | v1.3 | 65 | 70 | 90 | **72** | ✅ 已升级 |
| `scroll-experience` | v1.0 | v1.1 | 60 | 55 | 85 | **64** | ⏸️ 暂缓升级 |
| `seo-fundamentals` | v1.0 | v1.1 | 55 | 50 | 90 | **60** | ⏸️ 暂缓升级 |

**版本回滚预案**：
- 每次升级前备份当前版本到 `.agents/skills/{skill-name}/backup/`
- 升级失败时执行 `git checkout -- .agents/skills/{skill-name}/` 恢复
- 关键技能升级后需执行 `npx tsc --noEmit` 验证兼容性

### 5.5 质量保障验证清单

优化完成后，需通过以下三级验证：

**L1 — 单元验证**（代码覆盖率 ≥80%）
- [ ] 每个推荐技能可被正确调用且返回预期格式
- [ ] 已合并技能的调用自动路由到主技能
- [ ] 专用领域技能在非适用场景下不触发

**L2 — 集成验证**（技能间交互正常）
- [ ] 技能与代理映射关系正确（无悬空引用）
- [ ] 并行调用不同类别技能无冲突
- [ ] 串行调用有依赖的技能时上下文正确传递

**L3 — 场景验证**（≥10 个典型场景）
- [ ] 场景1：后端API开发（api-design + nodejs-best-practices + error-handling）
- [ ] 场景2：数据库迁移（database-design + prisma-expert + saas-db-migrations）
- [ ] 场景3：前端组件开发（frontend-design + typescript-expert + saas-react-ui）
- [ ] 场景4：安全审查（access-control-rbac + antigravity-security-engineer）
- [ ] 场景5：Docker部署（docker-expert + saas-deployment + github-actions）
- [ ] 场景6：E2E测试（e2e-testing-patterns + webapp-testing）
- [ ] 场景7：国际化（i18n-localization + saas-tailwind）
- [ ] 场景8：性能优化（saas-performance + saas-db-optimizer）
- [ ] 场景9：代码质量（antigravity-code-quality + antigravity-code-reviewer）
- [ ] 场景10：会话交接（session-handoff + antigravity-verification）

**通过标准**：所有测试用例通过率 100%，无数据丢失风险，系统性能指标达到优化前 120% 以上。

---

## 6. 更新交接流程

### 6.1 交接文档生成规则

**每次重大更新后必须生成交接文档**，触发条件包括：

1. 完成涉及 3 个以上文件的修改
2. 完成复杂调试或架构决策
3. 用户明确请求保存状态（`save state`、`create handoff`、`我需要暂停`）
4. 上下文窗口接近容量
5. 工作会话即将结束

### 6.2 交接文档结构

交接文档存储在 `.claude/handoffs/` 目录，命名格式：`YYYY-MM-DD-HHMMSS-[slug].md`

**必须包含以下章节**：

```markdown
# Handoff: [任务标题]

## 变更内容
- 具体修改了什么（文件 + 行号 + 改动描述）
- 新增/删除了哪些功能
- 数据库 Schema 变更（如有）

## 影响范围
- 受影响的模块/包列表
- API 接口变更（新增/修改/废弃）
- 前后端契约变更
- 数据库迁移需求

## 使用注意事项
- 新增的环境变量
- 需要执行的迁移命令
- 已知限制或待修复问题
- 配置变更说明

## 立即下一步
1. [最关键的下一步操作]
2. [第二优先级]
3. [第三优先级]

## 决策记录
| 决策 | 备选方案 | 选择理由 |
|------|----------|----------|
| 选择了 X | X, Y, Z | 为什么选 X |

## 潜在风险
- [可能影响其他模块的变更]
- [需要回归测试的范围]
```

### 6.3 交接链机制

长期项目通过交接链维持上下文传承：

```
handoff-1.md (初始工作)
    ↓ continues-from
handoff-2.md (继续开发)
    ↓ continues-from
handoff-3.md (最终收尾)
```

每份交接文档：
- 链接到前一份交接文档
- 可标记旧交接文档为已废弃
- 为新代理提供上下文面包屑

### 6.4 交接验证清单

生成交接文档后，必须通过以下验证：

- [ ] 无 `[TODO: ...]` 占位符残留
- [ ] 所有必需章节已填写
- [ ] 无敏感信息泄露（API Key、密码、Token）
- [ ] 引用的文件路径存在
- [ ] 质量评分 ≥ 70 分

---

## 7. 记忆持久化方案

### 7.1 文档版本控制策略

| 文档类型 | 存储位置 | 版本控制 | 保留策略 |
|----------|----------|----------|----------|
| 交接文档 | `.claude/handoffs/` | Git 跟踪 | 永久保留，链式引用 |
| 代理规范 | `AGENTS.md`（本文件） | Git 跟踪 | 随项目演进更新 |
| 技能定义 | `.agents/skills/*/SKILL.md` | Git 跟踪 | 随技能更新同步 |
| 技能备份 | `.agents/skills/*/backup/` | Git 跟踪 | 升级回滚用，保留最近 3 版本 |
| 重构洞察 | `.trae-cn/*/documents/` | 本地存储 | 项目级保留 |
| 迁移脚本 | `backend/prisma/migrations/` | Git 跟踪 | 永久保留 |

### 7.2 存储位置与访问权限

```
项目根目录/
├── .claude/
│   └── handoffs/                    # 交接文档（Git 跟踪）
│       ├── 2026-02-20-213000-*.md
│       └── 2026-04-03-220231-*.md
├── .agents/
│   └── skills/                      # 技能定义（Git 跟踪）
│       ├── session-handoff/
│       ├── superpowers/
│       ├── {skill-name}/
│       │   ├── SKILL.md
│       │   └── backup/              # 版本升级备份
│       └── ...
├── .trae-cn/                        # Trae IDE 上下文（本地，不入 Git）
│   └── {session-id}/
│       ├── documents/               # 重构洞察文档
│       └── refactor/                # 重构计划
├── AGENTS.md                        # 本文件（Git 跟踪）
└── .gitignore                       # 排除 .trae-cn 等本地目录
```

**访问权限矩阵**：

| 角色 | 交接文档 | 代理规范 | 技能定义 | 技能备份 | 重构洞察 |
|------|----------|----------|----------|----------|----------|
| 主代理 | 读写 | 读写 | 只读 | 只读 | 读写 |
| 子代理 | 只读（参数注入） | 只读 | 只读 | 无访问 | 无访问 |
| 开发人员 | 读写 | 读写 | 读写 | 读写 | 读写 |
| CI/CD | 只读 | 只读 | 只读 | 无访问 | 无访问 |

### 7.3 上下文恢复流程

当新代理会话启动时，按以下优先级恢复上下文：

```
1. 检查 .claude/handoffs/ 目录
   └── 读取最新的交接文档（按时间戳排序）
       └── 如有 continues-from 链接，递归读取前序文档

2. 检查 AGENTS.md（本文件）
   └── 了解项目代理规范和技能映射

3. 检查 .trae-cn/ 下的重构洞察
   └── 了解最近的代码质量改进计划

4. 检查 git log（最近 10 条提交）
   └── 了解最近的代码变更
```

### 7.4 交接文档时效性评估

加载交接文档前，应评估其时效性：

| 时效等级 | 条件 | 操作 |
|----------|------|------|
| **FRESH** | 创建后 < 24h，无新提交 | 直接恢复工作 |
| **SLIGHTLY_STALE** | 创建后 1-3 天，少量提交 | 审查变更后恢复 |
| **STALE** | 创建后 3-7 天，多量提交 | 仔细验证上下文后恢复 |
| **VERY_STALE** | 创建后 > 7 天，大量变更 | 建议创建新交接文档 |

---

## 8. OpenSpec 工作流程

当请求满足以下条件时，始终打开 `@/openspec/AGENTS.md`：
- 提及规划或提案（如提案、规范、变更、计划等词语）
- 引入新功能、重大变更、架构变更或大型性能/安全工作时
- 听起来不明确，需要在编码前了解权威规范时

使用 `@/openspec/AGENTS.md` 了解：
- 如何创建和应用变更提案
- 规范格式和约定
- 项目结构和指南

保持此托管块，以便 `openspec-cn update` 可以刷新说明。

<!-- OPENSPEC:END -->
