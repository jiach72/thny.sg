# Session Handoff: 前端全页面审阅与全量优化

## 元信息
- **日期**: 2026-02-21 12:18 (SGT)
- **项目路径**: `c:\Users\jiach\Documents\AntigravityCode\thny.sg`
- **延续自**: `2026-02-20-220000-thnysg-full-project-features.md`
- **会话 ID**: `31cf377a-8208-4b6d-b769-42a4597bcad0`

---

## 当前状态总结

本次会话完成了前端三个包（management / customer-portal / website）共 51 个 Vue 文件的**全面审阅**，并按 P0→P3 优先级**一次性修复了所有 10 项问题**。

### 已完成工作

#### P0 安全修复（2 项）
| 修复 | 文件 | 方法 |
|------|------|------|
| ChatWidget XSS | `packages/website/src/components/ChatWidget.vue` | 安装 `dompurify` + 白名单 `sanitize()` |
| NewsDetail XSS | `packages/website/src/views/NewsDetail.vue` | `DOMPurify.sanitize()` 消毒 RSS 内容 |

#### P1 功能修复（2 项）
| 修复 | 文件 | 方法 |
|------|------|------|
| RssManagement apiClient 统一 | `packages/management/src/views/settings/RssManagement.vue` | 8 处 API 从原始 axios → apiClient |
| console.log 调试清理 | 5 个文件 | 移除所有 `console.log` 调试语句 |

#### P2 代码质量（2 项）
| 修复 | 文件 | 方法 |
|------|------|------|
| setTimeout 内存泄漏 | `Settings.vue` + `HealthScoreCard.vue` | ref 追踪 + 冗余代码删除 |
| 未使用 import | `HealthScoreCard.vue` | 移除 `onMounted` |

#### P3 体验优化（3 项）
| 修复 | 文件 | 方法 |
|------|------|------|
| 官网 SEO 动态元标签 | `packages/website/src/router/index.ts` | 8 路由 meta.title + afterEach 钩子 |
| ProjectList 排序 | `packages/management/src/views/projects/ProjectList.vue` | 5 列 sortable |
| 客户门户空状态 | `DocumentList.vue` + `MessageList.vue` | 图标 + 描述 + 引导按钮 |

#### 更早完成的线索管理优化（6 项）
| 修复 | 文件 |
|------|------|
| 来源渠道映射 | `LeadList.vue` — 补全 MANUAL/WEBSITE 等中文标签 |
| 状态统计改服务端 | `LeadList.vue` — `statusCounts` ref + `fetchStatusCounts` |
| 表格列宽调整 | `LeadList.vue` — 全部 8 列可见 |
| 批量改状态对话框 | `LeadList.vue` — ElSelect 替代文本 prompt |
| 评分/时间列排序 | `LeadList.vue` — sortable + sort-by |
| 筛选器补全 | `LeadList.vue` — 新增 CONTACTED/QUALIFIED 选项 |

---

## 关键决策

1. **DOMPurify 白名单策略**: ChatWidget 仅允许 `<a>`, `<br>`, `<strong>`, `<em>` 标签和 `href`, `target`, `rel` 属性。NewsDetail 使用 DOMPurify 默认策略（更宽松，允许常见 HTML 标签）。
2. **RssManagement 迁移**: 统一使用 `apiClient`（自带 Bearer Token + 智能解包），移除手动 `apiBase` 拼接和 `response.data.success` 检测。
3. **SEO 方案**: 使用 Vue Router `afterEach` 守卫动态更新 `document.title` 和 `<meta name="description">`，无需引入 `@vueuse/head` 等第三方库。

#### 规划执行：SalesDashboard 数据修复 + TypeScript 治理（本次会话后半段新增）

| 修复 | 文件 | 方法 |
|------|------|------|
| SalesDashboard 全空 Bug | `packages/management/src/views/analytics/SalesDashboard.vue` | 修复 `funnel.data?.data` 双层解包 → 智能兼容模式 |
| LeadDetail TS 类型 | `packages/management/src/views/leads/LeadDetail.vue` | 移除 2 处 `any`，修复 `actionType` 字段映射 + 联合类型断言 |
| ProjectList TS 类型 | `packages/management/src/views/projects/ProjectList.vue` | `row: any` → `Record<string, string>` |

#### TypeScript 阶段 2：共享类型体系建设

| 变更 | 文件 | 内容 |
|------|------|------|
| 新增 Invoice 类型 | `packages/shared/types/invoice.ts` | `InvoiceStatus` / `InvoiceLineItem` / `Invoice` / `Payment` + CRUD payload（7 个类型） |
| 新增 FAQ 类型 | `packages/shared/types/faq.ts` | `FaqCategory` / `FaqItem` + CRUD payload（6 个类型） |
| Lead 类型补全 | `packages/shared/types/lead.ts` | activities 子类型 +3 字段（`entityType` / `entityId` / `changes`） |
| 类型导出 | `packages/shared/types/index.ts` | 新增 invoice + faq 导出 |
| typedApi 泛型 | `packages/management/src/api/apiClient.ts` | `typedApi.get<Lead[]>('/leads')` 类型安全封装 |

#### 全量 any 清理（57 处）

| 文件 | 消除 any 数 | 新增类型 |
|------|------------|----------|
| 4 个 Store (lead/inquiry/appointment/task) | 8 | `NonNullable<Lead['activities']>`, `Partial`, `Omit`, `Record` |
| `FaqManagement.vue` | 4 | 导入 `FaqCategory`/`FaqItem` |
| `RssManagement.vue` | 14 | `RssFeed`, `RssTestResult` |
| `NewsManagement.vue` | 11 | `NewsArticle`（含 En 字段） |
| `InvoiceManagement.vue` | 7 | Customer 内联类型 + `(err as Error)` |
| `MessageSend.vue` | 9 | `CustomerOption`, `SentMessage`, `MessageType` |
| `MessageList.vue` (portal) | 2 | Message 内联类型 |
| `Dashboard.vue` (portal) | 2 | Todo + Consultant 内联类型 |

#### apiClient 类型重载

| 变更 | 文件 | 内容 |
|------|------|------|
| 重写类型声明 | `apiClient.ts` | 定义 `ApiClient` 接口，get/post/put/delete 返回 `Promise<T>` 而非 `AxiosResponse` |
| 移除 typedApi | `apiClient.ts` | 不再需要——apiClient 本身支持泛型 |
| 级联修复 | 4 个文件 | inquiryStore/appointmentStore 添加断言，NewsManagement/MessageSend 使用泛型 |

#### 最终清理（90+ 处）

| 类别 | 修改文件数 | 消除 any 数 |
|------|-----------|------------|
| `catch (error: any)` → `unknown` + 类型守卫 | 21 | ~50 |
| `ref<any>` / `ref<any[]>` → 具体类型 | 6 | ~10 |
| `as any` 断言移除/替换 | 8 | ~15 |
| `response: any` → 移除 | 5 | ~7 |
| **总计** | **~40 个文件** | **~150 处** |

新增基础设施：
- `packages/shared/utils/error.ts` — `getErrorMessage(error: unknown)` 安全错误提取函数
- `ApiClient` 接口默认泛型 `T = any`（渐进式安全：现有代码无需改动，新代码可用 `get<T>()` 收紧）

---

## 已知残留问题

### 未修复（低优先级）
- `any` 剩余 ~10 处（框架/运行时限制：Element Plus 图标类型、draggable 事件、Blob 构造、动态属性删除）
- Dashboard "最新线索" 为空 — API 过滤条件可能排除已转化线索
- InquiryList CSS `line-clamp` 兼容性警告 — 非功能性

### 新增依赖
- `dompurify` + `@types/dompurify` 已安装到 `packages/website`

---

## 关键文件列表

| 文件 | 用途 |
|------|------|
| `packages/website/src/router/index.ts` | 路由定义 + SEO 元标签 |
| `packages/website/src/components/ChatWidget.vue` | 在线客服聊天组件 |
| `packages/website/src/views/NewsDetail.vue` | 新闻详情页 |
| `packages/management/src/views/settings/RssManagement.vue` | RSS 订阅源管理 |
| `packages/management/src/views/settings/FaqManagement.vue` | FAQ 知识库管理 |
| `packages/management/src/views/leads/LeadList.vue` | 线索管理列表 |
| `packages/management/src/views/leads/LeadDetail.vue` | 线索详情（TS 类型修复） |
| `packages/management/src/views/projects/ProjectList.vue` | 项目管理列表 |
| `packages/management/src/views/analytics/SalesDashboard.vue` | 销售分析（数据修复） |
| `packages/management/src/api/apiClient.ts` | API 客户端（新增 typedApi 泛型） |
| `packages/management/src/components/common/HealthScoreCard.vue` | 健康度评分组件 |
| `packages/shared/types/invoice.ts` | Invoice/Payment 共享类型（新增） |
| `packages/shared/types/faq.ts` | FaqItem/FaqCategory 共享类型（新增） |
| `packages/shared/types/lead.ts` | Lead 共享类型（activities 补全） |
| `packages/customer-portal/src/views/documents/DocumentList.vue` | 客户文档保险库 |
| `packages/customer-portal/src/views/messages/MessageList.vue` | 客户消息中心 |
| `packages/customer-portal/src/views/settings/Settings.vue` | 客户门户设置 |

---

## 发现的架构模式

1. **apiClient 类型安全**: `ApiClient` 接口覆盖 get/post/put/delete/patch，返回 `Promise<T>`。支持 `apiClient.get<Lead[]>('/leads')` 或 `as Lead[]` 断言。
2. **智能解包**: 响应拦截器自动处理 `{ code, data }` 结构。**注意**：不要 `.data?.data` 双层解包。
3. **共享类型体系**: `packages/shared/types/` 现有 13 个共享 interface（Lead/Project/User/Invoice/FaqItem 等）。
4. **局部类型**: 页面级 interface（RssFeed/NewsArticle/CustomerOption/SentMessage 等）定义在各自 Vue 文件中。
5. **Store 模式**: Pinia store 已全部类型化，无剩余 `any`。
6. **客户门户设计语言**: Tailwind-like 自定义类 + `lucide-vue-next` 图标。

---

## 下一步建议

1. ~~**官网 Vite SSG 预渲染**: 安装 `vite-ssg` + `@unhead/vue`，实现静态 HTML 生成~~ ✅ **已完成**（会话 `709713a2`）

---

## 延续会话：Vite SSG 预渲染（2026-02-21 13:14）

**会话 ID**: `709713a2-e551-4536-b3ed-7c4eb2e44b50`

### 已完成工作

| 变更 | 文件 | 方法 |
|------|------|------|
| ViteSSG 入口重构 | `packages/website/src/main.ts` | `createApp().mount()` → `ViteSSG()` 工厂 + Pinia 状态序列化 |
| 路由简化 | `packages/website/src/router/index.ts` | 仅导出 `routes` 数组，删除 `createRouter` + `afterEach` SEO 守卫 |
| useHead SEO | 8 个页面视图组件 | `useHead({ title, meta })` 替代路由守卫动态 `document.title` |
| SSR 安全 | `stores/language.ts` + `i18n/index.ts` | `import.meta.env.SSR` 守卫 `localStorage` |
| ClientOnly | `App.vue` | ChatWidget 包裹 `<client-only>` |
| 构建配置 | `vite.config.ts` + `package.json` | `ssgOptions` + `vite-ssg build` |
| HTML 清理 | `index.html` | 移除硬编码 `<title>` 和 `<meta description>` |

### 构建验证

- `vite-ssg build` 零错误，生成 8 个预渲染 HTML（总计 ~120 KiB）
- 每页含独立 `<title>` 和 `<meta description>`
- HTML 包含完整预渲染 DOM（非空 `<div id="app">`）

### 新增依赖

- `vite-ssg` (devDependency) — `packages/website`
- `@unhead/vue` (devDependency) — `packages/website`

### 关键架构变化

1. **SEO 管理**: 从路由守卫 `document.title` 迁移到组件级 `useHead()`，SSG 构建时自动注入到 HTML
2. **Pinia SSG**: 初始状态通过 `initialState.pinia` 序列化到 HTML，客户端激活时恢复
3. **浏览器 API 隔离**: `localStorage` / WebSocket 等浏览器 API 用 `import.meta.env.SSR` 或 `<ClientOnly>` 隔离
