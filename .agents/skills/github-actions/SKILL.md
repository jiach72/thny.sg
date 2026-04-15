---
name: github-actions
version: "1.3"
description: GitHub Actions 工作流创建、安全及版本管理技能。适用于以下情况：(1) 编写新工作流文件(.yml)时，(2) 修改现有工作流时，(3) 审查或更新 Action 版本时，(4) CI/CD 安全审计时，(5) 处理包含 'actions/', 'uses:', 'workflow', '.github/workflows' 关键字的任务时
license: MIT
metadata:
  author: DaleStudy
allowed-tools: Bash(gh api:*)
---

# GitHub Actions

## 最佳实践

### 1. 使用最新的主版本

编写新工作流时，必须确认最新的主版本。

```yaml
# ❌ 直接引用分支 - 内容会变动
uses: actions/checkout@main

# ❌ 过旧的版本 - 最常见的错误
uses: actions/checkout@v5

# ✅ 最新主版本 (使用 gh api 确认后使用)
uses: actions/checkout@v6
```

> 参考：在安全敏感环境或使用低信任度的第三方 Action 时，请考虑 [SHA Pinning](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions)(`@a1b2c3...`)。

版本确认命令:

```bash
gh api repos/{owner}/{repo}/releases/latest --jq '.tag_name'

# 示例
gh api repos/actions/checkout/releases/latest --jq '.tag_name'
gh api repos/oven-sh/setup-bun/releases/latest --jq '.tag_name'
```

### 2. 最小权限原则

权限尽可能在低层级声明。保持最小范围。

```yaml
# 权限范围: step > job > workflow (越低越好)
jobs:
  build:
    permissions:
      contents: read # 仅 job 级别所需的权限
```

> 参考: [Modifying the permissions for the GITHUB_TOKEN](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token)

### 3. Secret 管理

```yaml
# ❌ 硬编码
env:
  API_KEY: "sk-1234567890"

# ✅ 使用 secrets
env:
  API_KEY: ${{ secrets.API_KEY }}
```

> 参考: [Using secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)

### 4. 防止输入注入

```yaml
# ❌ 易受注入攻击 - 直接使用 github.event
run: echo "${{ github.event.issue.title }}"

# ✅ 通过环境变量传递
env:
  ISSUE_TITLE: ${{ github.event.issue.title }}
run: echo "$ISSUE_TITLE"
```

> 参考: [Script injections](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#understanding-the-risk-of-script-injections)

### 5. Pull Request 安全

`pull_request_target` 允许 Fork 的 PR 访问 Secret。若检出 Fork 的代码，存在恶意代码执行风险。

```yaml
# ⚠️ 危险 - 在受信任的上下文中执行 Fork 的代码
on: pull_request_target
steps:
  - uses: actions/checkout@v{N}
    with:
      ref: ${{ github.event.pull_request.head.sha }} # 危险!
```

> 参考: [pull_request_target](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#pull_request_target)

## 推荐的工作流结构

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      # 版本请使用 gh api 确认
      - uses: actions/checkout@v{N}

      - name: Setup Bun
        uses: oven-sh/setup-bun@v{N}
```

## 常用的事件

```yaml
on:
  push: # 推送时
    branches: [main]
  pull_request: # PR 创建/更新时
    branches: [main]
  workflow_dispatch: # 手动触发
  schedule: # 定时执行
    - cron: "0 0 * * 1" # 每周一 00:00 UTC
  release: # 发布版本时
    types: [published]
  workflow_call: # 被其它工作流调用
```

## 常用的权限

```yaml
permissions:
  contents: read        # CI (构建/测试), 代码检出
  contents: write       # 提交/推送
  pull-requests: write  # PR 评论机器人
  issues: write         # Issue 评论
  packages: write       # 包发布 (需配合 contents: write)
  id-token: write       # OIDC 云认证 (需配合 contents: read)
```

## 常用的 Action

```yaml
# 版本请使用 gh api repos/{owner}/{repo}/releases/latest --jq '.tag_name' 确认
steps:
  - uses: actions/cache@v{N} # 依赖缓存
  - uses: actions/checkout@v{N} # 代码检出
  - uses: actions/download-artifact@v{N} # 下载构建产物
  - uses: actions/upload-artifact@v{N} # 上传构建产物
  - uses: oven-sh/setup-bun@v{N} # 设置 Bun
```
