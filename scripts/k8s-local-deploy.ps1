$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " TongHai CRM 本地 K8s 测试环境部署脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 构建本地镜像
Write-Host "🚀 第一步: 构建本地 Docker 镜像" -ForegroundColor Yellow

$Images = @(
    @{ Name = "thny-backend"; Dockerfile = "docker/backend.Dockerfile" },
    @{ Name = "thny-management"; Dockerfile = "docker/management.Dockerfile" },
    @{ Name = "thny-portal"; Dockerfile = "docker/portal.Dockerfile" },
    @{ Name = "thny-website"; Dockerfile = "docker/website.Dockerfile" }
)

foreach ($img in $Images) {
    $ImageName = "$($img.Name):local"
    Write-Host "`n🔨 正在构建 $ImageName..." -ForegroundColor Cyan
    docker build -t $ImageName -f $img.Dockerfile .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 构建 $ImageName 失败！" -ForegroundColor Red
        exit 1
    }
}
Write-Host "`n✅ 镜像构建完成！" -ForegroundColor Green

# 2. 部署 K8s 资源
Write-Host "`n🚀 第二步: 应用 K8s 清单文件" -ForegroundColor Yellow

# 检查/创建 namespace
kubectl apply -f k8s/local/namespace.yaml

# 应用基础配置
Write-Host "正在应用 ConfigMap 和 Secrets..." -ForegroundColor Cyan
kubectl apply -f k8s/local/configmap.yaml
kubectl apply -f k8s/local/secrets.yaml

# 应用基础设施 (PostgreSQL + Redis)
Write-Host "正在部署基础设施 (PostgreSQL, Redis)..." -ForegroundColor Cyan
kubectl apply -f k8s/local/postgres.yaml
kubectl apply -f k8s/local/redis.yaml

Write-Host "等待基础设施就绪 (最多等待 60 秒)..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l "app in (postgres, redis)" -n tonghai-dev --timeout=60s

# 应用核心后端
Write-Host "`n正在部署 Backend (API)..." -ForegroundColor Cyan
kubectl apply -f k8s/local/backend.yaml

Write-Host "等待 Backend 就绪 (最多等待 60 秒)..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=backend -n tonghai-dev --timeout=60s

# 应用前端
Write-Host "`n正在部署前端服务..." -ForegroundColor Cyan
kubectl apply -f k8s/local/website.yaml
kubectl apply -f k8s/local/management.yaml
kubectl apply -f k8s/local/portal.yaml

Write-Host "等待所有前端服务就绪..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l "app in (website, management, portal)" -n tonghai-dev --timeout=60s

# 3. 结果汇总
Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host " 🎉 本地 K8s 测试环境部署完成！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " 服务访问地址:"
Write-Host " - Website 官网:   http://localhost:30080"
Write-Host " - Management:     http://localhost:30081"
Write-Host " - Customer Portal: http://localhost:30082"
Write-Host ""
Write-Host " Backend API 健康检查: http://localhost:4000/api/v1/health (需要 kubectl port-forward 才能直接访问)"
Write-Host " -> kubectl port-forward svc/backend 4000:4000 -n tonghai-dev"
Write-Host ""
Write-Host "如需彻底清理环境，请运行 :"
Write-Host " -> .\scripts\k8s-local-teardown.ps1"
Write-Host "=========================================" -ForegroundColor Cyan
