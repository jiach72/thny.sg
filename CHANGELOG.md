# 通海南洋 CRM 变更日志

所有重要变更均记录于此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2026-04-15

### 新增
- 认证系统：JWT + httpOnly RefreshToken + RBAC + 2FA 双因素认证
- 客户管理：线索 → 客户转化流程、智能分配、SOP 任务模板
- 项目管理：项目创建、进度跟踪、文档管理
- 发票系统：发票创建/发送/付款记录/逾期检测
- 工作流引擎：工作流定义、SOP 步骤、逾期统计
- 消息系统：站内消息、实时聊天、WebSocket 支持
- 客户门户：个人资料管理、项目查看、文档签署、在线支付
- 官网：SSG 预渲染、多语言 (中/英/繁)
- 移动端：uni-app 跨平台 (H5/微信小程序)
- 监控系统：Sentry 错误追踪 (后端 + 3 前端)、Prometheus 指标、结构化日志
- 安全防护：Helmet + CSP + CORS + Rate Limit + SSRF 防护
- 部署方案：Docker 多阶段构建、GitHub Actions CI/CD、Nginx 反向代理

### 安全
- 修复 nodemailer SMTP 命令注入漏洞 (升级至 ^8.0.4)
- 修复 @unhead/vue XSS 绕过漏洞 (升级至 ^2.1.11)
- Metrics 端点生产强制 Bearer Token 认证
- Rate Limit 添加 Redis 存储 (多实例一致性)
- 生产 API 限流收紧至 60 次/分钟
- 请求来源验证 (CSRF 防护增强)
- 敏感操作审计日志

### 改进
- 后端 26 个 Service 单元测试通过 (185+ 测试)
- 前端 API 层 any 类型替换为具体接口定义
- Customer Portal manualChunks 分包策略
- API 响应缓存头 (ETag/Cache-Control)
- Prometheus 告警规则配置
- Grafana 监控仪表盘模板
- 运维手册和故障排查手册
