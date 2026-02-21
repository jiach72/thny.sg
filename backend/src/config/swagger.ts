import swaggerJsdoc from 'swagger-jsdoc'

/**
 * Swagger/OpenAPI 配置
 * 访问 /api-docs 查看 API 文档（仅开发环境）
 */
const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TongHai CRM API',
            version: '2.0.0',
            description: '通海南洋 CRM 系统 API 文档 — 包含认证、线索管理、客户管理、项目管理、任务管理等接口',
            contact: {
                name: 'TongHai Tech',
            },
        },
        servers: [
            {
                url: '/api/v1',
                description: 'API v1',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: '使用 JWT Token 认证。请先通过 /auth/login 获取 token',
                },
            },
            schemas: {
                // 通用响应格式
                ApiResponse: {
                    type: 'object',
                    properties: {
                        code: { type: 'integer', example: 200 },
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Success' },
                        data: { type: 'object', nullable: true },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        code: { type: 'integer', example: 400 },
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: '请求参数错误' },
                        data: { type: 'object', nullable: true },
                        errorCode: { type: 'string', example: 'BAD_REQUEST' },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        total: { type: 'integer', example: 100 },
                        totalPages: { type: 'integer', example: 10 },
                    },
                },
            },
        },
        security: [
            { bearerAuth: [] },
        ],
    },
    // 扫描路由文件中的 JSDoc 注释
    apis: ['./src/routes/*.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)
export default swaggerSpec
