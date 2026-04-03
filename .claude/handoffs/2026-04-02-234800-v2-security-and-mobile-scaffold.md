# Handoff: 通海南洋 V2.0 安全清理与全栈移动基座搭建

## Session Metadata
- Created: 2026-04-02T23:48:00+08:00
- Project: c:\Users\jiach\Documents\AntigravityCode\thny.sg
- Branch: main
- Session duration: ~2.5 小时
- Conversation ID: f6f10dc1-4408-4fb3-a72a-5995bf159330

## Current State Summary

本次会话完成了两大里程碑：**V1 安全债务清算** 和 **V2 移动端全栈鉴权闭环搭建**。

安全方面：彻底移除了带有原型链污染风险的 `xlsx` 库，升级了存在 SMTP 注入漏洞的 `nodemailer`，运行时漏洞已归零。

工程方面：在 Monorepo 中新建了 `packages/mobile-client`（UniApp + Vue3 + Vite + NutUI），完成了 Pinia Auth Store、HTTP 请求封装（含 401 无感刷新）、深色毛玻璃登录页、登录后首页，并通过浏览器截图验证了 H5 渲染效果。**代码尚未 git commit**。

## Codebase Understanding

### Architecture Overview

```
tonghai-nanyang/                    # npm workspaces monorepo
├── backend/                        # Express + Prisma + PostgreSQL
│   ├── src/routes/auth.ts          # JWT 鉴权路由 (Login/Refresh/2FA/Logout)
│   ├── src/services/authService.ts # 核心鉴权逻辑 (bcrypt/JWT/TOTP)
│   └── src/config/env.ts           # Zod 环境变量校验 + CORS 白名单
├── packages/
│   ├── website/                    # 官网 (Nuxt)
│   ├── management/                 # 后台管理 (Vue3)
│   ├── customer-portal/            # 客户门户 (Vue3)
│   └── mobile-client/    ← NEW    # 移动端 (UniApp + Vue3 + NutUI)
│       ├── src/utils/request.ts    # HTTP 封装 + JWT 自动注入
│       ├── src/stores/auth.ts      # Pinia 鉴权中枢
│       ├── src/pages/login/        # 登录页
│       └── src/pages/index/        # 首页
└── docker/                         # 部署配置
```

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `backend/src/routes/auth.ts` | JWT 登录/刷新/登出全流程 | 移动端所有鉴权 API 的后端实现 |
| `backend/src/config/env.ts` | 环境变量 + CORS 白名单 | 已新增 `MOBILE_URL` (默认 localhost:5173) |
| `packages/mobile-client/src/utils/request.ts` | uni.request 封装 | 自动 Bearer 注入 + 401 无感刷新 + 请求排队 |
| `packages/mobile-client/src/stores/auth.ts` | Pinia auth store | login/logout/2FA/持久化 |
| `packages/mobile-client/vite.config.ts` | Vite 构建配置 | NutUI 按需解析 + SCSS 变量注入 |
| `packages/mobile-client/src/pages.json` | UniApp 路由配置 | login 为启动页，index 为主页 |

### Key Patterns Discovered

- **后端响应格式**：统一使用 `{ code: 200, data: T, message?: string }` 结构，前端 `request.ts` 自动解包为 `data` 部分
- **RefreshToken 双通道**：后端同时支持 httpOnly Cookie（Web 端）和 body 参数传递（移动端），无需修改后端代码
- **NutUI 兼容性**：`nut-form` + `nut-input` 在 H5 模式下有渲染 bug（详见"Potential Gotchas"），当前方案是输入框用原生 `<input>`、按钮用 `<nut-button>`

## Work Completed

### Tasks Finished

- [x] **P0 安全修复**：移除 `xlsx` 库（原型链污染），重写 `faqAdmin.ts` 模板下载为 `exceljs`
- [x] **P0 安全修复**：升级 `nodemailer` 至 ^8.0.4（封堵 SMTP 命令注入 CVE）
- [x] **验证**：`express-rate-limit` 的 `trust proxy` 配置正确
- [x] **Monorepo 扩展**：创建 `packages/mobile-client` 并注册到 npm workspaces
- [x] **UI 引擎接入**：安装配置 `nutui-uniapp` + 按需引入解析器
- [x] **全栈鉴权贯通**：HTTP 封装 → Pinia Auth Store → 登录页 → 首页
- [x] **CORS 扩展**：后端新增 `MOBILE_URL` 白名单
- [x] **浏览器验证**：H5 dev server 启动成功，登录页渲染正常（截图已保存）

### Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `backend/package.json` | 移除 xlsx，升级 nodemailer 至 ^8.0.4 | 安全漏洞修复 |
| `backend/src/routes/faqAdmin.ts` | 重写模板下载路由使用 exceljs | 替换有漏洞的 xlsx |
| `backend/src/config/env.ts` | 新增 MOBILE_URL 环境变量 + CORS | 移动端 H5 跨域访问 |
| `package.json` (根) | 新增 dev:mobile / build:mobile 脚本 | 快捷启动命令 |
| `packages/mobile-client/` (整体新建) | UniApp 骨架 + NutUI + Pinia + Auth 全流程 | V2 移动端基座 |

### Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| 电子签名接入大型第三方 (DocuSign/法大大) | 自建手绘签名面板 vs 第三方 | 法律效力更高，合规度有保证 |
| 支付优先 Stripe | Stripe vs 微信支付跨境 vs 银联 | Stripe 国际化覆盖最广，接入成本低 |
| UI 引擎选 NutUI | NutUI vs uView-Plus | NutUI 更轻量、默认审美更现代，符合 Premium 定位 |
| 输入框用原生 `<input>` | nut-input vs 原生 input | nut-input 在 H5 模式有渲染 bug |
| 依赖安装用 `--legacy-peer-deps` | 正常安装 vs legacy | UniApp 的 dcloudio 包引发 peer 冲突 |

## Pending Work

### Immediate Next Steps

1. **Git commit 当前所有改动** — 本次工作尚未提交到仓库
2. **NutUI 主题定制** — 当前 NutUI 按钮是默认红色，需要通过 SCSS 变量覆盖为品牌色（建议 #3b82f6 蓝紫渐变）
3. **向导式时间轴 (Wizard Timeline)** — V2 的核心 UI 交互组件，将传统长表单拆解为分步向导
4. **AI 客服悬浮球** — 把后端现有的 OpenAI 对话集成到移动端作为漂浮组件

### Blockers/Open Questions

- [ ] UniApp 对 DocuSign SDK 的兼容性尚未验证（需要 Spike）
- [ ] Stripe 移动端 SDK（Apple Pay / Google Pay）在小程序环境是否需要特殊容器
- [ ] 前端 `unhead` 等 13 个残留审计漏洞（仅 DevDependency，不影响运行时）

### Deferred Items

- 多语言 i18n 布局适配（马来语长文本的弹性 CSS）
- 数据库 `Json` 字段升级为 `JsonB`（性能优化，非紧急）
- Husky commit hooks 强制代码规范

## Context for Resuming Agent

### Important Context

1. **未提交代码**：所有工作均在 `main` 分支本地修改中，下次开始前请先 `git status` 确认并 commit
2. **依赖冲突**：`packages/mobile-client` 必须使用 `--legacy-peer-deps` 安装依赖，否则 dcloudio 会引发 ERESOLVE
3. **H5 端口**：移动端 dev server 运行在 `localhost:5173`，后端已将此地址加入 CORS
4. **V2 总体架构规划**：已归档在 Implementation Plan 中，记录了三大阶段（Auth Center → Premium UI → 支付合约）

### Assumptions Made

- 用户已在后端数据库中有可用的测试账号（如 admin@tonghai.sg）
- Redis 服务已启动（Token 黑名单机制依赖 Redis）
- 后端 `.env` 文件中 `DATABASE_URL` 等核心变量已配置

### Potential Gotchas

- ⚠️ **nutui-uniapp 的 nut-form + nut-input 在 H5 模式有 bug**：`Cannot read properties of undefined (reading 'password')`。当前的规避方案是用原生 `<input>` + 自定义 CSS
- ⚠️ **Sass Deprecation Warning**：启动时会报 `legacy-js-api` 和 `@import` 弃用警告，不影响功能，但 Dart Sass 3.0 后需要迁移
- ⚠️ **NutUI 默认主色是京东红**：如果不覆盖 SCSS 变量，按钮/组件会是红色而非品牌蓝

## Environment State

### Tools/Services Used

- Node.js (npm workspaces monorepo)
- UniApp CLI (`@dcloudio/vite-plugin-uni`)
- NutUI (`nutui-uniapp` + `@uni-helper/vite-plugin-uni-components`)
- Pinia (状态管理)

### Active Processes

- 无（dev server 已在会话结束时终止）

### Environment Variables

- `VITE_API_BASE_URL` — 移动端 `.env.development` 中配置，默认 `http://localhost:4000/api/v1`
- `MOBILE_URL` — 后端 `env.ts` 中新增，默认 `http://localhost:5173`
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — 后端 JWT 签发密钥（生产环境必须通过 .env 设置）

## Related Resources

- V2 总体架构规划：Implementation Plan (Conversation artifact)
- 安全审计结果：`audit_results.md` (Conversation artifact)
- 登录页截图：`login_page_verification_1775144569252.png` (Conversation artifact)
- 后端 Swagger 文档：启动后端后访问 `/api-docs`

## Quick Start for Next Session

```bash
# 1. 先提交当前工作
cd c:\Users\jiach\Documents\AntigravityCode\thny.sg
git add -A && git commit -m "feat(v2): security remediation + mobile client scaffold with auth"

# 2. 启动后端
npm run dev:backend

# 3. 启动移动端 H5 预览
npm run dev:mobile

# 4. 浏览器访问 http://localhost:5173 验证登录页
```
