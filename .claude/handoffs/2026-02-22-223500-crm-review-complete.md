# 会话交接：通海南洋 CRM 全盘审阅

**创建时间**: 2026-02-22 22:35 SGT  
**项目路径**: `c:\Users\jiach\Documents\AntigravityCode\thny.sg`  
**会话 ID**: `1953b553-fb5b-46f0-808a-7f07b56c53da`

---

## 当前状态

**已完成**: 16 轮多角色全盘复盘，产出 116 项改进提案。  
**未开始**: 所有修复实施工作。用户确认明天开始推进。

### 提案文档位置
- **终极版提案**: `C:\Users\jiach\.gemini\antigravity\brain\1953b553-fb5b-46f0-808a-7f07b56c53da\implementation_plan.md`
- 包含完整的 P0-Boot / P0-Auth / P0+ / P0 / P0-Arch / P0-OpSec / P1-P5 所有板块

---

## 关键上下文（必须知道）

### 1. 项目结构
- **Monorepo** (`packages/`)：`website`（官网）、`management`（CRM 管理端）、`customer-portal`（客户门户）、`shared`（共享类型）
- **Backend**: `backend/` — Express + Prisma + PostgreSQL + Redis
- **部署**: Docker Compose + 已部署过 K8s（crash 日志显示 kube-probe）

### 2. 客户来源
**中国大陆 + 港澳台** — 这是最核心的约束条件，导致大量被墙资源问题

### 3. 致命级问题 Top 5
1. **Seed 脚本混合** = 系统无法交付（RBAC+测试数据不可分离）
2. **无设置密码 API** = `setupToken` Schema 有但代码未实现
3. **测试账号 `password123` 在 Git** = `docs/TEST_ACCOUNTS.md` + `backend/prisma/seed.ts`
4. **JWT 存 localStorage** = XSS 可窃取
5. **Google Fonts / Unsplash 被墙** = 大陆用户无字体/白屏

### 4. 16 轮复盘角色覆盖
技术×3、官网访客×1、门户客户×1、CRM员工×1、大中华客户×2、架构师×1、运维×1、财务×1、律师×1、员工×1、盲区扫描×1、交付验证×1、认证安全×1

---

## 明天的立即下一步

用户尚未明确优先顺序。恢复时应：
1. **先问用户**想优先推进哪些板块
2. 参考提案中的"致命级 Top 10"和 Gantt 图建议顺序
3. 预计最优先：P0-Boot（seed 拆分 + setupToken 实现）和 P0+（Fonts/Unsplash 本地化）

---

## 关键文件速查

| 文件 | 用途 |
|------|------|
| `backend/prisma/seed.ts` | 需拆分的种子脚本（RBAC+测试混合） |
| `backend/prisma/schema.prisma` | 920 行，含 setupToken 字段 |
| `backend/src/config/redis.ts` | closeRedis 需修 graceful shutdown |
| `backend/Dockerfile` | 需加 USER node + .dockerignore |
| `packages/website/src/i18n/index.ts` | 默认语言需改 |
| `packages/website/src/assets/styles/main.css` | Google Fonts 引用 |
| `packages/management/src/stores/authStore.ts` | JWT localStorage 存储 |
| `packages/customer-portal/src/stores/authStore.ts` | 同上 |
| `docs/TEST_ACCOUNTS.md` | 需删除（含明文密码） |
| `backend_crash2.txt` | Redis 断连导致的生产崩溃日志 |

---

## 决策记录

| 决策 | 理由 |
|------|------|
| 提案按角色分板块而非按技术分层 | 用户明确要求从不同角色视角复盘 |
| P0-Boot 定义为最高优先 | 不修此项系统完全无法交付给客户 |
| JWT 建议迁移至 httpOnly cookie | localStorage 在 XSS 下不安全，高端金融客户数据需更高安全标准 |
| 建议 seed 拆为 3 层 | rbac（幂等）+ admin（ENV 驱动）+ demo（仅 dev） |

---

## 潜在陷阱

1. **seed.ts 是 Prisma 的默认入口** — `package.json` 中 `prisma.seed` 指向它，拆分时需同步改配置
2. **前端有 refreshToken 代码但后端可能缺端点** — 需先确认后端 auth 路由再决定前端改动范围
3. **K8s 配置散落在某处** — crash 日志证明存在但提案未覆盖具体文件位置
4. **Unsplash 图片 URL 散布多处** — 需 grep 完整扫描，不仅门户还有 seed.ts 中的 avatarUrl
