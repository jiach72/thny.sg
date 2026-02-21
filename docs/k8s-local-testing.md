# K8s 本地测试环境指南

本指南用于在 **Docker Desktop 内置 Kubernetes** 环境下，部署并测试 TongHai CRM 系统的各个组件（Backend, Website, Management, Customer Portal 以及 PostgreSQL, Redis 基础设施）。

这主要用于验证 K8s 的服务发现（Service DNS解析）和基于 ConfigMap / Secret 的环境变量注入。

## 前置要求

1. **Docker Desktop** : 请确保已经在设置中开启了 **Enable Kubernetes** 选项，并且右下角的 K8s 图标显示为绿色运行状态。
2. **kubectl**: Docker Desktop 启用 K8s 后会自动安装 `kubectl` 并配置好上下文（`docker-desktop`）。
3. 确保本地没有其他服务占用以下端口：`80, 4000, 5432, 6379, 30080, 30081, 30082`

## 一键部署

在项目根目录（`thny.sg/`）下，运行 PowerShell 脚本进行自动构建和部署：

```powershell
.\scripts\k8s-local-deploy.ps1
```

该脚本将自动执行以下步骤：
1. 通过 `docker build` 将四个服务构建为本地镜像（`thny-*:local`）
2. 创建名为 `tonghai-dev` 的 Namespace
3. 创建 ConfigMap 和 Secret
4. 部署 `postgres` 和 `redis` 基础设施，并等待就绪
5. 部署 Backend API 并等待就绪
6. 部署前端三端服务（Website, Management, Portal）

## 服务访问与验证

### 前端访问
前端服务通过 Kubernetes 的 **NodePort** 直接暴露到本地主机上：

| 服务 | 访问地址 | 说明 |
|------|---------|------|
| **Website** (官网) | `http://localhost:30080` | 面向公众的展示门户 |
| **Management** (后台) | `http://localhost:30081` | CRM 系统管理后台 |
| **Portal** (客户门户) | `http://localhost:30082` | 供客户登录的平台 |

### 后端 API 验证

Backend API 部署在集群内部，你可以通过 `kubectl port-forward` 将其映射到本地进行测试：

```powershell
kubectl port-forward svc/backend 4000:4000 -n tonghai-dev
```

然后通过浏览器或 curl 访问健康检查接口：
```bash
curl http://localhost:4000/api/v1/health
```

期望返回类似于：
```json
{
  "status": "ok",
  "timestamp": "2024-03-XXT...",
  "uptime": 123,
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```
**注意：** 如果 `database` 和 `redis` 显示 `healthy`，则表示 K8s 的服务发现工作正常（Backend 成功通过 `postgres` 和 `redis` 主机名解析到了对应的 Pod）。

### 检查环境变量注入

可以通过进入 Backend Pod 验证环境变量：

```powershell
# 获取 Pod 名称
kubectl get pods -l app=backend -n tonghai-dev

# 进入 Pod 检查环境变量
kubectl exec -it <pod-name> -n tonghai-dev -- env | Select-String "DATABASE_URL|JWT_SECRET|NODE_ENV"
```

## 数据持久化

本地测试环境为 PostgreSQL 和 Redis 创建了简单的 Volume 生命周期（跟随 Deployment）。如果有需要清空数据，可以直接重新拉起对应的 Pod，或者执行彻底清理脚本后重新部署。

## 一键清理环境

测试完毕后，可以通过以下脚本彻底清理整个 `tonghai-dev` Namespace 的所有资源：

```powershell
.\scripts\k8s-local-teardown.ps1
```

执行期间，脚本会询问是否需要一并删除构建在本地的 Docker 镜像。根据需要输入 `y` 或 `n`。
