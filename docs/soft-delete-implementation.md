# 数据库软删除实施方案

## 背景

当前 Prisma Schema 缺少软删除机制（Soft Delete），这会导致：
- 数据一旦删除无法恢复
- 无法追踪历史数据
- 不符合企业级 CRM 数据保留要求

## 实施方案

### 1. 添加 deletedAt 字段

在需要软删除的模型中添加字段：

```prisma
model Lead {
  // ... 现有字段
  deletedAt DateTime? @map("deleted_at")
  
  @@index([deletedAt])
}

model Customer {
  // ... 现有字段
  deletedAt DateTime? @map("deleted_at")
  
  @@index([deletedAt])
}

model Project {
  // ... 现有字段
  deletedAt DateTime? @map("deleted_at")
  
  @@index([deletedAt])
}
```

### 2. 推荐添加软删除的模型

| 模型 | 优先级 | 理由 |
|------|--------|------|
| `Lead` | 高 | 线索数据需要追溯 |
| `Customer` | 高 | 客户信息不应物理删除 |
| `Project` | 高 | 项目历史需要保留 |
| `Task` | 中 | 任务记录便于审计 |
| `Document` | 中 | 文档可能需要恢复 |
| `Invoice` | 高 | 财务数据必须保留 |
| `Payment` | 高 | 付款记录不可删除 |

### 3. 服务层修改

创建通用软删除方法：

```typescript
// services/softDelete.ts
export async function softDelete<T>(
  prisma: PrismaClient,
  model: keyof PrismaClient,
  id: string
): Promise<T> {
  return (prisma[model] as any).update({
    where: { id },
    data: { deletedAt: new Date() }
  })
}

export async function restore<T>(
  prisma: PrismaClient,
  model: keyof PrismaClient,
  id: string
): Promise<T> {
  return (prisma[model] as any).update({
    where: { id },
    data: { deletedAt: null }
  })
}
```

### 4. 查询中过滤已删除数据

使用 Prisma 中间件或在每个查询中添加条件：

```typescript
// 中间件方式 (推荐)
prisma.$use(async (params, next) => {
  if (params.action === 'findMany' || params.action === 'findFirst') {
    if (!params.args) params.args = {}
    if (!params.args.where) params.args.where = {}
    params.args.where.deletedAt = null
  }
  return next(params)
})
```

### 5. 迁移步骤

1. 修改 `schema.prisma` 添加 `deletedAt` 字段
2. 运行 `npx prisma migrate dev --name add_soft_delete`
3. 更新服务层使用软删除
4. 测试现有功能正常

## 注意事项

- 唯一约束需考虑 `deletedAt`（如 email 唯一性）
- 关联数据的级联软删除需要手动处理
- 定期归档或清理软删除数据
