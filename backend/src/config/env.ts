import { z } from 'zod'
import dotenv from 'dotenv'
dotenv.config()

// ==================== 环境变量 Schema 定义 ====================

const envSchema = z.object({
    // 服务配置
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    // 数据库
    DATABASE_URL: z.string().min(1, '❌ DATABASE_URL 必须设置'),

    // Redis
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // JWT
    JWT_SECRET: z.string().optional(),
    JWT_REFRESH_SECRET: z.string().optional(),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // 前端地址 (CORS)
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    MANAGEMENT_URL: z.string().default('http://localhost:3001'),
    PORTAL_URL: z.string().default('http://localhost:3002'),
    MOBILE_URL: z.string().default('http://localhost:5173'),

    // 文件上传
    UPLOAD_DIR: z.string().default('./uploads'),
    MAX_FILE_SIZE: z.coerce.number().int().positive().default(10485760), // 10MB

    // SMTP 邮件（可选）
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),

    // OpenAI（可选）
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
})

// ==================== 校验并解析 ====================

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    console.error('❌ 环境变量校验失败:')
    const formatted = parsed.error.format()
    // 打印每个字段的错误
    for (const [key, value] of Object.entries(formatted)) {
        if (key === '_errors') continue
        const errors = (value as { _errors?: string[] })?._errors
        if (errors && errors.length > 0) {
            console.error(`  ${key}: ${errors.join(', ')}`)
        }
    }
    process.exit(1)
}

const env = parsed.data

// ==================== JWT 生产环境安全检查 ====================

if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
    console.error('❌ 安全错误: JWT_SECRET 环境变量必须在生产环境中设置')
    process.exit(1)
}

// ==================== 导出配置对象 ====================

export const config = {
    // 服务配置
    nodeEnv: env.NODE_ENV,
    port: env.PORT,

    // 数据库
    databaseUrl: env.DATABASE_URL,

    // Redis
    redisUrl: env.REDIS_URL,

    // JWT
    jwt: {
        secret: env.JWT_SECRET || 'dev-secret-only-for-development',
        // Refresh Token 使用独立密钥（更高安全性）
        refreshSecret: env.JWT_REFRESH_SECRET || env.JWT_SECRET || 'dev-refresh-secret',
        expiresIn: env.JWT_EXPIRES_IN,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },

    // CORS
    cors: {
        origins: [
            env.FRONTEND_URL,
            env.MANAGEMENT_URL,
            env.PORTAL_URL,
            env.MOBILE_URL,
        ],
    },

    // 前端 URL（用于邮件/重定向等场景）
    frontendUrl: env.FRONTEND_URL,
    managementUrl: env.MANAGEMENT_URL,
    portalUrl: env.PORTAL_URL,

    // 文件上传
    upload: {
        dir: env.UPLOAD_DIR,
        maxSize: env.MAX_FILE_SIZE,
    },

    // SMTP 邮件
    smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        from: env.SMTP_FROM,
    },

    // OpenAI
    openai: {
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
    },
}

export default config
