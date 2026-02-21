# 交接文档: CRM 第三阶段完成 & 安全加固

## 会话元信息
- **创建时间**: 2026-02-21 11:05:00
- **项目路径**: `C:\Users\jiach\Documents\AntigravityCode\thny.sg`
- **分支**: main
- **会话时长**: ~2 小时

---

## 当前状态总结

CRM 2.0 系统已成功完成**第二阶段**（客户门户功能补全，包含 2FA 双因素认证）和**第三阶段**（后端基础设施、可观测性与安全加固）。高风险服务层已通过 Redis Token 黑名单、Morgan + Winston 端到端 HTTP 请求日志、优雅关机钩子和全面的 Vitest 覆盖进行了安全加固。下一步可能是最终部署准备和用户验收测试（UAT）。

---

## 代码库理解

### 架构概览

- **前端**: 分为 `management`（管理端）、`customer-portal`（客户门户）和 `website`（官网）三个包。
- **后端**: Express + Prisma 应用。现已注入强大的基础设施守护层：
  - `morgan` 日志流接入 `winston` 做访问日志记录
  - `ioredis` 缓存用于性能提速（cacheService）和安全保障（JWT 吊销黑名单）
  - 优雅的 PM2/进程关机流程，拦截 `SIGINT/SIGTERM` 信号并映射到 Prisma 和 Redis 断连
- **测试**: Vitest + `vitest-mock-extended` 已配置并成功对领域服务执行测试

### 关键文件

| 文件 | 用途 | 相关说明 |
|------|------|----------|
| `backend/src/index.ts` | 服务入口 | 已修改：集成 Morgan 日志 + 优雅关机监听器 |
| `backend/src/services/authService.ts` | 认证逻辑 | 增强：OTPLib 2FA + Redis 刷新令牌吊销查询 |
| `backend/tests/services/*.test.ts` | 单元测试 | 绿色测试套件，验证 cacheService 和 notificationService |
| `packages/customer-portal/src/views/settings/Settings.vue` | 用户设置 | 集成 TOTP 绑定 QR 码的 UI 对话框 |
| `packages/website/src/views/Home.vue` | 官网首页 | 清理了 `<a href="#">` 空链接，确保 SEO 和 UX 稳定 |

### 发现的关键模式

- **ESM 模块 + Vitest**: 后端使用 ES 导入（`"type": "module"`）。编写测试时，必须使用 `vi.hoisted()` 进行模块模拟，以避免 mock 交叉污染。
- **Token 黑名单机制**: 认证吊销严重依赖于提取 Token TTL 并在 Redis SET 命令上设置匹配的 TTL。

---

## 已完成工作

### 完成的任务

- [x] 在后端实现 TOTP 2FA 逻辑（`otplib`、`qrcode`），并在客户门户创建前端弹窗
- [x] 修复严重的 `refreshToken` 漏洞 — 已吊销的 Token 之前可被用于重新生成会话，Redis 黑名单现在拦截 `refreshToken` 调用
- [x] 解决 Prisma 缓存导致的 TypeScript 漂移和 Schema 不同步问题
- [x] 接入 `morgan` 日志器捕获所有 API 访问详情
- [x] 安装 Node 信号监听器（`gracefulShutdown`）优雅释放 IO 依赖
- [x] 为 `cacheService` 和 `notificationService` 创建高覆盖率 Vitest 测试套件
- [x] 扫描并移除 `website/Home.vue` 中的死链锚点

### 决策记录

| 决策 | 考虑过的方案 | 理由 |
|------|-------------|------|
| Vitest 使用 `vi.hoisted` 模拟模块 | 内联模块模拟 vs 提升模拟 | ESM 严格解析在 `vi.mock` 内引用顶层变量时会崩溃 |
| 2FA UI 使用 Element Plus 原生组件 | 第三方 QR 库 vs Canvas 渲染 | 减少依赖，直接使用后端 `QRCode.toDataURL` 输出到 `<img>` 标签更轻量 |

---

## 待完成工作

### 下一步行动

1. **第五阶段（验证）**: 如需要，在测试环境进行全面的端到端测试
2. 检查新增的 **2FA 流程** 是否在移动端界面满足物理 UI 预期

### 阻塞项/未决问题

- 无。后端测试和前端构建输出均为绿色。

---

## 恢复工作的重要上下文

- **TypeScript 强制要求**: 拉取此代码后确保运行 `npx prisma generate`，因为 `twoFactorEnabled` 和 `twoFactorSecret` 字段最近被添加到 `User` 模型
- 在 `backend/tests` 中做补充测试时，始终模拟 `./config/logger.js`、`./config/redis.js` 和 `./config/index.js`（Prisma），以防止实际网络握手影响测试运行器。目前所有测试在隔离环境中运行极快。
