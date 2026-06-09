# TongHai CRM (通海南洋客户关系管理系统)

面向新加坡移民/咨询行业的全栈CRM系统，包含管理端、客户门户、官网和移动端。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js 20 + Express + TypeScript + Prisma + PostgreSQL + Redis |
| 管理端 | Vue 3 + Element Plus + TypeScript + Vite |
| 客户门户 | Vue 3 + Tailwind CSS + TypeScript + Vite |
| 官网 | Vue 3 + Tailwind CSS + Vite |
| 移动端 | uni-app + Vue 3 |
| 基础设施 | Docker + GitHub Actions + Nginx + Prometheus + Grafana |

## 目录结构

```
thny.sg/
├── backend/          # Express API 服务
├── packages/
│   ├── management/   # CRM 管理端
│   ├── customer-portal/ # 客户门户
│   ├── website/      # 官网
│   ├── mobile-client/ # 移动端
│   └── shared/       # 共享类型和工具
├── docker/           # Docker 配置
├── docs/             # 文档
└── .github/          # CI/CD
```

## 快速启动

```bash
# 安装依赖
npm install

# 配置环境变量
cp backend/.env.example backend/.env

# 启动开发服务
npm run dev:backend    # API 服务 (http://localhost:5000)
npm run dev:management # CRM 管理端 (http://localhost:3001)
npm run dev:portal     # 客户门户 (http://localhost:3002)
npm run dev:website    # 官网 (http://localhost:3000)
```

## 生产部署

参见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 许可证

Proprietary
