# Handoff: 移动端全要素补齐与体验优化 (Phase 8 & 9)

## Session Metadata
- Created: 2026-04-03 22:02:31
- Project: C:\Users\jiach\Documents\AntigravityCode\thny.sg
- Branch: main
- Session duration: 约 2 小时

### Recent Commits (for context)
  - a1d244f chore(mobile): detach raw vue tsconfig to fix TS5.5 removed options error
  - e35c4b8 fix(mobile): resolve route options retrieval pattern and fix collapse collision
  - cf58c72 feat(mobile): integrate exportMyData API in settings
  - 314f115 fix(mobile): replace mocked upload URL with dynamic backend URL in cases
  - 553313d refactor(mobile): remove redundant showBillModal code from profile

## Handoff Chain

- **Continues from**: [2026-04-03-145700-mobile-feature-parity.md](./2026-04-03-145700-mobile-feature-parity.md)
  - Previous title: 2026-04-03-145700-mobile-feature-parity
- **Supersedes**: None

> Review the previous handoff for full context before filling this one.

## Current State Summary

通海南洋 APP (mobile-client) 已完成 Phase 8 和 Phase 9 的核心业务补全和体验增强。移动端已同 Web 门户实现了16/17项功能的对齐，涵盖了 Profile 改造、密码重置流程、家庭成员管理、通知偏好同步、以及基于首页的顾问卡片、会议预约、Onboarding 流程。AI 客服的前端外壳也已清理完毕，改为了正式的预上线提示状态。TypeScript 代码也完成了大范围的类型规整并实现了编译 0 报错。当前整个移动端属于稳定体验收尾期。

## Codebase Understanding

### Architecture Overview

- **Mobile Client (uni-app/Vue 3)**: 使用了基于组合式 API 的 Vue 3。页面数据依赖 `@tonghai/shared` 中的接口类型保证前后端对接的一致性。
- **状态追踪**: API 调用主要集中在 `portalApi.ts`，状态管理由 Pinia (`authStore`, `appStore`) 负责。

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `packages/mobile-client/src/pages/index/index.vue` | 首页 | 承载了最新追加的顾问卡片、会议预约弹窗、Onboarding 向导逻辑 |
| `packages/mobile-client/src/pages/profile/profile.vue` | 个人中心 | 用户信息编辑、密码修改、家庭成员管理的核心入口 |
| `packages/mobile-client/src/api/portalApi.ts` | 门户端点 | 承载端点更新、家庭成员、会议预约等 |
| `packages/mobile-client/src/components/AIChatSheet.vue` | 智能客服弹窗 | 目前状态为“即将上线”的预留组件 |

### Key Patterns Discovered

- `nut-popup` 是本项目极为高概率的弹层方案，包括会议预约、AI 面板、Onboarding 和咨询发起等均采纳了底部或中部弹出式抽屉配合表单。
- 类型强制抓取：在业务组件中，从 `statsRes` 或 `project` 等带问号类型调用时，尽量去规避 `as any`，本会话大量修复了这一点。

## Work Completed

### Tasks Finished

- [x] Phase 8: Profile Tab 全面内嵌资料编辑、密码修改及家庭成员管理
- [x] Phase 8: 新建忘记/重置密码流程及登录页入口支持
- [x] Phase 8: 绑定通知偏好前端开关至云端 `portalApi`
- [x] Phase 8 & 9: 解决移动端模板中十多处 `as any` casting，TypeScript 规整
- [x] Phase 9: 首页专属顾问卡片信息拉取与呈现
- [x] Phase 9: 顾问会议预约功能弹层（日期与时段芯片）
- [x] Phase 9: 首次注册用户的数字空间欢迎向导 (`Onboarding`)
- [x] Phase 9: AI 客服组件冗余信息的清理和安全期盼语写入

### Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `packages/mobile-client/src/pages/index/index.vue` | 追加顾问卡片、会议预约弹层、Milestones | 对齐业务全景，增强首页功能性 |
| `packages/mobile-client/src/pages/profile/profile.vue` | 重写 | 扩展能力，收敛原有碎片化弹出 |
| `packages/mobile-client/src/api/portalApi.ts` | 新增 CRUD、Preferences、Appointment | 后端已存在接口的前端接入 |
| `packages/mobile-client/src/pages.json` | 注册 `forgot-password`, `reset-password` | APP 路由完整性保障 |
| `packages/mobile-client/src/components/AIChatSheet.vue` | 删除硬编码互动 | 构建安全预埋机制 |

### Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| `Onboarding` 判定逻辑 | 使用状态库或 `localStorage` 配合项目数量 | `uni.getStorageSync` 方便且轻量，且针对没有 ActiveProjects 的新账号触发最合理。 |
| AI 客服处理 | 直接废弃整个按钮 vs 保留但是提示不可用 | 保留入口可以进行市场教育并传递出系统在进化，且框架逻辑均已就绪。 |

## Pending Work

### Immediate Next Steps

1. 介入 AI 的后端正式联调开发并实现 `AIChatSheet.vue` 中 `send` 后端接手流。
2. Android/iOS 真机实际编译上架流程。
3. 如果需要，为长列表（如发票和文档）添加虚拟滚动特性。

### Blockers/Open Questions

- [ ] 后端 AI Socket/SSE 是否已具备提供给移动端使用的环境和认证方案？

### Deferred Items

- 大列表的虚拟滚动控制（暂且数据量未引起阻塞）。

## Context for Resuming Agent

### Important Context

**当前移动端的 VUE 代码处于非常干净的 TS 态，业务流（特别像是 密码、预约、配置类数据）可以直接走 `portalApi` 互动。下阶段如果启动必定是后端服务接口与 AI SDK 的整合。** 请不要随意做底层布局组件的重大打破。

### Assumptions Made

- Next.js web 平台与该 Uni-app mobile 端后端接口表现形式为双轨统一，且目前不存在大的鉴权漏洞。

### Potential Gotchas

- Uni-app 在涉及到复杂 `<script setup>` 的时候，注意其特定的生命周期控制如 `onShow`, 不要随便混入非 Vue-route 的 Hooks 方案。

## Environment State

### Tools/Services Used

- 运行测试依赖: `vue-tsc` 类型检查
- Vue 3 + Vite 模式 Uni-App 配置

### Active Processes

- None

### Environment Variables

- None currently impacting frontend beyond standard Vite `.env` builds.

## Related Resources

- 设计组件库参阅: `@nutui/nutui` 

---

**Security Reminder**: Validation via `validate_handoff.py` pending.
