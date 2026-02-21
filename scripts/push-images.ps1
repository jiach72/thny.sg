$ErrorActionPreference = "Stop"

# 配置
$REGISTRY = "ghcr.io"
$NAMESPACE = "jiach72"
$TAG = "latest"

# 镜像列表
$Images = @(
    "thny-backend",
    "thny-management",
    "thny-portal",
    "thny-website"
)

Write-Host "🚀 开始推送 Docker 镜像到 GHCR..." -ForegroundColor Cyan

# 检查登录状态 (简单检查)
# docker login ghcr.io

foreach ($imgName in $Images) {
    $FullImageName = "$REGISTRY/$NAMESPACE/$($imgName):$TAG"
    Write-Host "`n📦 Pushing $FullImageName..." -ForegroundColor Yellow
    
    docker push $FullImageName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Pushed $FullImageName successfully." -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to push $FullImageName" -ForegroundColor Red
        # exit 1 
    }
}

Write-Host "`n🎉 所有镜像推送命令已执行完毕！" -ForegroundColor Green
