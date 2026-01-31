# 项目升级与完善蓝图 v2.0
## TongHai Nanyang CRM 系统综合审计报告

**审计日期**: 2026-01-30  
**更新日期**: 2026-01-30（新增功能模块）  
**审计范围**: 全代码库（前端 + 后端 + 文档）  
**架构模式**: Monorepo（npm workspaces）+ 分层服务架构

---

## 项目概况

| 维度 | 现状 |
|------|------|
| **前端技术栈** | Vue 3.4 + Vite 5.0 + TypeScript 5.3 + Element Plus 2.5 |
| **后端技术栈** | Express 4.18 + Prisma 5.8 + PostgreSQL |
| **子项目** | website、management、customer-portal、shared、backend |
| **代码行数** | Dashboard.vue 847行、leadService.ts 484行、schema.prisma 416行 |

---

## 🔴 板块一：紧急修复 (Critical Fixes)

### 1.1 i18n 类型系统错误 【P0 - 阻塞构建】

> [!CAUTION]
> **影响**: `vue-tsc` 构建失败，CI/CD 流水线无法通过

- `ts_errors.log` 包含 **136 条** i18n 类型错误
- **修复方案**: 重构 i18n 类型系统，采用「键存在性检查 + 值类型宽松」策略
- **预估工时**: 4 小时

### 1.2 未使用变量警告 【P0】

- 15 条 `TS6133` 错误，涉及 `Contact.vue`、`Home.vue` 等
- **预估工时**: 1 小时

### 1.3 缺失单元测试 【P1】

- 无实际测试文件，重构风险高
- **预估工时**: 16+ 小时（持续性工作）

---

## 🟡 板块二：重构与优化 (Refactoring)

### 2.1 Dashboard.vue 组件拆分 【P1】
- 847 行拆分为 8 个子组件
- **预估工时**: 8 小时

### 2.2 API 响应格式统一 【P1】
- 统一为 `{ code, message, data, meta? }` 结构
- **预估工时**: 4 小时

### 2.3 环境变量验证 【P2】
- 使用 zod 验证，**预估工时**: 2 小时

### 2.4 引入 Repository 模式 【P2】
- 便于单元测试 mock，**预估工时**: 8 小时

---

## 🔵 板块四：新功能开发 (New Features)

### 4.1 官网聊天机器人 (AI FAQ Chatbot) 【P1 - 高价值】

> [!TIP]
> **预期效果**: 24小时自动响应，提升官网转化率 15-25%

**技术方案**: ✅ 采用 **AI API（OpenAI）** 实现智能问答

**技术架构**:
```
官网 → ChatWidget组件 → REST API → ChatbotService → OpenAI API
                                          ↓
                                   FAQ知识库（RAG增强）
```

**AI 实现方案**:
- **向量数据库**: 使用 pgvector（PostgreSQL 扩展）存储 FAQ 向量
- **Embedding**: OpenAI text-embedding-3-small
- **Chat Model**: GPT-4o-mini（成本较低，响应快）
- **RAG 流程**: 用户问题 → 向量检索相关 FAQ → 构建 Prompt → 生成回答

**前端开发**:
| 组件 | 位置 | 说明 |
|------|------|------|
| `ChatWidget.vue` | packages/website | 悬浮聊天窗口 |
| 消息气泡、输入框 | — | 支持文本 + 快捷回复按钮 |

**后端 API**:
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/chat/message` | POST | 发送消息，返回机器人回复 |
| `/api/faq` | GET | 获取FAQ列表（公开） |
| `/api/admin/faq` | CRUD | FAQ条目管理（后台） |
| `/api/admin/chat-sessions` | GET | 对话记录查看 |

**数据模型 (Prisma)**:
```prisma
model FaqCategory {
  id        String    @id @default(cuid())
  name      String
  items     FaqItem[]
}

model FaqItem {
  id         String      @id @default(cuid())
  question   String
  answer     String      @db.Text
  keywords   String[]    // 关键词匹配
  category   FaqCategory @relation(...)
}

model ChatSession {
  id        String        @id @default(cuid())
  messages  ChatMessage[]
  createdAt DateTime      @default(now())
}

model ChatMessage {
  id        String      @id @default(cuid())
  content   String
  role      String      // "user" | "bot"
  session   ChatSession @relation(...)
}
```

**后台管理功能**:
- FAQ 分类管理
- FAQ 条目 CRUD（问题、答案、关键词）
- 对话记录查看与分析
- 未识别问题收集

**预估工时**: 24 小时（前端 10h + 后端 10h + 后台 4h）

---

### 4.2 新闻板块 (News Module) 【P1】

**技术方案**: ✅ 公司动态采用 **微信公众号 API**，行业新闻采用 RSS 聚合

**架构设计**:
```
┌─────────────────┐   ┌─────────────────┐
│  微信公众号 API  │   │   RSS 聚合器    │
│  (认证服务号)    │   │ (node-cron)    │
└───────┬─────────┘   └───────┬─────────┘
        ↓                     ↓
     ┌────────────────────────────┐
     │   News 数据表 (Prisma)     │
     │  type: COMPANY | INDUSTRY  │
     └────────────────────────────┘
                  ↓
        官网展示 + 后台管理
```

**微信公众号集成**:
- **前置条件**: 需要认证服务号（支持素材管理 API）
- **API 接口**: 
  - `GET /cgi-bin/material/batchget_material` - 获取图文素材列表
  - `GET /cgi-bin/material/get_material` - 获取单篇文章内容
- **同步策略**: 定时任务每小时检查新文章
- **后台配置**: AppID、AppSecret、同步频率

**数据模型 (Prisma)**:
```prisma
model RssFeed {
  id        String   @id @default(cuid())
  name      String
  url       String
  category  String   // "industry" | "policy" | ...
  isActive  Boolean  @default(true)
  lastFetch DateTime?
}

model NewsArticle {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  summary     String?
  coverImage  String?
  source      String   // "wechat" | "rss" | "manual"
  sourceUrl   String?
  type        String   // "COMPANY" | "INDUSTRY"
  status      String   @default("DRAFT") // DRAFT | PUBLISHED
  publishedAt DateTime?
  createdAt   DateTime @default(now())
}
```

**后台功能**:
| 功能 | 说明 |
|------|------|
| RSS 源管理 | 添加/编辑/删除订阅源 |
| 文章列表 | 筛选、搜索、批量操作 |
| 文章编辑 | 富文本编辑、摘要生成 |
| 发布管理 | 草稿/已发布状态切换 |
| 定时抓取 | 配置抓取频率 |

**官网展示**:
- 新闻列表页（分类筛选）
- 新闻详情页
- 首页新闻轮播/列表

**预估工时**: 20 小时（后端 8h + 后台 8h + 官网 4h）

---

### 4.3 后台业务流程优化 【P1】

**当前瓶颈分析**:
| 问题 | 影响 | 解决方案 |
|------|------|---------|
| 线索分配手动化 | 响应慢、分配不均 | 智能分配规则引擎 |
| 阶段推进无自动化 | 人工触发易遗漏 | 事件驱动工作流 |
| 任务依赖不可见 | 阻塞原因不清 | 可视化任务依赖 |

**优化方案**:

#### A. 线索智能分配
```typescript
// 分配规则配置
interface AssignmentRule {
  conditions: {
    country?: string[];     // 匹配国家
    serviceType?: string[]; // 匹配服务类型
    budgetRange?: string;   // 匹配预算
  };
  assignTo: string;         // 负责人ID
  priority: number;         // 规则优先级
}
```

#### B. 阶段检核清单 (Checklist)
- 每个销售阶段定义必需完成项
- 阻止未完成检核项时的阶段推进
- 可配置清单模板

#### C. 工作流自动化
| 触发事件 | 自动操作 |
|---------|---------|
| 线索创建 | 生成「首次联系」任务 |
| Discovery 完成 | 创建 Proposal 阶段任务 |
| 签约完成 | 拆分项目工作流 |
| 任务超期 | 发送提醒通知 |

**预估工时**: 16 小时

---

### 4.4 业务功能补齐 【P1-P2】

> [!IMPORTANT]
> 以下功能在 PRD 中规划但尚未实现，建议按业务价值优先补齐

| 功能 | 模块 | 业务价值 | 优先级 | 工时 |
|------|------|---------|--------|-----|
| **线索评分** | Lead | 识别高价值客户，优化资源分配 | P1 | 8h |
| **CSV 批量导入** | Lead | 会展名单快速录入 | P1 | 4h |
| **会前问卷** | Discovery | 结构化收集客户信息 | P1 | 12h |
| **邮件模板** | 沟通 | 统一品牌形象，提升效率 | P1 | 8h |
| **收款跟踪** | 财务 | 应收账款管理，现金流可视化 | P1 | 12h |
| **KYC 核验清单** | 合规 | 合规必需，降低法律风险 | P1 | 8h |
| **方案模板生成** | Proposal | 标准化输出，减少编写时间 | P2 | 16h |

---

## 🟢 板块三：基础设施建议 (Infrastructure)

### 3.1 短期目标（1-2 周）

| 功能 | 描述 | 价值 |
|------|------|------|
| **CI/CD 流水线** | lint → type-check → test → build → deploy | 代码质量门禁 |
| **Sentry 错误监控** | 前后端错误追踪 | 生产问题快速定位 |
| **OpenAPI 文档** | swagger-jsdoc 自动生成 | 前后端协作效率 |

### 3.2 中期目标（1 个月）

| 功能 | 描述 | 价值 |
|------|------|------|
| **Redis 缓存** | Dashboard 统计、权限缓存 | 性能提升 30%+ |
| **Rate Limiting** | 登录/API 限流 | 安全加固 |

### 3.3 长期目标（3 个月）

| 功能 | 描述 | 价值 |
|------|------|------|
| **WebSocket 实时通信** | Socket.io 消息推送 | 用户体验提升 |
| **状态机管理** | xstate 管理 Lead/Project 状态 | 业务流程可靠性 |

---

## 优先级 TODO List

> [!IMPORTANT]
> 综合技术债务修复和新功能开发的完整执行清单

### 第一阶段：立即执行（本周）

| # | 任务 | 类型 | 优先级 | 工时 | 状态 |
|---|------|------|--------|-----|---|
| 1 | 修复 i18n 类型系统错误 | 🔴修复 | P0 | 4h | ✅ |
| 2 | 清理未使用变量 | 🔴修复 | P0 | 1h | ✅ |
| 3 | 为 authService 添加单元测试 | 🔴修复 | P1 | 4h | ✅ |

### 第二阶段：短期优化（2-3 周）

| # | 任务 | 类型 | 优先级 | 工时 | 状态 |
|---|------|------|--------|-----|---|
| 4 | **官网聊天机器人** | 🔵新功能 | P1 | 24h | ✅ |
| 5 | **新闻板块** | 🔵新功能 | P1 | 20h | ✅ |
| 6 | 拆分 Dashboard.vue 组件 | 🟡重构 | P1 | 8h | ✅ |
| 7 | 统一 API 响应格式 | 🟡重构 | P1 | 4h | ✅ |
| 8 | 配置 CI/CD 流水线 | 🟢基建 | P1 | 4h | ✅ |

### 第三阶段：中期开发（1 个月）

| # | 任务 | 类型 | 优先级 | 工时 |
|---|------|------|--------|-----|
| 9 | **线索评分系统** | 🔵新功能 | P1 | 8h |
| 10 | **邮件模板系统** | 🔵新功能 | P1 | 8h |
| 11 | **收款跟踪模块** | 🔵新功能 | P1 | 12h |
| 12 | **后台流程优化**（智能分配+检核清单） | 🔵新功能 | P1 | 16h |
| 13 | CSV 批量导入 | 🔵新功能 | P1 | 4h |
| 14 | 引入 Repository 模式 | 🟡重构 | P2 | 8h |

### 第四阶段：长期完善（2-3 个月）

| # | 任务 | 类型 | 优先级 | 工时 |
|---|------|------|--------|-----|
| 15 | **会前问卷系统** | 🔵新功能 | P1 | 12h |
| 16 | **KYC 核验清单** | 🔵新功能 | P1 | 8h |
| 17 | 方案模板生成 | 🔵新功能 | P2 | 16h |
| 18 | 工作流自动化引擎 | 🔵新功能 | P2 | 20h |
| 19 | WebSocket 实时通信 | 🟢基建 | P2 | 12h |

---

## 验证计划

### 自动化测试

```bash
# TypeScript 类型检查
cd packages/website && npm run type-check
# 预期：0 errors

# 后端单元测试
cd backend && npm test
# 预期：所有测试通过
```

### 功能验证

- **聊天机器人**: 在官网发起对话，验证 FAQ 匹配和未识别问题收集
- **新闻板块**: 添加 RSS 源，验证自动抓取和文章发布流程
- **流程优化**: 创建线索验证自动分配规则生效

---

## 需用户审查

> [!NOTE]
> 请审阅以上升级蓝图，重点确认：
> 1. 新功能优先级排序是否符合业务需求
> 2. 聊天机器人是否需要引入 AI API（OpenAI）还是使用关键词匹配
> 3. 公众号文章抓取方式（手动录入/API/第三方抓取）
