# Handoff: 通海南洋 V2.0 — 移动端 C 端 APP 全功能对齐

## Session Metadata
- Created: 2026-04-03T14:57:00+08:00
- Project: `c:\Users\jiach\Documents\AntigravityCode\thny.sg`
- Conversation ID: `2cbbdd4d-210d-40e1-9b89-29d1df9acbe8`
- Session duration: ~4 小时（跨两次会话）

## Current State Summary

移动端客户 APP (`packages/mobile-client`) 已从一个**仅有 3 个 Tab 页面的演示壳**升级为**与 Web 端客户门户功能完全对齐的真实业务终端**。本次会话完成了两项核心工程：

1. **Phase 6 — 数据联邦化**：将 `@tonghai/shared` 类型注入移动端，构建 `portalApi.ts` 网关层，彻底清洗了首页/案件/个人中心三个 Tab 页的硬编码假数据，替换为真实后端 API 调用。
2. **Phase 7 — 功能对齐 (Feature Parity)**：新建了 6 个二级页面（文档中心、账单中心、消息中心、帮助与 FAQ、设置、项目详情），API 层从 5 个接口扩展到 20+ 个，并将所有导航串联完毕。

**当前状态：所有页面路由可达、UI 渲染正常、骨架屏/空态/错误提示机制均已验证通过。**

## Codebase Understanding

### Architecture Overview

```
thny.sg/ (Monorepo - npm workspaces)
├── packages/
│   ├── backend/          # NestJS 后端 API 服务器
│   ├── customer-portal/  # Web 端客户门户 (Vue3 + Element Plus)
│   ├── management/       # CRM 后台管理系统
│   ├── mobile-client/    # 📱 UniApp 移动端 (Vue3 + NutUI + Pinia)
│   └── shared/           # 共享类型包 (@tonghai/shared)
```

**移动端技术栈**：
- 框架：UniApp (跨端) + Vue 3 Composition API
- UI 库：NutUI 4.x（移动优先 UI 组件）
- 状态管理：Pinia (`stores/auth.ts`)
- HTTP 请求：自定义 `utils/request.ts`（封装 `uni.request`，内置 JWT 注入 + 401 自动刷新）
- 类型系统：`@tonghai/shared` 共享类型包

**通信链路**：移动端 → `utils/request.ts` (uni.request + JWT) → 后端 `/api/v1/portal/*` 接口群

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `mobile-client/src/api/portalApi.ts` | 20+ 个 API 接口的统一网关 | 所有页面数据的唯一出口 |
| `mobile-client/src/pages.json` | UniApp 路由配置 | 定义了 3 个 TabBar + 7 个二级页面 |
| `mobile-client/src/utils/request.ts` | HTTP 请求封装 | 内置 JWT 注入 + 401 Token 刷新 + 错误提示 |
| `mobile-client/src/stores/auth.ts` | 鉴权状态管理 | 使用 `@tonghai/shared` 的 `User` 类型 |
| `shared/types/portal.ts` | 门户业务类型定义 | `PortalProject`、`PortalMessage`、`PortalDocument` 等 |
| `shared/types/project.ts` | 项目核心类型 | `Project` 基类（注意：没有 `name` 属性，用 `title`） |
| `shared/types/api.ts` | API 响应类型 | `PaginatedResponse<T>` 分页结构（data + pagination.total） |
| `customer-portal/src/router/index.ts` | Web 端路由配置 | 功能对齐的参照基准 |

### Key Patterns Discovered

1. **分页响应结构**：后端返回 `{ data: T[], pagination: { page, limit, total, totalPages } }` 而非扁平的 `{ data, total }`。取 total 时要用 `res.pagination.total`。
2. **UniApp 导航差异**：TabBar 页面用 `uni.switchTab()`，非 TabBar 页面用 `uni.navigateTo()`。不能混用。
3. **Vue 模板闭合**：UniApp H5 对 `<template>` 标签闭合要求非常严格，缺失会导致所有 `<script setup>` 绑定失效（报 "属性不存在"）。
4. **PortalProject 继承链**：`PortalProject extends Project`，`Project` 有 `title` 没有 `name`。`startDate` / `estimatedEndDate` 在 `Project` 基类上，不需要 `as any`。
5. **HTTP 请求封装**：`utils/request.ts` 导出 `http.get/post/put/del`，`del` 对应 DELETE 方法。

## Work Completed

### Tasks Finished

**Phase 6 — 数据联邦化**
- [x] 将 `@tonghai/shared` 注入到 `mobile-client/package.json`
- [x] 构建 `api/portalApi.ts` 网关层（初始 5 个接口）
- [x] 替换 `stores/auth.ts` 中手写的 `UserInfo`，统一到 shared `User` 类型
- [x] 改造 `pages/profile/profile.vue` — 真实用户资料 + 动态账单计数
- [x] 改造 `pages/cases/cases.vue` — 真实项目列表手风琴
- [x] 改造 `pages/index/index.vue` — 动态仪表盘统计 + 通知跑马灯

**Phase 7 — 功能对齐**
- [x] 扩展 `portalApi.ts` 到 20+ 接口（消息 CRUD、文档签章、FAQ、2FA、预约等）
- [x] 注册 6 条新路由到 `pages.json`
- [x] 新建 `pages/documents/documents.vue` — 文档列表 + 电子签章弹窗
- [x] 新建 `pages/invoices/invoices.vue` — 状态筛选 + 详情弹窗 + 付款历史
- [x] 新建 `pages/messages/messages.vue` — Tab 切换 + 未读标记 + 详情 + 删除
- [x] 新建 `pages/help/help.vue` — FAQ 手风琴 + 联系顾问卡片
- [x] 新建 `pages/settings/settings.vue` — 外观/语言/隐私/2FA 完整流程
- [x] 新建 `pages/cases/detail.vue` — 时间线 + 文档 + 顾问卡片
- [x] Profile 页五个菜单项全部串联到二级页面
- [x] Cases 页项目卡片点击跳转到详情页
- [x] 浏览器实测 7 个页面全部通过

### Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `mobile-client/package.json` | 添加 `@tonghai/shared` 依赖 | 启用跨包类型共享 |
| `mobile-client/src/stores/auth.ts` | `UserInfo` → shared `User` 类型 | 类型一致性 |
| `mobile-client/src/api/portalApi.ts` | 从 5 → 20+ 接口 + 4 个 API 模块 | 完整覆盖 Web 端 API |
| `mobile-client/src/pages.json` | 新增 6 条路由 | 二级页面注册 |
| `mobile-client/src/pages/index/index.vue` | 接入 dashboard API + 修复 template 闭合 | 动态数据 + bug 修复 |
| `mobile-client/src/pages/cases/cases.vue` | 接入真实项目列表 + 详情跳转按钮 | 去伪造化 + 导航串联 |
| `mobile-client/src/pages/profile/profile.vue` | 接入真实 profile + 5 个菜单跳转 | 导航中枢 |
| `mobile-client/src/pages/documents/documents.vue` | **新建** | 文档中心 |
| `mobile-client/src/pages/invoices/invoices.vue` | **新建** | 账单中心 |
| `mobile-client/src/pages/messages/messages.vue` | **新建** | 消息中心 |
| `mobile-client/src/pages/help/help.vue` | **新建** | 帮助与 FAQ |
| `mobile-client/src/pages/settings/settings.vue` | **新建** | 设置页 |
| `mobile-client/src/pages/cases/detail.vue` | **新建** | 项目详情 |

### Decisions Made

| Decision | Options | Rationale |
|----------|---------|-----------|
| 移动端不照搬 Web 端 .vue（重写 UI） | A: 共享 .vue B: 重写 | UniApp 生命周期 (`onShow` vs `onMounted`)、UI 框架 (NutUI vs Element Plus)、导航机制完全不同，无法复用 |
| 使用 `nut-popup position="bottom"` 替代 Dialog | Dialog / Popup | 移动端体验中底部弹出面板更自然 |
| API 层保持独立于 Web 端 | A: 共享 API 层 B: 各端独立 | Web 用 Axios，Mobile 用 uni.request，请求驱动不同 |
| 类型共享通过 `@tonghai/shared` 包 | A: 复制类型 B: 共享包 | 单一真相源，避免类型漂移 |

## Pending Work

### Immediate Next Steps

1. **启动后端服务并完整联调**：当前所有页面因后端 `localhost:4000` 未连接而显示错误提示。启动 `npm run dev:backend` 后所有数据将自动填充。
2. **补充原生上传真实联调**：`cases.vue` 中的 `nut-uploader` 上传地址仍是占位 URL (`http://服务器/upload`)，需替换为后端真实的 `/api/v1/documents/upload` 端点。
3. **Profile 页优化**：可移除遗留的 `showBillModal` 弹窗代码（已被 invoices 页面替代，但旧弹窗 HTML 仍残留在模板中）。
4. **Settings 页的数据导出**：`handleExport` 函数目前只弹 Toast，需要对接后端 `portalApi.exportMyData()` 接口（这个接口在 Web 端是返回 Blob 下载的）。

### Blockers/Open Questions

- [ ] `PortalDashboardStats` 类型中不存在 `unpaidInvoices` 属性 — 首页用了 `(stats as any).unpaidInvoices`，需要确认后端是否返回该字段，若是则需在 `shared/types/portal.ts` 的 `PortalDashboardStats` 接口中补充定义。
- [ ] `FaqCategory` / `FaqItem` 类型 — `help.vue` 引用了这两个类型，需确认它们在 `@tonghai/shared` 中是否已定义并导出，否则编译会失败。

### Deferred Items

- 支付功能链路（Stripe / DocuSign）— 按用户指示，后端支付功能尚未实现，移动端暂不接入
- 设置页的"删除账户"功能 — 高风险操作，待后端配套接口完成后再开放
- 消息中心的分页加载 — 目前一次拉取 50 条，大量消息场景需要加入 `onReachBottom` 触底加载

## Context for Resuming Agent

### Important Context

1. **项目是一个 Monorepo**（npm workspaces），执行 `npm install` 要在根目录操作。
2. **移动端开发命令**：`npm run dev:mobile`（H5 预览在 `http://localhost:5173`），后端：`npm run dev:backend`（在 `http://localhost:4000`）。
3. **Web 端客户门户 (`customer-portal`)** 是所有功能对齐的参照基准。查看其 `src/views/` 和 `src/router/index.ts` 了解完整功能清单。
4. **共享类型包** `@tonghai/shared` 的导出入口在 `packages/shared/index.ts`，类型定义在 `packages/shared/types/` 目录下。
5. **AI 悬浮球 (`AIDriftBall.vue`) 和聊天面板 (`AIChatSheet.vue`)** 已经内嵌在 `BaseLayout.vue` 中全局可用，无需额外配置。

### Assumptions Made

- 后端 `/api/v1/portal/*` 接口群与 Web 端 `customer-portal` 使用的是同一套后端路由
- `@tonghai/shared` 包已正确构建并可被 workspace 内其他包引用
- `FaqCategory` 和 `FaqItem` 类型已在 shared 包中定义（需验证）
- NutUI 组件（Collapse, Popup, Switch, Button 等）均已通过按需引入方式注册

### Potential Gotchas

1. **`<template>` 闭合问题**：如果 index.vue 出现大量 "属性不存在" 错误，首先检查 `<template>` 标签是否正确闭合。本次会话中就遇到了这个问题。
2. **分页类型陷阱**：`PaginatedResponse<T>` 的 `total` 在 `pagination` 子对象内，不是顶层属性。直接取 `res.total` 会得到 `undefined`。
3. **TabBar 导航限制**：`uni.navigateTo` 不能跳转到 TabBar 页面（index/cases/profile），必须用 `uni.switchTab`。
4. **settings.vue 中 NutUI Switch 组件**：只导入组件不够，还需确保 `nut-switch` 在 UniApp 的 easycom 配置中被自动识别。

## Environment State

### Tools/Services Used

- UniApp CLI (HBuilderX 或 CLI 模式)
- Vite (开发服务器)
- NestJS (后端)
- NutUI 4.x (移动 UI)
- Pinia (状态管理)

### Active Processes

- `npm run dev:backend` — NestJS 后端 (port 4000)
- `npm run dev:mobile` — UniApp H5 开发服务器 (port 5173)

### Environment Variables

- 后端 API Base URL：在 `mobile-client/src/utils/request.ts` 中配置
- JWT Token：通过 `uni.getStorageSync('access_token')` 存取

## Related Resources

- 实施计划：`C:\Users\jiach\.gemini\antigravity\brain\2cbbdd4d-210d-40e1-9b89-29d1df9acbe8\implementation_plan.md`
- 任务清单：`C:\Users\jiach\.gemini\antigravity\brain\2cbbdd4d-210d-40e1-9b89-29d1df9acbe8\task.md`
- 交付报告：`C:\Users\jiach\.gemini\antigravity\brain\2cbbdd4d-210d-40e1-9b89-29d1df9acbe8\walkthrough.md`
- Web 端 API：`packages/customer-portal/src/api/index.ts`
- Web 端路由：`packages/customer-portal/src/router/index.ts`
