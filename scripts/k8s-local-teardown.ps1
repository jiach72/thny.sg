$ErrorActionPreference = "Continue"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " TongHai CRM 本地 K8s 测试环境清理脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🗑️ 正在删除 tonghai-dev 命名空间下的所有资源..." -ForegroundColor Yellow

# 删除 namespace（会自动清理里面所有的资源：Deployments, Services, ConfigMaps, Secrets 等）
kubectl delete namespace tonghai-dev

# 询问是否需要清理本地构建的镜像
$userInput = Read-Host "📦 是否需要清理本地构建的 Docker 镜像 (thny-*:local)？(y/N)"
if ($userInput -eq 'y' -or $userInput -eq 'Y') {
    Write-Host "🗑️ 正在清理本地镜像..." -ForegroundColor Yellow
    docker rmi thny-backend:local thny-management:local thny-website:local thny-portal:local 2>$null
    Write-Host "✅ 镜像清理完成。" -ForegroundColor Green
}

Write-Host "`n🎉 所有清理工作已完成！" -ForegroundColor Green
