# 0003. 后端采用 Express + Prisma

**状态**: 🟢 已采纳
**日期**: 2026-01-30

## 背景

需要一个后端服务来处理三个前端应用的 API 请求，管理数据库，并处理复杂的业务逻辑（如权限验证、工作流状态流转）。

## 选项

1.  **NestJS**
    *   利: 架构严谨，模块化强，适合超大型企业应用。
    *   弊: 概念多（DI, Modules, Decorators），上手成本高，对于本项目规模可能略显繁重。

2.  **Payload CMS**
    *   利: 自带 Admin UI，CMS 功能开箱即用。
    *   弊: 定制化复杂业务逻辑（如复杂的线索转化、特异性权限）时受限，且本项目已决定自建管理后台 UI。

3.  **Express + Prisma**
    *   利: Express 极其简单灵活，社区资源最丰富。Prisma 提供强类型的数据库操作，弥补了 Express 本身无类型的短板。
    *   弊: 架构约束弱，需要开发者自觉遵守代码分层规范。

## 决策

选择 **Express + Prisma**。

*   使用 **PostgreSQL** 作为数据库。
*   使用 **Prisma Schema** 定义单一数据源真理。
*   在 Express 中严格执行 `Controller -> Service -> Data Access` 的分层模式。

## 后果

*   [+] 开发 API 速度极快。
*   [+] Prisma 生成的类型可以直接共享给前端（通过 monorepo），实现端到端的类型安全。
*   [!] 需警惕 Controller 层逻辑膨胀，必须强制将业务逻辑下沉到 Service 层。
*   [!] 需清理项目中早期可能存在的 Payload CMS 混淆概念。
