# 测试账号说明

## CRM 管理端测试账号

| 角色 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| **系统管理员** | `admin@thny.sg` | `password123` | 拥有所有模块权限 (Admin) |
| **项目经理/交付** | `zhaoliu@thny.sg` | `password123` | 负责项目跟进与文档处理 |
| **销售顾问** | `lisi@thny.sg` | `password123` | 负责线索分配与转换 |

## 客户门户测试账号

| 邮箱 | 密码 | 说明 |
|------|------|------|
| `client@example.com` | `password123` | 陈大文 |
| `liming@startup.io` | `password123` | 李明 |
| `harvey@global.com` | `password123` | Harvey Tan |

## 说明
- 所有密码统一为 `password123`
- CRM 管理端账号: 使用 `@thny.sg` 域名
- 客户门户账号: 使用客户原有邮箱


# 如果您配置了自动构建镜像：
docker compose pull backend
docker compose up -d backend
# 或者，如果您是在服务器上构建：
# docker compose build backend && docker compose up -d backend