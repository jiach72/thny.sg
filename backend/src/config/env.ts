import { z } from 'zod'
import dotenv from 'dotenv'
import crypto from 'crypto'
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

    // 2FA 加密密钥（独立于 JWT 密钥，用于加密 TOTP Secret）
    TWO_FA_ENCRYPTION_KEY: z.string().optional(),

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
    OPENAI_BASE_URL: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),

    // Stripe（可选）
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // Metrics
    METRICS_BEARER_TOKEN: z.string().optional(),

    // 管理员初始化（可选）
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
})

// ==================== 校验并解析 ====================

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    process.stderr.write('❌ 环境变量校验失败:\n')
    const formatted = parsed.error.format()
    // 打印每个字段的错误
    for (const [key, value] of Object.entries(formatted)) {
        if (key === '_errors') continue
        const errors = (value as { _errors?: string[] })?._errors
        if (errors && errors.length > 0) {
            process.stderr.write(`  ${key}: ${errors.join(', ')}\n`)
        }
    }
    process.exit(1)
}

const env = parsed.data

// ==================== 生产环境数据库连接池自动注入 ====================

// 生产环境下自动为 DATABASE_URL 追加连接池参数，防止连接耗尽
if (env.NODE_ENV === 'production') {
    try {
        const dbUrl = new URL(env.DATABASE_URL)
        if (!dbUrl.searchParams.has('connection_limit')) {
            dbUrl.searchParams.set('connection_limit', '20')
        }
        if (!dbUrl.searchParams.has('pool_timeout')) {
            dbUrl.searchParams.set('pool_timeout', '10')
        }
        env.DATABASE_URL = dbUrl.toString()
    } catch {
        // URL 解析失败时不阻断启动，仅记录警告
        process.stderr.write('⚠️ DATABASE_URL 解析失败，跳过连接池参数自动注入\n')
    }
}

// ==================== JWT 生产环境安全检查 ====================

if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
    process.stderr.write('❌ 安全错误: JWT_SECRET 环境变量必须在生产环境中设置\n')
    process.exit(1)
}

if (env.NODE_ENV !== 'production' && !env.JWT_SECRET) {
    process.stderr.write('\n⚠️ 警告: JWT_SECRET 未设置，使用开发默认密钥。请勿在生产环境使用！\n\n')
}

// ==================== Metrics 生产环境安全检查 ====================

if (env.NODE_ENV === 'production' && !env.METRICS_BEARER_TOKEN) {
    process.stderr.write('⚠️ 警告: METRICS_BEARER_TOKEN 未设置，/metrics 端点将返回 503。建议在环境变量中配置 METRICS_BEARER_TOKEN。\n')
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
        secret: env.JWT_SECRET || 'dev-secret-' + crypto.randomUUID(),
        refreshSecret: env.JWT_REFRESH_SECRET || env.JWT_SECRET || 'dev-refresh-' + crypto.randomUUID(),
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
        baseUrl: env.OPENAI_BASE_URL,
        model: env.OPENAI_MODEL,
    },

    // Stripe
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,

    // 管理员初始化
    adminEmail: env.ADMIN_EMAIL,
    adminPassword: env.ADMIN_PASSWORD,

    // Metrics
    metricsBearerToken: env.METRICS_BEARER_TOKEN,
}

export default config
