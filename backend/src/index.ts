import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { createServer } from 'http'
import swaggerUi from 'swagger-ui-express'
import { config } from './config/index.js'
import { swaggerSpec } from './config/swagger.js'
import routes from './routes/index.js'
import { errorHandler } from './middlewares/index.js'
import { apiRateLimiter } from './middlewares/rateLimiter.js'
import { initWebSocket } from './services/websocketService.js'
import logger from './config/logger.js'
import morgan from 'morgan'
import { prisma } from './config/index.js'
import { closeRedis, getRedis } from './config/redis.js'
import { emailSenderService } from './services/emailSenderService.js'
import { apiVersionMiddleware } from './middlewares/index.js'

// *** 全局错误捕获（必须最早注册，确保线上能打印崩溃信息）***
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err)
    process.exit(1)
})
process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] Unhandled Rejection:', reason)
    process.exit(1)
})

const app = express()

// Sentry 初始化 (必须尽早引入)
Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    integrations: [
        nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
})

const httpServer = createServer(app)

// 配置 Morgan 将 HTTP 请求切片输出到 Winston 日志器
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))

// 初始化 WebSocket
initWebSocket(httpServer)

// 反向代理配置（让 rate limiter 获取真实客户 IP 而非 Nginx 内网 IP）
app.set('trust proxy', 1)

// CORS 配置
app.use(cors({
    origin: config.cors.origins,
    credentials: true,
}))

// 解析 Cookie（httpOnly refreshToken 存储需要）
app.use(cookieParser())

// 解析 JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 注入自定义 API 版本与降级提示中间件
app.use('/api', apiVersionMiddleware)

// Swagger API 文档（仅开发环境）
if (config.nodeEnv !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'TongHai CRM API 文档',
    }))
    // JSON 格式的 OpenAPI spec
    app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.send(swaggerSpec)
    })
}

// 全局 API 限流（每分钟 100 次请求/IP）
app.use('/api/v1', apiRateLimiter)

// API 路由
app.use('/api/v1', routes)

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        code: 'NOT_FOUND',
        message: `路由不存在: ${req.method} ${req.path}`,
    })
})

// Sentry 错误捕获中间件，应在自定义报错处理器前
Sentry.setupExpressErrorHandler(app);

// 自定义错误处理 (ErrorHandler 会接收被 Sentry 过滤后的流)
app.use(errorHandler)

// 启动服务器
const PORT = config.port

// 启动前初始化关联组件
async function bootstrap() {
    try {
        // ========== 1. 带重试的数据库连接 ==========
        let retries = 5;
        while (retries > 0) {
            try {
                await prisma.$connect();
                logger.info('✅ Prisma 数据库连接成功');
                break;
            } catch (err: any) {
                retries -= 1;
                logger.warn(`⏳ Prisma 连接数据库失败，剩余尝试次数: ${retries} (${err.message})...`);
                if (retries === 0) {
                    throw err;
                }
                await new Promise(res => setTimeout(res, 3000));
            }
        }

        // ========== 2. 初始化 Redis 连接 ==========
        try {
            const redis = getRedis();
            await redis.connect(); // 主动建立连接（lazyConnect 模式下需要显式调用）
            logger.info('✅ Redis 连接成功');
        } catch (err: any) {
            logger.warn(`⚠️ Redis 连接失败，进入降级模式: ${err.message}`);
            // Redis 失败不阻断启动，系统会使用内存降级方案
        }

        // ========== 3. 初始化邮件服务 ==========
        try {
            await emailSenderService.initialize();
        } catch (err) {
            logger.error('邮件服务初始化失败', err);
            // 邮件失败不阻断核心启动
        }

        // ========== 3. 启动 HTTP 服务 ==========
        httpServer.listen(PORT, '0.0.0.0', () => {
            logger.info(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🚀 TongHai CRM API Server                   ║
  ║                                               ║
  ║   Environment: ${config.nodeEnv.padEnd(30)}║
  ║   Port: ${String(PORT).padEnd(38)}║
  ║   API: http://localhost:${PORT}/api/v1${' '.repeat(14)}║
  ║   WebSocket: ✅                                ║
  ║   SMTP/Email: ✅                               ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
        });
    } catch (error) {
        logger.error('❌ 致命错误：核心服务启动失败', error);
        process.exit(1);
    }
}

bootstrap();

// ==================== 平滑退出 (Graceful Shutdown) ====================
async function gracefulShutdown(signal: string) {
    logger.info(`\n🛑 接收到 ${signal} 信号，准备进行平滑退出...`)

    // 超时保护：如果 10 秒内没有退出完成，则强制退出
    const forceExitTimer = setTimeout(() => {
        logger.error('⏰ 平滑退出超时（10s），强制退出')
        process.exit(1)
    }, 10_000)
    forceExitTimer.unref() // 不阻止进程退出

    try {
        // 1. 停止接受新的 HTTP 请求（等待现有连接排空）
        await new Promise<void>((resolve, reject) => {
            httpServer.close((err) => {
                if (err) {
                    logger.error('HTTP 服务器关闭时发生错误:', err)
                    reject(err)
                } else {
                    logger.info('✅ HTTP 服务器已停止接受新连接')
                    resolve()
                }
            })
        })

        // 2. 关闭 Redis 连接
        await closeRedis()

        // 3. 断开 Prisma 数据库连接
        await prisma.$disconnect()
        logger.info('✅ Prisma 数据库连接已断开')

        logger.info('👋 服务已安全退出')
        process.exit(0)
    } catch (error) {
        logger.error('💥 平滑退出过程中发生错误:', error)
        process.exit(1)
    }
}

// 监听终止信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export default app
