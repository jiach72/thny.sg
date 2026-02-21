$ErrorActionPreference = "Stop"

# 配置
$REGISTRY = "ghcr.io"
$NAMESPACE = "jiach72"
$TAG = "latest"

# 镜像列表
$Images = @(
    @{ Name = "thny-backend"; Dockerfile = "docker/backend.Dockerfile" },
    @{ Name = "thny-management"; Dockerfile = "docker/management.Dockerfile" },
    @{ Name = "thny-portal"; Dockerfile = "docker/portal.Dockerfile" },
    @{ Name = "thny-website"; Dockerfile = "docker/website.Dockerfile" }
)

Write-Host "🚀 开始构建 Docker 镜像..." -ForegroundColor Cyan

foreach ($img in $Images) {
    $ImageName = "$REGISTRY/$NAMESPACE/$($img.Name):$TAG"
    Write-Host "`n🔨 Building $ImageName from $($img.Dockerfile)..." -ForegroundColor Yellow
    
    # 必须在 Root 目录下执行，因为需要 copy shared packages
    docker build -t $ImageName -f $img.Dockerfile .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Built $ImageName successfully." -ForegroundColor Green
        
        # 询问是否推送
        # Write-Host "Pushing to registry..." -ForegroundColor Cyan
        # docker push $ImageName
    } else {
        Write-Host "❌ Failed to build $ImageName" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎉 所有镜像构建完成！" -ForegroundColor Green
Write-Host "如需推送，请取消脚本中的注释或手动运行: docker push <image_name>"
