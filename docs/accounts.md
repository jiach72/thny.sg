我已经在后端的开发环境种子数据 (

backend/prisma/seed.ts
) 中找到了为您设置的测试账号和密码。所有角色的测试密码统一为：password123。

以下是各个系统的常用测试账号：

👨‍💻 管理后台 (Management CRM - 端口 3001)
超级管理员 (Admin)
邮箱：admin@thny.sg
密码：password123
交付经理 (Manager)
邮箱：zhaoliu@thny.sg
密码：password123
销售顾问 (Sales)
邮箱：lisi@thny.sg
密码：password123
👤 客户门户 (Customer Portal - 端口 3002)
演示客户 1（此账号名下有项目和任务的演示数据）
邮箱：client@example.com
密码：password123
演示客户 2
邮箱：liming@startup.io
密码：password123
演示客户 3
邮箱：harvey@global.com
密码：password123
您可以分别使用 admin@thny.sg 登录 http://localhost:3001，以及使用 client@example.com 登录 http://localhost:3002，然后静默等待 12 秒钟（不移动鼠标）来测试我们的“限制超时自动登出”功能。测试完成后，我可以再帮您把超时时间恢复成正常的 30 分钟。